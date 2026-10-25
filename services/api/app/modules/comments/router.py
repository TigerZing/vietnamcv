"""Comment endpoints: public thread, posting, and the moderation queue."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Request, status
from redis.asyncio import Redis

from app.core.db import DbSession
from app.core.errors import ErrorEnvelope
from app.core.pagination import DEFAULT_LIMIT, Cursor, Limit
from app.core.rate_limit import client_fingerprint
from app.core.security import OptionalPrincipal, Principal, Role, require_role
from app.modules.comments import service
from app.modules.comments.models import CommentStatus
from app.modules.comments.schemas import (
    CommentCreate,
    CommentOut,
    CommentPage,
    ModerationQueue,
    ModerationRequest,
)
from app.modules.news.schemas import SLUG_PATTERN

router = APIRouter(tags=["comments"])
admin_router = APIRouter(prefix="/admin/comments", tags=["moderation"])

Slug = Annotated[str, Path(max_length=200, pattern=SLUG_PATTERN)]
Moderator = Annotated[Principal, Depends(require_role(Role.MODERATOR))]


def _redis(request: Request) -> Redis:
    redis: Redis = request.app.state.redis
    return redis


def _fingerprint(request: Request) -> str:
    return client_fingerprint(request, request.app.state.settings)


_ERRORS: dict[int | str, dict[str, object]] = {
    status.HTTP_401_UNAUTHORIZED: {"model": ErrorEnvelope},
    status.HTTP_404_NOT_FOUND: {"model": ErrorEnvelope},
    status.HTTP_409_CONFLICT: {"model": ErrorEnvelope},
    status.HTTP_429_TOO_MANY_REQUESTS: {"model": ErrorEnvelope},
}


@router.get(
    "/news/{slug}/comments",
    response_model=CommentPage,
    summary="List published comments on a news post, newest first",
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorEnvelope}},
)
async def list_comments(
    session: DbSession, slug: Slug, limit: Limit = DEFAULT_LIMIT, cursor: Cursor = None
) -> CommentPage:
    return await service.list_for_news(session, slug, limit=limit, cursor=cursor)


@router.post(
    "/news/{slug}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Post a comment anonymously, with a display name, or as the signed-in user",
    description=(
        "Comments by signed-in users are published at once. Anonymous and guest comments "
        "containing links are held for moderation (`status: pending`). Rate limited per "
        "client and per account."
    ),
    responses=_ERRORS,
)
async def create_comment(  # noqa: PLR0917 - FastAPI injects dependencies positionally
    session: DbSession,
    slug: Slug,
    payload: CommentCreate,
    principal: OptionalPrincipal,
    redis: Annotated[Redis, Depends(_redis)],
    fingerprint: Annotated[str, Depends(_fingerprint)],
) -> CommentOut:
    return await service.create_for_news(
        session,
        redis,
        slug=slug,
        payload=payload,
        principal=principal,
        fingerprint=fingerprint,
    )


@admin_router.get("", response_model=ModerationQueue, summary="Moderation queue")
async def moderation_queue(
    session: DbSession,
    _moderator: Moderator,
    comment_status: Annotated[CommentStatus, Query(alias="status")] = CommentStatus.PENDING,
    limit: Limit = DEFAULT_LIMIT,
    cursor: Cursor = None,
) -> ModerationQueue:
    return await service.moderation_queue(
        session, status=comment_status, limit=limit, cursor=cursor
    )


@admin_router.post(
    "/{comment_id}/moderate",
    response_model=CommentOut,
    summary="Publish or hide a comment (audited)",
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorEnvelope}},
)
async def moderate_comment(
    session: DbSession,
    moderator: Moderator,
    comment_id: Annotated[uuid.UUID, Path()],
    payload: ModerationRequest,
) -> CommentOut:
    return await service.moderate(
        session, comment_id, action=payload.action, reason=payload.reason, principal=moderator
    )
