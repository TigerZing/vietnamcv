"""User provisioning from authenticated principals."""

from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import Principal
from app.modules.identity.models import User

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
