from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.content.models import Content, ContentSource, ContentStatus, ContentType


async def find_by_slug(session: AsyncSession, slug: str) -> Content | None:
    result: Content | None = await session.scalar(select(Content).where(Content.slug == slug))
    return result


async def has_source_link(session: AsyncSession, content: Content) -> bool:
    found = await session.scalar(
        select(ContentSource.id).where(ContentSource.content_id == content.id).limit(1)
    )
    return found is not None


async def listed_demos(session: AsyncSession) -> Sequence[Content]:
    rows = await session.scalars(
        select(Content).where(
            Content.type == ContentType.DEMO, Content.status != ContentStatus.ARCHIVED
        )
    )
    return rows.all()
