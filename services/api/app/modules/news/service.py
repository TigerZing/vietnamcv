"""News feed, news detail and the curated import."""

from __future__ import annotations

import uuid
from collections.abc import Awaitable, Callable
from datetime import UTC, date, datetime, time
from enum import StrEnum

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, DomainValidationError, NotFoundError
from app.core.logging import get_logger
from app.core.pagination import KeysetCursor
from app.modules.comments import service as comments
from app.modules.content import service as content_service
from app.modules.content.models import (
    Content,
    ContentMedia,
    ContentSource,
    ContentTranslation,
    ContentType,
    DatePrecision,
    ImageRights,
    LinkKind,
    Source,
    TextLanguage,
)
from app.modules.media import service as media
from app.modules.media.models import MediaAsset
from app.modules.news import repository
from app.modules.news.models import NewsCategory, NewsItem, NewsRegion
from app.modules.news.schemas import (
    CuratedImage,
    CuratedNewsFile,
    CuratedNewsItem,
    Image,
    Link,
    NewsDetail,
    NewsPage,
    NewsSummary,
    SourceRef,
    TagCount,
    TagList,
    Video,
)

logger = get_logger(__name__)

# Loads the bytes of a curated image (download or local file). Injected so tests never
# reach the network.
ImageLoader = Callable[[CuratedImage], Awaitable[bytes]]
MEDIA_PATH = "/api/v1/media/{id}"

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
    tag: str | None = None,
    language: TextLanguage = TextLanguage.VI,
    allow_uncleared_images: bool = False,
) -> NewsPage:
    rows = await repository.list_published(
        session,
        limit=limit,
        cursor=KeysetCursor.decode(cursor) if cursor else None,
        category=category,
        region=region,
        tag=tag,
    )
    page = rows[:limit]
    ids = [content.id for content, _ in page]
    sources = await repository.primary_sources(session, ids)
    counts = await comments.count_published(session, ids)
    images = await _images(session, ids, language=language, allow_uncleared=allow_uncleared_images)
    texts = await content_service.localized_texts(session, ids, language)
    items = [
        _summary(
            content,
            item,
            *sources[content.id],
            text=texts.get(content.id),
            comment_count=counts.get(content.id, 0),
            image=images.get(content.id),
        )
        for content, item in page
    ]
    next_cursor = None
    if len(rows) > limit:
        last = page[-1][1]
        next_cursor = KeysetCursor(last.dated_at, last.content_id).encode()
    return NewsPage(items=items, next_cursor=next_cursor)


async def list_tags(
    session: AsyncSession, *, region: NewsRegion | None = None, limit: int = 30
) -> TagList:
    rows = await repository.tag_counts(session, region=region, limit=limit)
    return TagList(items=[TagCount(tag=tag, count=count) for tag, count in rows])


async def get_news(
    session: AsyncSession,
    slug: str,
    *,
    language: TextLanguage = TextLanguage.VI,
    allow_uncleared_images: bool = False,
) -> NewsDetail:
    row = await repository.get_published_by_slug(session, slug)
    if row is None:
        raise NotFoundError("News post not found", details={"slug": slug})
    content, item = row
    link, source = (await repository.primary_sources(session, [content.id]))[content.id]
    counts = await comments.count_published(session, [content.id])
    images = await _images(
        session, [content.id], language=language, allow_uncleared=allow_uncleared_images
    )
    figure_uses = await content_service.figures(
        session, content.id, allow_uncleared=allow_uncleared_images
    )
    figure_assets = await media.get_many(session, [use.media_id for use in figure_uses])
    text = (await content_service.localized_texts(session, [content.id], language)).get(content.id)
    summary = _summary(
        content,
        item,
        link,
        source,
        text=text,
        comment_count=counts.get(content.id, 0),
        image=images.get(content.id),
    )
    links = await content_service.get_links(session, content.id)
    return NewsDetail(
        **summary.model_dump(),
        body=text.body if text is not None else None,
        figures=[
            _image(use, figure_assets[use.media_id], language)
            for use in figure_uses
            if use.media_id in figure_assets
        ],
        links=[Link(kind=LinkKind(row.kind), label=row.label, url=row.url) for row in links],
        original_language=item.original_language,
        editor_note=item.editor_note,
        fetched_at=link.fetched_at,
    )


async def _images(
    session: AsyncSession,
    content_ids: list[uuid.UUID],
    *,
    language: TextLanguage,
    allow_uncleared: bool,
) -> dict[uuid.UUID, Image]:
    uses = await content_service.illustrations(
        session, content_ids, allow_uncleared=allow_uncleared
    )
    assets = await media.get_many(session, [use.media_id for use in uses.values()])
    return {
        content_id: _image(use, assets[use.media_id], language)
        for content_id, use in uses.items()
        if use.media_id in assets
    }


def _image(use: ContentMedia, asset: MediaAsset, language: TextLanguage) -> Image:
    english = language == TextLanguage.EN
    return Image(
        id=asset.id,
        url=MEDIA_PATH.format(id=asset.id),
        width=asset.width,
        height=asset.height,
        alt=(use.alt_text_en if english and use.alt_text_en else use.alt_text),
        caption=(use.caption_en if english and use.caption_en else use.caption),
        credit=use.credit,
        credit_url=use.credit_url,
        rights=ImageRights(use.rights),
    )


def _summary(
    content: Content,
    item: NewsItem,
    link: ContentSource,
    source: Source,
    *,
    text: ContentTranslation | None,
    comment_count: int,
    image: Image | None,
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
        title=text.title if text is not None else content.title,
        original_title=content.title,
        summary=text.summary if text is not None else content.summary,
        language=TextLanguage(text.language) if text is not None else TextLanguage.VI,
        category=NewsCategory(item.category),
        region=NewsRegion(item.region),
        keywords=list(item.keywords),
        tags=list(item.tags),
        published_at=content.published_at,
        source=SourceRef(
            name=source.name,
            url=link.canonical_url,
            published_on=link.source_published_at.date() if link.source_published_at else None,
            published_precision=DatePrecision(link.source_published_precision),
        ),
        video=video,
        image=image,
        ai_assisted=item.ai_assisted,
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
    session: AsyncSession,
    entry: CuratedNewsItem,
    sources: dict[str, Source],
    *,
    load_image: ImageLoader | None = None,
) -> ImportOutcome:
    """Create or update one approved news post and publish it. Idempotent.

    Identity is the provenance key ``(source, external_id)``; re-running the import
    updates text and metadata but never changes ``published_at``. The image is loaded
    only when the post has none from the same origin yet; a failed load keeps the post
    (and any earlier image) and is retried on the next run.
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
    content.summary = entry.text[TextLanguage.VI].summary
    content.language = TextLanguage.VI  # VietnamCV's text is written in Vietnamese first

    item = await repository.get_news_item(session, content.id)
    if item is None:
        item = NewsItem(content_id=content.id)
        session.add(item)
    item.region = entry.region
    item.category = entry.category
    item.keywords = entry.keywords
    item.tags = entry.tags
    item.dated_at = _midnight_utc(entry.published_on)
    item.original_language = entry.original_language
    item.editor_note = entry.editor_note
    item.video_provider = entry.video.provider if entry.video else None
    item.video_id = entry.video.id if entry.video else None
    item.video_title = entry.video.title if entry.video else None
    item.ai_assisted = entry.ai_assisted

    await session.flush()
    await content_service.replace_translations(
        session,
        content,
        {
            language: content_service.TextData(
                title=text.title, summary=text.summary, body=text.body
            )
            for language, text in entry.text.items()
        },
    )
    await content_service.replace_links(
        session,
        content,
        [
            content_service.LinkData(kind=link.kind, label=link.label, url=str(link.url))
            for link in entry.links
        ],
    )
    await _import_image(session, content, entry, load_image)
    await _import_figures(session, content, entry, load_image)

    await content_service.publish(session, content, actor_subject=CURATED_IMPORT_ACTOR)
    return outcome


async def _import_image(
    session: AsyncSession,
    content: Content,
    entry: CuratedNewsItem,
    load_image: ImageLoader | None,
) -> None:
    spec = entry.image
    if spec is None:
        await content_service.remove_illustration(session, content)
        return
    current = await content_service.get_illustration(session, content.id)
    media_id: uuid.UUID | None = None
    if current is not None and await _same_origin(session, current, spec.origin):
        media_id = current.media_id
    if media_id is None and load_image is not None:
        try:
            raw = await load_image(spec)
            media_id = (await media.store(session, raw, origin=spec.origin)).id
        except (httpx.HTTPError, DomainValidationError, OSError) as exc:
            logger.warning(
                "news_image_not_loaded", slug=entry.slug, origin=spec.origin, error=str(exc)
            )
    if media_id is None:
        return  # keep the earlier image, if any, with its own credit
    await content_service.set_illustration(session, content, _illustration(spec, media_id))


async def _import_figures(
    session: AsyncSession,
    content: Content,
    entry: CuratedNewsItem,
    load_image: ImageLoader | None,
) -> None:
    """Store the in-article images. Known origins are not downloaded again; a figure that
    fails to load is left out of this run and retried on the next one."""
    known: dict[str, uuid.UUID] = {}
    current = await content_service.get_figures(session, content.id)
    assets = await media.get_many(session, [row.media_id for row in current])
    for row in current:
        origin = row.origin or (assets[row.media_id].origin if row.media_id in assets else None)
        if origin is not None:
            known[origin] = row.media_id
    resolved: list[content_service.Illustration] = []
    for spec in entry.figures:
        media_id = known.get(spec.origin)
        if media_id is None and load_image is not None:
            try:
                raw = await load_image(spec)
                media_id = (await media.store(session, raw, origin=spec.origin)).id
            except (httpx.HTTPError, DomainValidationError, OSError) as exc:
                logger.warning(
                    "news_figure_not_loaded",
                    slug=entry.slug,
                    origin=spec.origin,
                    error=str(exc),
                )
        if media_id is not None:
            resolved.append(_illustration(spec, media_id))
    await content_service.replace_figures(session, content, resolved)


async def _same_origin(session: AsyncSession, row: ContentMedia, origin: str) -> bool:
    if row.origin is not None:
        return row.origin == origin
    asset = await media.get(session, row.media_id)  # rows stored before 0004
    return asset is not None and asset.origin == origin


def _illustration(spec: CuratedImage, media_id: uuid.UUID) -> content_service.Illustration:
    return content_service.Illustration(
        media_id=media_id,
        alt_text=spec.alt,
        caption=spec.caption,
        alt_text_en=spec.alt_en,
        caption_en=spec.caption_en,
        credit=spec.credit,
        credit_url=str(spec.credit_url) if spec.credit_url else None,
        rights=spec.rights,
        origin=spec.origin,
    )


def _midnight_utc(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=UTC)
