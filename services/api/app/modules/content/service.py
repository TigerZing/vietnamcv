"""Content lifecycle. Publishing goes through :func:`publish` only (ADR-003, ADR-005)."""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import delete, exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.core.outbox import record_event
from app.modules.audit import service as audit
from app.modules.content.models import (
    Content,
    ContentLink,
    ContentMedia,
    ContentSource,
    ContentStatus,
    ContentTranslation,
    DatePrecision,
    ImageRights,
    LinkKind,
    MediaRole,
    Source,
    TextLanguage,
)

# Rights under which an image may be shown in staging and production.
CLEARED_RIGHTS = (ImageRights.OWN, ImageRights.LICENSED)


@dataclass(frozen=True, slots=True)
class Illustration:
    media_id: uuid.UUID
    alt_text: str
    caption: str | None
    credit: str
    credit_url: str | None
    rights: ImageRights


@dataclass(frozen=True, slots=True)
class TextData:
    title: str
    summary: str
    body: str | None


@dataclass(frozen=True, slots=True)
class LinkData:
    kind: LinkKind
    label: str
    url: str


async def get_source_by_code(session: AsyncSession, code: str) -> Source | None:
    result: Source | None = await session.scalar(select(Source).where(Source.code == code))
    return result


async def publish(session: AsyncSession, content: Content, *, actor_subject: str) -> None:
    """Publish ``content`` in the caller's transaction.

    Requires at least one provenance record, sets ``published_at`` on first publication,
    writes an audit event and records a ``ContentPublished`` outbox event.
    """
    if content.status == ContentStatus.PUBLISHED:
        return
    await session.flush()
    has_source = await session.scalar(
        select(func.count())
        .select_from(ContentSource)
        .where(ContentSource.content_id == content.id)
    )
    if not has_source:
        raise ConflictError(
            "Content needs at least one source before publishing",
            details={"content_id": str(content.id)},
        )
    before = content.status
    content.status = ContentStatus.PUBLISHED
    if content.published_at is None:
        content.published_at = await session.scalar(select(func.clock_timestamp()))
    audit.record(
        session,
        actor_subject=actor_subject,
        action="content.published",
        target_type="content",
        target_id=content.id,
        before={"status": before},
        after={"status": content.status},
    )
    record_event(
        session.sync_session,
        "ContentPublished",
        {"content_id": str(content.id), "type": content.type, "slug": content.slug},
    )


async def get_published(session: AsyncSession, content_type: str, slug: str) -> Content:
    content = await session.scalar(
        select(Content).where(
            Content.type == content_type,
            Content.slug == slug,
            Content.status == ContentStatus.PUBLISHED,
        )
    )
    if content is None:
        raise NotFoundError("Content not found", details={"slug": slug})
    return content


async def upsert_source(
    session: AsyncSession,
    *,
    code: str,
    name: str,
    kind: str,
    base_url: str,
    trust_tier: str,
) -> Source:
    source = await get_source_by_code(session, code)
    if source is None:
        source = Source(id=uuid.uuid4(), code=code)
        session.add(source)
    source.name = name
    source.kind = kind
    source.base_url = base_url
    source.trust_tier = trust_tier
    return source


def add_source_link(
    session: AsyncSession,
    content: Content,
    source: Source,
    *,
    external_id: str,
    canonical_url: str,
    fetched_at: datetime,
    source_published_at: datetime | None,
    precision: DatePrecision,
) -> ContentSource:
    link = ContentSource(
        id=uuid.uuid4(),
        content_id=content.id,
        source_id=source.id,
        external_id=external_id,
        canonical_url=canonical_url,
        fetched_at=fetched_at,
        source_published_at=source_published_at,
        source_published_precision=precision,
    )
    session.add(link)
    return link


# --- Images and related links ---


async def get_illustration(session: AsyncSession, content_id: uuid.UUID) -> ContentMedia | None:
    found: ContentMedia | None = await session.scalar(
        select(ContentMedia).where(
            ContentMedia.content_id == content_id,
            ContentMedia.role == MediaRole.ILLUSTRATION,
            ContentMedia.position == 0,
        )
    )
    return found


async def set_illustration(
    session: AsyncSession, content: Content, illustration: Illustration
) -> ContentMedia:
    """Create or replace the lead image of ``content``."""
    row = await get_illustration(session, content.id)
    if row is None:
        row = ContentMedia(
            id=uuid.uuid4(),
            content_id=content.id,
            role=MediaRole.ILLUSTRATION,
            position=0,
        )
        session.add(row)
    row.media_id = illustration.media_id
    row.alt_text = illustration.alt_text
    row.caption = illustration.caption
    row.credit = illustration.credit
    row.credit_url = illustration.credit_url
    row.rights = illustration.rights
    return row


async def remove_illustration(session: AsyncSession, content: Content) -> None:
    await session.execute(
        delete(ContentMedia).where(
            ContentMedia.content_id == content.id, ContentMedia.role == MediaRole.ILLUSTRATION
        )
    )


async def illustrations(
    session: AsyncSession, content_ids: Sequence[uuid.UUID], *, allow_uncleared: bool
) -> dict[uuid.UUID, ContentMedia]:
    """The lead image of each content that may be shown under the current rights policy."""
    if not content_ids:
        return {}
    statement = select(ContentMedia).where(
        ContentMedia.content_id.in_(content_ids),
        ContentMedia.role == MediaRole.ILLUSTRATION,
        ContentMedia.position == 0,
    )
    if not allow_uncleared:
        statement = statement.where(ContentMedia.rights.in_(CLEARED_RIGHTS))
    rows = (await session.scalars(statement)).all()
    return {row.content_id: row for row in rows}


async def media_is_public(
    session: AsyncSession, media_id: uuid.UUID, *, allow_uncleared: bool
) -> bool:
    """True when a published content shows this image under the current rights policy."""
    condition = (
        select(ContentMedia.id)
        .join(Content, Content.id == ContentMedia.content_id)
        .where(ContentMedia.media_id == media_id, Content.status == ContentStatus.PUBLISHED)
    )
    if not allow_uncleared:
        condition = condition.where(ContentMedia.rights.in_(CLEARED_RIGHTS))
    return bool(await session.scalar(select(exists(condition))))


async def replace_links(session: AsyncSession, content: Content, links: Sequence[LinkData]) -> None:
    await session.execute(delete(ContentLink).where(ContentLink.content_id == content.id))
    for position, link in enumerate(links):
        session.add(
            ContentLink(
                id=uuid.uuid4(),
                content_id=content.id,
                position=position,
                kind=link.kind,
                label=link.label,
                url=link.url,
            )
        )


async def get_links(session: AsyncSession, content_id: uuid.UUID) -> list[ContentLink]:
    rows = await session.scalars(
        select(ContentLink)
        .where(ContentLink.content_id == content_id)
        .order_by(ContentLink.position)
    )
    return list(rows)


# --- Localized text ---


async def replace_translations(
    session: AsyncSession, content: Content, texts: dict[TextLanguage, TextData]
) -> None:
    """Make the stored translations of ``content`` exactly ``texts``."""
    existing = {
        row.language: row
        for row in await session.scalars(
            select(ContentTranslation).where(ContentTranslation.content_id == content.id)
        )
    }
    for language, row in existing.items():
        if language not in texts:
            await session.delete(row)
    for language, text in texts.items():
        found = existing.get(language)
        if found is None:
            row = ContentTranslation(id=uuid.uuid4(), content_id=content.id, language=language)
            session.add(row)
        else:
            row = found
        row.title = text.title
        row.summary = text.summary
        row.body = text.body


async def localized_texts(
    session: AsyncSession, content_ids: Sequence[uuid.UUID], language: TextLanguage
) -> dict[uuid.UUID, ContentTranslation]:
    """Text of each content in ``language``, falling back to Vietnamese (the source)."""
    if not content_ids:
        return {}
    wanted = {language, TextLanguage.VI}
    rows = await session.scalars(
        select(ContentTranslation).where(
            ContentTranslation.content_id.in_(content_ids),
            ContentTranslation.language.in_(wanted),
        )
    )
    result: dict[uuid.UUID, ContentTranslation] = {}
    for row in rows:
        if row.language == language or row.content_id not in result:
            result[row.content_id] = row
    return result
