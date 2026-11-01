"""Likes, comment threads and engagement counts for short videos (ADR-019)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header, Path, Request, status
from redis.asyncio import Redis

from app.core.db import DbSession
from app.core.errors import ErrorEnvelope
from app.core.pagination import DEFAULT_LIMIT, Cursor, Limit
from app.core.rate_limit import client_fingerprint
from app.core.security import OptionalPrincipal
from app.modules.comments.schemas import CommentCreate, CommentOut, CommentPage
from app.modules.videos import service
from app.modules.videos.schemas import (
    VIDEO_SLUG_PATTERN,
    VISITOR_ID_PATTERN,
    VideoEngagement,
)

router = APIRouter(prefix="/videos", tags=["videos"])

Slug = Annotated[str, Path(max_length=200, pattern=VIDEO_SLUG_PATTERN)]
VisitorId = Annotated[str, Header(alias="X-Visitor-Id", pattern=VISITOR_ID_PATTERN)]
OptionalVisitorId = Annotated[str | None, Header(alias="X-Visitor-Id", pattern=VISITOR_ID_PATTERN)]


def _redis(request: Request) -> Redis:
    redis: Redis = request.app.state.redis
    return redis


def _fingerprint(request: Request) -> str:
    return client_fingerprint(request, request.app.state.settings)


Redis_ = Annotated[Redis, Depends(_redis)]
Fingerprint = Annotated[str, Depends(_fingerprint)]

_NOT_FOUND: dict[int | str, dict[str, object]] = {
    status.HTTP_404_NOT_FOUND: {"model": ErrorEnvelope}
}
_LIKE_ERRORS: dict[int | str, dict[str, object]] = {
    **_NOT_FOUND,
    status.HTTP_429_TOO_MANY_REQUESTS: {"model": ErrorEnvelope},
}
_COMMENT_ERRORS: dict[int | str, dict[str, object]] = {
    **_LIKE_ERRORS,
    status.HTTP_401_UNAUTHORIZED: {"model": ErrorEnvelope},
    status.HTTP_409_CONFLICT: {"model": ErrorEnvelope},
}


@router.get(
    "/{slug}/engagement",
    response_model=VideoEngagement,
    summary="Like and comment counts of a video, and whether this visitor liked it",
    description="A video nobody interacted with yet has zero counts, not a 404.",
    responses=_NOT_FOUND,
)
async def get_engagement(
    session: DbSession, slug: Slug, visitor_id: OptionalVisitorId = None
) -> VideoEngagement:
    return await service.engagement(session, slug, visitor_id=visitor_id)


@router.put(
    "/{slug}/like",
    response_model=VideoEngagement,
    summary="Like a video (idempotent, rate limited per client)",
    responses=_LIKE_ERRORS,
)
async def like_video(
    session: DbSession, slug: Slug, visitor_id: VisitorId, redis: Redis_, fingerprint: Fingerprint
) -> VideoEngagement:
    return await service.set_like(
        session, redis, slug, visitor_id=visitor_id, liked=True, fingerprint=fingerprint
    )


@router.delete(
    "/{slug}/like",
    response_model=VideoEngagement,
    summary="Take back a like (idempotent, rate limited per client)",
    responses=_LIKE_ERRORS,
)
async def unlike_video(
    session: DbSession, slug: Slug, visitor_id: VisitorId, redis: Redis_, fingerprint: Fingerprint
) -> VideoEngagement:
    return await service.set_like(
        session, redis, slug, visitor_id=visitor_id, liked=False, fingerprint=fingerprint
    )


@router.get(
    "/{slug}/comments",
    response_model=CommentPage,
    summary="List published comments on a video, newest first",
    responses=_NOT_FOUND,
)
async def list_video_comments(
    session: DbSession, slug: Slug, limit: Limit = DEFAULT_LIMIT, cursor: Cursor = None
) -> CommentPage:
    return await service.list_comments(session, slug, limit=limit, cursor=cursor)


@router.post(
    "/{slug}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Comment on a video, with the same rules as news comments",
    responses=_COMMENT_ERRORS,
)
async def create_video_comment(  # noqa: PLR0917 - FastAPI injects dependencies positionally
    session: DbSession,
    slug: Slug,
    payload: CommentCreate,
    principal: OptionalPrincipal,
    redis: Redis_,
    fingerprint: Fingerprint,
) -> CommentOut:
    return await service.create_comment(
        session, redis, slug, payload=payload, principal=principal, fingerprint=fingerprint
    )
