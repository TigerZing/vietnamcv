"""Content lifecycle. Publishing goes through :func:`publish` only (ADR-003, ADR-005)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.core.outbox import record_event
from app.modules.audit import service as audit
from app.modules.content.models import (
    Content,
    ContentSource,
    ContentStatus,
    DatePrecision,
    Source,
)


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
