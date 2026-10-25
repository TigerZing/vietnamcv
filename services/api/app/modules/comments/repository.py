"""Comment queries."""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import cast

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import KeysetCursor
from app.modules.comments.models import Comment, CommentStatus
from app.modules.identity.models import User

# Row behaves as a plain tuple in SQLAlchemy 2.1; the outer join makes the user optional.
_ROWS = Sequence[tuple[Comment, User | None]]
_ROW = tuple[Comment, User | None] | None


async def list_comments(
    session: AsyncSession,
    *,
    status: CommentStatus,
    content_id: uuid.UUID | None,
    limit: int,
    cursor: KeysetCursor | None,
) -> Sequence[tuple[Comment, User | None]]:
    """Newest first by ``(created_at, id)``; fetches ``limit + 1`` rows to detect more."""
    statement = (
        select(Comment, User)
        .outerjoin(User, User.id == Comment.user_id)
        .where(Comment.status == status)
        .order_by(Comment.created_at.desc(), Comment.id.desc())
        .limit(limit + 1)
    )
    if content_id is not None:
        statement = statement.where(Comment.content_id == content_id)
    if cursor is not None:
        statement = statement.where(
            or_(
                Comment.created_at < cursor.timestamp,
                and_(Comment.created_at == cursor.timestamp, Comment.id < cursor.id),
            )
        )
    return cast(_ROWS, (await session.execute(statement)).all())


async def count_published(
    session: AsyncSession, content_ids: Sequence[uuid.UUID]
) -> dict[uuid.UUID, int]:
    if not content_ids:
        return {}
    rows = await session.execute(
        select(Comment.content_id, func.count())
        .where(Comment.content_id.in_(content_ids), Comment.status == CommentStatus.PUBLISHED)
        .group_by(Comment.content_id)
    )
    return {row[0]: row[1] for row in rows.all()}


async def get_with_author(
    session: AsyncSession, comment_id: uuid.UUID
) -> tuple[Comment, User | None] | None:
    result = await session.execute(
        select(Comment, User)
        .outerjoin(User, User.id == Comment.user_id)
        .where(Comment.id == comment_id)
        .with_for_update(of=Comment)
    )
    return cast(_ROW, result.first())
