"""Authentication seam and role-based access control.

Endpoints depend only on :class:`Principal` and :func:`require_role`. Three identity
sources exist:

- A Google ID token sent as ``Authorization: Bearer <token>`` (ADR-009). The web app holds
  it in an httpOnly cookie and attaches it on server-side calls; the API verifies issuer,
  audience, expiry and signature against Google's JWKS. Google users are members.
- An admin session token, also sent as a bearer token (ADR-015). The API issues it after a
  username and password check and signs it with ``ADMIN_TOKEN_SECRET`` (HS256); it carries
  the ``admin`` role. Tokens are told apart by their ``iss`` claim before verification.
- A development fixture selected with the ``X-Dev-Principal`` header, available when
  ``DEV_AUTH_ENABLED`` is true. Settings validation refuses that flag in staging and
  production, so the fixture cannot leak there.
"""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from typing import Annotated, Protocol

import jwt
from fastapi import Depends, Request

from app.core.config import Settings
from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.logging import get_logger

logger = get_logger(__name__)

DEV_PRINCIPAL_HEADER = "X-Dev-Principal"
GOOGLE_ISSUERS = ("https://accounts.google.com", "accounts.google.com")
GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
ADMIN_TOKEN_ISSUER = "vietnamcv-admin"  # noqa: S105 - a JWT claim, not a secret
ADMIN_TOKEN_AUDIENCE = "vietnamcv-api"  # noqa: S105 - a JWT claim, not a secret
ADMIN_SUBJECT_PREFIX = "admin|"


class Role(StrEnum):
    MEMBER = "member"
    MODERATOR = "moderator"
    ADMIN = "admin"


# A role grants every role listed for it (admin can do anything a moderator can, and so on).
_IMPLIED_ROLES: dict[Role, frozenset[Role]] = {
    Role.MEMBER: frozenset({Role.MEMBER}),
    Role.MODERATOR: frozenset({Role.MEMBER, Role.MODERATOR}),
    Role.ADMIN: frozenset({Role.MEMBER, Role.MODERATOR, Role.ADMIN}),
}


@dataclass(frozen=True, slots=True)
class Principal:
    """An authenticated caller. ``subject`` is the identity provider's stable subject."""

    subject: str
    roles: frozenset[Role] = field(default_factory=frozenset)
    # Profile claims from the identity provider, shown next to the user's comments.
    name: str | None = None
    picture: str | None = None

    def has_role(self, role: Role) -> bool:
        return any(role in _IMPLIED_ROLES[granted] for granted in self.roles)


# Fixture identities for local development and tests only.
DEV_PRINCIPALS: dict[str, Principal] = {
    "member": Principal(subject="dev|member", roles=frozenset({Role.MEMBER})),
    "moderator": Principal(subject="dev|moderator", roles=frozenset({Role.MODERATOR})),
    "admin": Principal(subject="dev|admin", roles=frozenset({Role.ADMIN})),
}


class IdTokenVerifier(Protocol):
    def verify(self, token: str) -> Principal:
        """Return the token's principal or raise :class:`UnauthorizedError`."""
        ...


class GoogleIdTokenVerifier:
    """Verifies Google ID tokens. Signing keys are fetched from Google and cached."""

    def __init__(self, client_id: str, jwks_client: jwt.PyJWKClient | None = None) -> None:
        self._client_id = client_id
        self._jwks = jwks_client or jwt.PyJWKClient(
            GOOGLE_JWKS_URL, cache_keys=True, lifespan=3600, timeout=5
        )

    def verify(self, token: str) -> Principal:
        try:
            signing_key = self._jwks.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=self._client_id,
                issuer=GOOGLE_ISSUERS,
                leeway=30,
                options={"require": ["exp", "iat", "iss", "aud", "sub"]},
            )
        except jwt.PyJWKClientConnectionError as exc:
            logger.warning("google_jwks_unreachable", error=str(exc))
            raise UnauthorizedError("Could not verify the sign-in token") from None
        except jwt.PyJWTError as exc:
            logger.info("id_token_rejected", reason=type(exc).__name__)
            raise UnauthorizedError("Invalid or expired sign-in token") from None
        return Principal(
            subject=f"google|{claims['sub']}",
            roles=frozenset({Role.MEMBER}),
            name=_optional_str(claims.get("name")),
            picture=_optional_str(claims.get("picture")),
        )


@dataclass(frozen=True, slots=True)
class IssuedToken:
    token: str
    expires_at: datetime


def issue_admin_token(settings: Settings, *, account_id: str, username: str) -> IssuedToken:
    """Sign an admin session token for an account whose password was just checked."""
    now = datetime.now(UTC)
    expires_at = now + timedelta(seconds=settings.admin_token_ttl_seconds)
    claims = {
        "iss": ADMIN_TOKEN_ISSUER,
        "aud": ADMIN_TOKEN_AUDIENCE,
        "sub": f"{ADMIN_SUBJECT_PREFIX}{account_id}",
        "name": username,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(claims, settings.admin_token_secret.get_secret_value(), algorithm="HS256")
    return IssuedToken(token=token, expires_at=expires_at)


def verify_admin_token(settings: Settings, token: str) -> Principal:
    try:
        claims = jwt.decode(
            token,
            settings.admin_token_secret.get_secret_value(),
            algorithms=["HS256"],
            audience=ADMIN_TOKEN_AUDIENCE,
            issuer=ADMIN_TOKEN_ISSUER,
            leeway=30,
            options={"require": ["exp", "iat", "iss", "aud", "sub"]},
        )
    except jwt.PyJWTError as exc:
        logger.info("admin_token_rejected", reason=type(exc).__name__)
        raise UnauthorizedError("Invalid or expired admin session") from None
    subject = claims["sub"]
    if not isinstance(subject, str) or not subject.startswith(ADMIN_SUBJECT_PREFIX):
        raise UnauthorizedError("Invalid or expired admin session")
    return Principal(
        subject=subject, roles=frozenset({Role.ADMIN}), name=_optional_str(claims.get("name"))
    )


def _is_admin_token(token: str) -> bool:
    """Peek at the unverified issuer only to pick the verifier; both verify fully."""
    try:
        claims = jwt.decode(token, options={"verify_signature": False})
    except jwt.PyJWTError:
        return False
    return claims.get("iss") == ADMIN_TOKEN_ISSUER


def _optional_str(value: object) -> str | None:
    return value if isinstance(value, str) and value else None


def _bearer_token(request: Request) -> str | None:
    header = request.headers.get("Authorization")
    if header is None:
        return None
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise UnauthorizedError("Malformed Authorization header")
    return token.strip()


async def get_principal(request: Request) -> Principal | None:
    """Return the caller's identity, or ``None`` for anonymous requests."""
    token = _bearer_token(request)
    settings: Settings = request.app.state.settings
    if token is not None and _is_admin_token(token):
        return verify_admin_token(settings, token)
    if token is not None:
        verifier: IdTokenVerifier | None = getattr(request.app.state, "id_token_verifier", None)
        if verifier is None:
            raise UnauthorizedError("Sign-in is not configured")
        # Key lookups may hit the network on a cache miss; keep the event loop free.
        return await asyncio.to_thread(verifier.verify, token)

    if not settings.dev_auth_enabled:
        return None
    name = request.headers.get(DEV_PRINCIPAL_HEADER)
    if name is None:
        return None
    principal = DEV_PRINCIPALS.get(name)
    if principal is None:
        raise UnauthorizedError("Unknown development principal")
    return principal


OptionalPrincipal = Annotated[Principal | None, Depends(get_principal)]


async def require_principal(principal: OptionalPrincipal) -> Principal:
    if principal is None:
        raise UnauthorizedError("Authentication required")
    return principal


CurrentPrincipal = Annotated[Principal, Depends(require_principal)]


def require_role(role: Role) -> Callable[[Principal], Awaitable[Principal]]:
    """Dependency factory: 401 when anonymous, 403 when the caller lacks ``role``."""

    async def dependency(principal: CurrentPrincipal) -> Principal:
        if not principal.has_role(role):
            raise ForbiddenError("Insufficient role", details={"required_role": role.value})
        return principal

    return dependency
