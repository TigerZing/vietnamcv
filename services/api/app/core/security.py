"""Authentication seam and role-based access control.

Endpoints depend only on :class:`Principal` and :func:`require_role`. Until the OIDC
provider is chosen (ADR-002), the only identity source is a development fixture selected
with the ``X-Dev-Principal`` header, available when ``DEV_AUTH_ENABLED`` is true. Settings
validation refuses that flag in staging and production, so the fixture cannot leak there.
Swapping in JWT validation later changes :func:`get_principal` and nothing else.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Annotated

from fastapi import Depends, Request

from app.core.config import Settings
from app.core.errors import ForbiddenError, UnauthorizedError

DEV_PRINCIPAL_HEADER = "X-Dev-Principal"


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

    def has_role(self, role: Role) -> bool:
        return any(role in _IMPLIED_ROLES[granted] for granted in self.roles)


# Fixture identities for local development and tests only.
DEV_PRINCIPALS: dict[str, Principal] = {
    "member": Principal(subject="dev|member", roles=frozenset({Role.MEMBER})),
    "moderator": Principal(subject="dev|moderator", roles=frozenset({Role.MODERATOR})),
    "admin": Principal(subject="dev|admin", roles=frozenset({Role.ADMIN})),
}


async def get_principal(request: Request) -> Principal | None:
    """Return the caller's identity, or ``None`` for anonymous requests."""
    settings: Settings = request.app.state.settings
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
