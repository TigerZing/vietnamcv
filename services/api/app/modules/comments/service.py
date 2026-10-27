"""Posting, listing and moderating comments."""

from __future__ import annotations

import hashlib
import uuid
from collections.abc import Sequence

from redis.asyncio import Redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import rate_limit
from app.core.errors import ConflictError, DomainValidationError, NotFoundError, UnauthorizedError
from app.core.logging import get_logger
from app.core.pagination import KeysetCursor
from app.core.security import Principal
from app.modules.audit import service as audit
from app.modules.comments import policy, repository
from app.modules.comments.models import AuthorKind, Comment, CommentStatus
from app.modules.comments.schemas import (
    CommentAuthor,
    CommentCreate,
    CommentOut,
    CommentPage,
    ModerationAction,
    ModerationQueue,
    PostingMode,
    QueuedComment,
)
from app.modules.content import service as content_service
from app.modules.content.models import ContentType
from app.modules.identity import service as identity
from app.modules.identity.models import User

logger = get_logger(__name__)

_MODE_TO_KIND = {
    PostingMode.ANONYMOUS: AuthorKind.ANONYMOUS,
    PostingMode.GUEST: AuthorKind.GUEST,
    PostingMode.ACCOUNT: AuthorKind.ACCOUNT,
}


async def count_published(
    session: AsyncSession, content_ids: Sequence[uuid.UUID]
) -> dict[uuid.UUID, int]:
    return await repository.count_published(session, content_ids)


async def list_for(
    session: AsyncSession,
    content_type: ContentType,
    slug: str,
    *,
    limit: int,
    cursor: str | None,
) -> CommentPage:
    """Published comments under a news post or a demo, newest first."""
    content = await content_service.get_published(session, content_type, slug)
    rows = await repository.list_comments(
        session,
        status=CommentStatus.PUBLISHED,
        content_id=content.id,
        limit=limit,
        cursor=KeysetCursor.decode(cursor) if cursor else None,
    )
    page = rows[:limit]
    return CommentPage(
        items=[_out(comment, user) for comment, user in page],
        next_cursor=_next_cursor(rows, limit),
    )


async def create_for(
    session: AsyncSession,
    redis: Redis,
    *,
    content_type: ContentType,
    slug: str,
    payload: CommentCreate,
    principal: Principal | None,
    fingerprint: str,
) -> CommentOut:
    content = await content_service.get_published(session, content_type, slug)

    if payload.website:
        logger.info("comment_honeypot_triggered", content_id=str(content.id))
        raise DomainValidationError("Comment rejected", details={"reason": "rejected"})

    kind = _MODE_TO_KIND[payload.mode]
    if kind is AuthorKind.ACCOUNT and principal is None:
        raise UnauthorizedError("Sign in to comment with your account")
    if (
        kind is AuthorKind.GUEST
        and payload.display_name
        and policy.is_reserved_name(payload.display_name)
    ):
        raise DomainValidationError(
            "This display name is reserved",
            details={"field": "display_name", "reason": "reserved_name"},
        )

    if kind is AuthorKind.ACCOUNT:
        assert principal is not None  # noqa: S101 - checked above
        limiter_key = hashlib.sha256(principal.subject.encode()).hexdigest()
        rules = (policy.ACCOUNT_BURST, policy.ACCOUNT_DAILY)
    else:
        limiter_key = fingerprint
        rules = (policy.GUEST_BURST, policy.GUEST_DAILY)
    for rule in rules:
        await rate_limit.enforce(redis, rule, limiter_key)

    body_hash = hashlib.sha256(payload.body.casefold().encode()).hexdigest()
    if not await rate_limit.claim_once(
        redis, f"comment:{content.id}:{limiter_key}:{body_hash}", policy.DUPLICATE_WINDOW_SECONDS
    ):
        raise ConflictError("Duplicate comment", details={"reason": "duplicate"})

    user = (
        await identity.provision_user(session, principal)
        if principal and (kind is AuthorKind.ACCOUNT)
        else None
    )
    status = policy.initial_status(kind, payload.body, payload.display_name)
    comment = Comment(
        id=uuid.uuid4(),
        content_id=content.id,
        author_kind=kind,
        display_name=payload.display_name if kind is AuthorKind.GUEST else None,
        user_id=user.id if user else None,
        body=payload.body,
        status=status,
        client_fingerprint=fingerprint,
        created_at=await session.scalar(select(func.now())),
    )
    session.add(comment)
    await session.commit()
    logger.info("comment_created", comment_id=str(comment.id), kind=kind.value, status=status.value)
    return _out(comment, user)


async def moderation_queue(
    session: AsyncSession, *, status: CommentStatus, limit: int, cursor: str | None
) -> ModerationQueue:
    rows = await repository.list_comments(
        session,
        status=status,
        content_id=None,
        limit=limit,
        cursor=KeysetCursor.decode(cursor) if cursor else None,
    )
    page = rows[:limit]
    refs = await content_service.refs(session, [comment.content_id for comment, _ in page])
    return ModerationQueue(
        items=[
            QueuedComment(
                **_out(comment, user).model_dump(),
                content_id=comment.content_id,
                content_type=refs[comment.content_id].type,
                content_slug=refs[comment.content_id].slug,
                content_title=refs[comment.content_id].title,
            )
            for comment, user in page
        ],
        next_cursor=_next_cursor(rows, limit),
    )


async def moderate(
    session: AsyncSession,
    comment_id: uuid.UUID,
    *,
    action: ModerationAction,
    reason: str | None,
    principal: Principal,
) -> CommentOut:
    row = await repository.get_with_author(session, comment_id)
    if row is None:
        raise NotFoundError("Comment not found", details={"comment_id": str(comment_id)})
    comment, user = row
    target = CommentStatus.PUBLISHED if action is ModerationAction.PUBLISH else CommentStatus.HIDDEN
    before = comment.status
    if before != target:
        comment.status = target
        comment.moderated_at = await session.scalar(select(func.now()))
        comment.moderated_by = principal.subject
        audit.record(
            session,
            actor_subject=principal.subject,
            action=f"comment.{action.value}",
            target_type="comment",
            target_id=comment.id,
            reason=reason,
            before={"status": before},
            after={"status": target.value},
        )
    await session.commit()
    return _out(comment, user)


async def delete(session: AsyncSession, comment_id: uuid.UUID, *, principal: Principal) -> None:
    """Delete a comment for good (ADR-015). The audit event keeps what it said."""
    row = await repository.get_with_author(session, comment_id)
    if row is None:
        raise NotFoundError("Comment not found", details={"comment_id": str(comment_id)})
    comment, _ = row
    audit.record(
        session,
        actor_subject=principal.subject,
        action="comment.deleted",
        target_type="comment",
        target_id=comment.id,
        before={
            "status": comment.status,
            "content_id": str(comment.content_id),
            "author_kind": comment.author_kind,
            "body": comment.body,
        },
    )
    await session.delete(comment)
    await session.commit()
    logger.info("comment_deleted", comment_id=str(comment_id))


def _out(comment: Comment, user: User | None) -> CommentOut:
    kind = AuthorKind(comment.author_kind)
    if kind is AuthorKind.ACCOUNT:
        author = CommentAuthor(
            kind=kind,
            name=user.display_name if user else None,
            avatar_url=user.avatar_url if user else None,
            verified=True,
        )
    else:
        author = CommentAuthor(
            kind=kind, name=comment.display_name, avatar_url=None, verified=False
        )
    return CommentOut(
        id=comment.id,
        author=author,
        body=comment.body,
        status=CommentStatus(comment.status),
        created_at=comment.created_at,
    )


def _next_cursor(rows: Sequence[tuple[Comment, User | None]], limit: int) -> str | None:
    if len(rows) <= limit:
        return None
    last = rows[limit - 1][0]
    return KeysetCursor(last.created_at, last.id).encode()
