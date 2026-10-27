"""Demo products as published content, so comments can attach to them (ADR-013).

The page itself (titles, descriptions, thumbnails) is rendered from
``apps/web/src/lib/demos.ts``; the database only needs a published row per demo.
"""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, time
from enum import StrEnum

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError
from app.modules.content import service as content_service
from app.modules.content.models import (
    Content,
    ContentStatus,
    ContentType,
    DatePrecision,
    Source,
    TextLanguage,
)
from app.modules.demos import repository
from app.modules.demos.schemas import CuratedDemo, CuratedDemoFile

DEMO_IMPORT_ACTOR = "system:curated-demo-import"
CURATED_TRUST_TIER = "curated"


class DemoOutcome(StrEnum):
    CREATED = "created"
    UPDATED = "updated"
    WITHDRAWN = "withdrawn"


def _midnight_utc(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=UTC)


async def import_demos(session: AsyncSession, data: CuratedDemoFile) -> dict[str, int]:
    """Create, update and publish every listed demo; archive demos no longer listed.

    Idempotent: identity is the slug, and ``published_at`` never changes on re-runs.
    """
    totals = {outcome.value: 0 for outcome in DemoOutcome}
    source = await content_service.upsert_source(
        session,
        code=data.source.code,
        name=data.source.name,
        kind=data.source.kind,
        base_url=str(data.source.base_url),
        trust_tier=CURATED_TRUST_TIER,
    )
    await session.flush()
    for entry in data.items:
        outcome = await _import_one(session, entry, source)
        totals[outcome.value] += 1

    listed = {entry.slug for entry in data.items}
    for content in await repository.listed_demos(session):
        if content.slug not in listed and await content_service.archive(
            session, content, actor_subject=DEMO_IMPORT_ACTOR
        ):
            totals[DemoOutcome.WITHDRAWN.value] += 1
    return totals


async def _import_one(session: AsyncSession, entry: CuratedDemo, source: Source) -> DemoOutcome:
    content = await repository.find_by_slug(session, entry.slug)
    if content is not None and content.type != ContentType.DEMO:
        raise ConflictError("Slug already used by another content", details={"slug": entry.slug})
    outcome = DemoOutcome.UPDATED
    if content is None:
        content = Content(id=uuid.uuid4(), type=ContentType.DEMO, slug=entry.slug)
        session.add(content)
        outcome = DemoOutcome.CREATED
    content.title = entry.title
    content.summary = entry.title
    content.language = TextLanguage.VI
    await session.flush()
    if not await repository.has_source_link(session, content):
        content_service.add_source_link(
            session,
            content,
            source,
            external_id=entry.urn,
            canonical_url=str(entry.url),
            fetched_at=_midnight_utc(entry.published_on),
            source_published_at=_midnight_utc(entry.published_on),
            precision=DatePrecision.DAY,
        )
    # An archived demo that is listed again comes back.
    if content.status == ContentStatus.ARCHIVED:
        content.status = ContentStatus.DRAFT
    await content_service.publish(session, content, actor_subject=DEMO_IMPORT_ACTOR)
    return outcome


async def published_slugs(session: AsyncSession) -> list[str]:
    return await content_service.published_slugs(session, ContentType.DEMO)
