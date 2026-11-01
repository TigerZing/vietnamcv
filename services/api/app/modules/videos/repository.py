"""Video queries."""

from __future__ import annotations

import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.content.models import Content, ContentType
from app.modules.videos.models import VideoLike


async def find_by_slug(session: AsyncSession, slug: str) -> Content | None:
    result: Content | None = await session.scalar(
        select(Content).where(Content.type == ContentType.VIDEO, Content.slug == slug)
    )
    return result


async def add_like(session: AsyncSession, content_id: uuid.UUID, visitor_hash: str) -> None:
    await session.execute(
        insert(VideoLike)
        .values(content_id=content_id, visitor_hash=visitor_hash)
        .on_conflict_do_nothing()
    )


async def remove_like(session: AsyncSession, content_id: uuid.UUID, visitor_hash: str) -> None:
    await session.execute(
        delete(VideoLike).where(
            VideoLike.content_id == content_id, VideoLike.visitor_hash == visitor_hash
        )
    )


async def count_likes(session: AsyncSession, content_id: uuid.UUID) -> int:
    return (
        await session.scalar(
            select(func.count()).select_from(VideoLike).where(VideoLike.content_id == content_id)
        )
        or 0
    )


async def has_like(session: AsyncSession, content_id: uuid.UUID, visitor_hash: str) -> bool:
    row = await session.scalar(
        select(VideoLike.content_id).where(
            VideoLike.content_id == content_id, VideoLike.visitor_hash == visitor_hash
        )
    )
    return row is not None
