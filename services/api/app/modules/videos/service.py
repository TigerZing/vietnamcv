"""Likes and comments on short videos (ADR-019).

The videos live on the owner's machine, so the database only learns about one the first
time somebody likes or comments on it. Reads never create rows.
"""

from __future__ import annotations

import hashlib
import uuid
from datetime import UTC, datetime

from redis.asyncio import Redis
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import rate_limit
from app.core.errors import NotFoundError
from app.core.rate_limit import RateLimit
from app.core.security import Principal
from app.modules.comments import service as comments
from app.modules.comments.schemas import CommentCreate, CommentOut, CommentPage
from app.modules.content import service as content_service
from app.modules.content.models import (
    Content,
    ContentStatus,
    ContentType,
    DatePrecision,
    TextLanguage,
)
from app.modules.videos import repository
from app.modules.videos.schemas import VideoEngagement

VIDEO_ACTOR = "system:video-first-interaction"
SOURCE_CODE = "local-video-library"
SOURCE_URL = "http://localhost:8765/"

# Per client fingerprint. Generous enough to tap through a feed, low enough to stop scripts.
LIKE_BURST = RateLimit("videos:like:burst", limit=120, window_seconds=5 * 60)


def _visitor_hash(visitor_id: str) -> str:
    return hashlib.sha256(visitor_id.encode()).hexdigest()


async def _find_visible(session: AsyncSession, slug: str) -> Content | None:
    """The video's row, or None if nobody interacted with it yet. 404 once an admin removed it."""
    content = await repository.find_by_slug(session, slug)
    if content is not None and content.status != ContentStatus.PUBLISHED:
        raise NotFoundError("Content not found", details={"slug": slug})
    return content


async def _ensure(session: AsyncSession, slug: str) -> Content:
    content = await _find_visible(session, slug)
    if content is not None:
        return content
    try:
        source = await content_service.upsert_source(
            session,
            code=SOURCE_CODE,
            name="Local video library",
            kind="manual",
            base_url=SOURCE_URL,
            trust_tier="curated",
        )
        content = Content(
            id=uuid.uuid4(),
            type=ContentType.VIDEO,
            slug=slug,
            title=slug,
            summary=slug,
            language=TextLanguage.VI,
        )
        session.add(content)
        await session.flush()
        content_service.add_source_link(
            session,
            content,
            source,
            external_id=slug,
            canonical_url=SOURCE_URL,
            fetched_at=datetime.now(UTC),
            source_published_at=None,
            precision=DatePrecision.DAY,
        )
        await content_service.publish(session, content, actor_subject=VIDEO_ACTOR)
        await session.commit()
    except IntegrityError:
        # Two first interactions raced; the other one created the row.
        await session.rollback()
        content = await _find_visible(session, slug)
        if content is None:
            raise
    return content


async def engagement(
    session: AsyncSession, slug: str, *, visitor_id: str | None
) -> VideoEngagement:
    content = await _find_visible(session, slug)
    if content is None:
        return VideoEngagement(likes=0, comments=0, liked=False)
    counts = await comments.count_published(session, [content.id])
    return VideoEngagement(
        likes=await repository.count_likes(session, content.id),
        comments=counts.get(content.id, 0),
        liked=visitor_id is not None
        and await repository.has_like(session, content.id, _visitor_hash(visitor_id)),
    )


async def set_like(
    session: AsyncSession,
    redis: Redis,
    slug: str,
    *,
    visitor_id: str,
    liked: bool,
    fingerprint: str,
) -> VideoEngagement:
    await rate_limit.enforce(redis, LIKE_BURST, fingerprint)
    visitor_hash = _visitor_hash(visitor_id)
    if liked:
        content = await _ensure(session, slug)
        await repository.add_like(session, content.id, visitor_hash)
    else:
        found = await _find_visible(session, slug)
        if found is not None:
            await repository.remove_like(session, found.id, visitor_hash)
    await session.commit()
    return await engagement(session, slug, visitor_id=visitor_id)


async def list_comments(
    session: AsyncSession, slug: str, *, limit: int, cursor: str | None
) -> CommentPage:
    if await _find_visible(session, slug) is None:
        return CommentPage(items=[], next_cursor=None)
    return await comments.list_for(session, ContentType.VIDEO, slug, limit=limit, cursor=cursor)


async def create_comment(
    session: AsyncSession,
    redis: Redis,
    slug: str,
    *,
    payload: CommentCreate,
    principal: Principal | None,
    fingerprint: str,
) -> CommentOut:
    await _ensure(session, slug)
    return await comments.create_for(
        session,
        redis,
        content_type=ContentType.VIDEO,
        slug=slug,
        payload=payload,
        principal=principal,
        fingerprint=fingerprint,
    )
