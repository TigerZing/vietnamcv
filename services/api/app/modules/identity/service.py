"""User provisioning from authenticated principals, and admin accounts."""

from __future__ import annotations

import asyncio
import hashlib
import re
import uuid

from redis.asyncio import Redis
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import passwords, rate_limit
from app.core.config import Settings
from app.core.errors import DomainValidationError, UnauthorizedError
from app.core.logging import get_logger
from app.core.rate_limit import RateLimit
from app.core.security import (
    ADMIN_SUBJECT_PREFIX,
    IssuedToken,
    Principal,
    issue_admin_token,
)
from app.modules.audit import service as audit
from app.modules.identity.models import AdminAccount, User

logger = get_logger(__name__)

_MAX_NAME = 100
_MAX_AVATAR = 1000


async def provision_user(session: AsyncSession, principal: Principal) -> User:
    """Create or refresh the local user for ``principal`` (profile claims may change)."""
    name = principal.name[:_MAX_NAME] if principal.name else None
    avatar = (
        principal.picture
        if principal.picture
        and principal.picture.startswith("https://")
        and len(principal.picture) <= _MAX_AVATAR
        else None
    )
    statement = (
        insert(User)
        .values(auth_subject=principal.subject, display_name=name, avatar_url=avatar)
        .on_conflict_do_update(
            index_elements=[User.auth_subject],
            set_={"display_name": name, "avatar_url": avatar, "updated_at": func.now()},
        )
        .returning(User)
    )
    result = await session.execute(statement, execution_options={"populate_existing": True})
    return result.scalar_one()


# --- Admin accounts (ADR-015) ---

USERNAME_PATTERN = r"^[a-z0-9][a-z0-9._-]{2,63}$"
# Per client and per username, so neither one address nor a botnet can guess quickly.
LOGIN_PER_CLIENT = RateLimit(name="admin_login_client", limit=10, window_seconds=15 * 60)
LOGIN_PER_USERNAME = RateLimit(name="admin_login_username", limit=10, window_seconds=15 * 60)


def normalize_username(username: str) -> str:
    return username.strip().lower()


async def set_admin_account(session: AsyncSession, username: str, password: str) -> bool:
    """Create the admin account, or set a new password on it. True when it was created."""
    name = normalize_username(username)
    if not re.fullmatch(USERNAME_PATTERN, name):
        raise DomainValidationError(
            "Username must be 3-64 characters: letters, digits, '.', '_' or '-'",
            details={"field": "username"},
        )
    if not passwords.MIN_PASSWORD_LENGTH <= len(password) <= passwords.MAX_PASSWORD_LENGTH:
        raise DomainValidationError(
            f"Password must be {passwords.MIN_PASSWORD_LENGTH} to "
            f"{passwords.MAX_PASSWORD_LENGTH} characters",
            details={"field": "password"},
        )
    encoded = await asyncio.to_thread(passwords.hash_password, password)
    account = await session.scalar(select(AdminAccount).where(AdminAccount.username == name))
    if account is None:
        session.add(AdminAccount(id=uuid.uuid4(), username=name, password_hash=encoded))
        return True
    account.password_hash = encoded
    return False


async def delete_admin_account(session: AsyncSession, username: str) -> bool:
    result = await session.execute(
        delete(AdminAccount).where(AdminAccount.username == normalize_username(username))
    )
    return bool(getattr(result, "rowcount", 0))


async def admin_login(
    session: AsyncSession,
    redis: Redis,
    settings: Settings,
    *,
    username: str,
    password: str,
    fingerprint: str,
) -> IssuedToken:
    """Check an admin's password and issue a session token. Rate limited and audited."""
    name = normalize_username(username)
    await rate_limit.enforce(redis, LOGIN_PER_CLIENT, fingerprint)
    await rate_limit.enforce(redis, LOGIN_PER_USERNAME, hashlib.sha256(name.encode()).hexdigest())
    account = await session.scalar(select(AdminAccount).where(AdminAccount.username == name))
    encoded = account.password_hash if account else passwords.dummy_hash()
    valid = await asyncio.to_thread(passwords.verify_password, password, encoded)
    if account is None or not valid:
        logger.info("admin_login_failed", known_user=account is not None)
        raise UnauthorizedError("Wrong username or password")

    if passwords.needs_rehash(account.password_hash):
        account.password_hash = await asyncio.to_thread(passwords.hash_password, password)
    account.last_login_at = await session.scalar(select(func.now()))
    audit.record(
        session,
        actor_subject=f"{ADMIN_SUBJECT_PREFIX}{account.id}",
        action="admin.login",
        target_type="admin_account",
        target_id=account.id,
    )
    await session.commit()
    logger.info("admin_login", admin_id=str(account.id))
    return issue_admin_token(settings, account_id=str(account.id), username=account.username)
