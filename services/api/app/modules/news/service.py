"""News feed, news detail and the curated import."""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, time
from enum import StrEnum

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.core.pagination import KeysetCursor
from app.modules.comments import service as comments
from app.modules.content import service as content_service
from app.modules.content.models import (
    Content,
    ContentSource,
    ContentType,
    DatePrecision,
    Source,
)
from app.modules.news import repository
from app.modules.news.models import NewsCategory, NewsItem, NewsRegion
from app.modules.news.schemas import (
    CuratedNewsFile,
    CuratedNewsItem,
    NewsDetail,
    NewsPage,
    NewsSummary,
    SourceRef,
    Video,
)

CURATED_IMPORT_ACTOR = "system:curated-news-import"
# Editors approved each row in the news sheet, so imported sources are human-curated.
CURATED_TRUST_TIER = "curated"


class ImportOutcome(StrEnum):
    CREATED = "created"
    UPDATED = "updated"


async def list_news(
    session: AsyncSession,
    *,
    limit: int,
    cursor: str | None,
    category: NewsCategory | None = None,
    region: NewsRegion | None = None,
) -> NewsPage:
    rows = await repository.list_published(
        session,
        limit=limit,
        cursor=KeysetCursor.decode(cursor) if cursor else None,
        category=category,
        region=region,
    )
    page = rows[:limit]
    ids = [content.id for content, _ in page]
    sources = await repository.primary_sources(session, ids)
    counts = await comments.count_published(session, ids)
    items = [
        _summary(content, item, *sources[content.id], counts.get(content.id, 0))
        for content, item in page
    ]
    next_cursor = None
    if len(rows) > limit:
        last = page[-1][0]
        assert last.published_at is not None  # noqa: S101 - published rows have a timestamp
        next_cursor = KeysetCursor(last.published_at, last.id).encode()
    return NewsPage(items=items, next_cursor=next_cursor)


async def get_news(session: AsyncSession, slug: str) -> NewsDetail:
    row = await repository.get_published_by_slug(session, slug)
    if row is None:
        raise NotFoundError("News post not found", details={"slug": slug})
    content, item = row
    link, source = (await repository.primary_sources(session, [content.id]))[content.id]
    counts = await comments.count_published(session, [content.id])
    summary = _summary(content, item, link, source, counts.get(content.id, 0))
    return NewsDetail(
        **summary.model_dump(),
        original_language=item.original_language,
        editor_note=item.editor_note,
        fetched_at=link.fetched_at,
    )


def _summary(
    content: Content, item: NewsItem, link: ContentSource, source: Source, comment_count: int
) -> NewsSummary:
    assert content.published_at is not None  # noqa: S101 - only published rows reach here
    video = (
        Video(provider=item.video_provider, id=item.video_id, title=item.video_title)  # type: ignore[arg-type]
        if item.video_provider and item.video_id
        else None
    )
    return NewsSummary(
        id=content.id,
        slug=content.slug,
        title=content.title,
        summary=content.summary,
        language=content.language,
        category=NewsCategory(item.category),
        region=NewsRegion(item.region),
        keywords=list(item.keywords),
        published_at=content.published_at,
        source=SourceRef(
            name=source.name,
            url=link.canonical_url,
            published_on=link.source_published_at.date() if link.source_published_at else None,
            published_precision=DatePrecision(link.source_published_precision),
        ),
        video=video,
        comment_count=comment_count,
    )


# --- Curated import ---


async def import_sources(session: AsyncSession, data: CuratedNewsFile) -> dict[str, Source]:
    sources: dict[str, Source] = {}
    for entry in data.sources:
        sources[entry.code] = await content_service.upsert_source(
            session,
            code=entry.code,
            name=entry.name,
            kind=entry.kind,
            base_url=str(entry.base_url),
            trust_tier=CURATED_TRUST_TIER,
        )
    await session.flush()
    return sources


async def import_item(
    session: AsyncSession, entry: CuratedNewsItem, sources: dict[str, Source]
) -> ImportOutcome:
    """Create or update one approved news post and publish it. Idempotent.

    Identity is the provenance key ``(source, external_id)``; re-running the import
    updates text and metadata but never changes ``published_at``.
    """
    source = sources.get(entry.source)
    if source is None:
        raise ConflictError("Unknown source code", details={"source": entry.source})

    link = await repository.find_link(session, source.id, entry.external_id)
    content: Content | None
    if link is not None:
        content = await repository.get_content(session, link.content_id)
        assert content is not None  # noqa: S101 - FK guarantees the row exists
        outcome = ImportOutcome.UPDATED
    else:
        if await repository.find_by_slug(session, entry.slug) is not None:
            raise ConflictError(
                "Slug already used by another content", details={"slug": entry.slug}
            )
        content = Content(id=uuid.uuid4(), type=ContentType.NEWS, slug=entry.slug)
        session.add(content)
        content_service.add_source_link(
            session,
            content,
            source,
            external_id=entry.external_id,
            canonical_url=str(entry.url),
            fetched_at=_midnight_utc(entry.collected_on),
            source_published_at=_midnight_utc(entry.published_on),
            precision=entry.published_precision,
        )
        outcome = ImportOutcome.CREATED

    content.title = entry.title
    content.summary = entry.summary
    content.language = "vi"  # the post text is the editor's Vietnamese summary

    item = await repository.get_news_item(session, content.id)
    if item is None:
        item = NewsItem(content_id=content.id)
        session.add(item)
    item.region = entry.region
    item.category = entry.category
    item.keywords = entry.keywords
    item.original_language = entry.original_language
    item.editor_note = entry.editor_note
    item.video_provider = entry.video.provider if entry.video else None
    item.video_id = entry.video.id if entry.video else None
    item.video_title = entry.video.title if entry.video else None

    await content_service.publish(session, content, actor_subject=CURATED_IMPORT_ACTOR)
    return outcome


def _midnight_utc(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=UTC)
