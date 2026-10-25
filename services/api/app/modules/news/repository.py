"""News queries."""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import cast

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import KeysetCursor
from app.modules.content.models import (
    Content,
    ContentSource,
    ContentStatus,
    ContentType,
    Source,
)
from app.modules.news.models import NewsItem

# Row behaves as a plain tuple in SQLAlchemy 2.1; callers unpack it.
_ROWS = Sequence[tuple[Content, NewsItem]]
_ROW = tuple[Content, NewsItem] | None


async def list_published(
    session: AsyncSession,
    *,
    limit: int,
    cursor: KeysetCursor | None,
    category: str | None,
    region: str | None,
) -> Sequence[tuple[Content, NewsItem]]:
    """Newest first by ``(published_at, id)``; fetches ``limit + 1`` rows to detect more."""
    statement = (
        select(Content, NewsItem)
        .join(NewsItem, NewsItem.content_id == Content.id)
        .where(Content.type == ContentType.NEWS, Content.status == ContentStatus.PUBLISHED)
        .order_by(Content.published_at.desc(), Content.id.desc())
        .limit(limit + 1)
    )
    if cursor is not None:
        statement = statement.where(
            or_(
                Content.published_at < cursor.timestamp,
                and_(Content.published_at == cursor.timestamp, Content.id < cursor.id),
            )
        )
    if category is not None:
        statement = statement.where(NewsItem.category == category)
    if region is not None:
        statement = statement.where(NewsItem.region == region)
    return cast(_ROWS, (await session.execute(statement)).all())


async def get_published_by_slug(
    session: AsyncSession, slug: str
) -> tuple[Content, NewsItem] | None:
    statement = (
        select(Content, NewsItem)
        .join(NewsItem, NewsItem.content_id == Content.id)
        .where(
            Content.type == ContentType.NEWS,
            Content.status == ContentStatus.PUBLISHED,
            Content.slug == slug,
        )
    )
    return cast(_ROW, (await session.execute(statement)).first())


async def primary_sources(
    session: AsyncSession, content_ids: Sequence[uuid.UUID]
) -> dict[uuid.UUID, tuple[ContentSource, Source]]:
    """The earliest-fetched provenance record of each content."""
    if not content_ids:
        return {}
    rows = await session.execute(
        select(ContentSource, Source)
        .join(Source, Source.id == ContentSource.source_id)
        .where(ContentSource.content_id.in_(content_ids))
        .order_by(ContentSource.fetched_at, ContentSource.id)
    )
    result: dict[uuid.UUID, tuple[ContentSource, Source]] = {}
    for link, source in rows:
        result.setdefault(link.content_id, (link, source))
    return result


async def find_by_slug(session: AsyncSession, slug: str) -> Content | None:
    found: Content | None = await session.scalar(select(Content).where(Content.slug == slug))
    return found


async def find_link(
    session: AsyncSession, source_id: uuid.UUID, external_id: str
) -> ContentSource | None:
    found: ContentSource | None = await session.scalar(
        select(ContentSource).where(
            ContentSource.source_id == source_id, ContentSource.external_id == external_id
        )
    )
    return found


async def get_news_item(session: AsyncSession, content_id: uuid.UUID) -> NewsItem | None:
    return await session.get(NewsItem, content_id)


async def get_content(session: AsyncSession, content_id: uuid.UUID) -> Content | None:
    return await session.get(Content, content_id)
