"""Admin endpoints for deleting and restoring any published content (ADR-015)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Response, status

from app.core.db import DbSession
from app.core.errors import ErrorEnvelope
from app.core.pagination import DEFAULT_LIMIT, Cursor, KeysetCursor, Limit
from app.core.security import Principal, Role, require_role
from app.modules.comments import service as comments
from app.modules.content import service
from app.modules.content.models import Content, ContentStatus, ContentType
from app.modules.content.schemas import AdminContentItem, AdminContentPage, AdminContentStatus

admin_router = APIRouter(prefix="/admin/contents", tags=["admin"])

Admin = Annotated[Principal, Depends(require_role(Role.ADMIN))]
ContentId = Annotated[uuid.UUID, Path()]
_NOT_FOUND: dict[int | str, dict[str, object]] = {
    status.HTTP_404_NOT_FOUND: {"model": ErrorEnvelope}
}


@admin_router.get("", response_model=AdminContentPage, summary="Content for the admin dashboard")
async def list_contents(
    session: DbSession,
    _admin: Admin,
    content_type: Annotated[ContentType | None, Query(alias="type")] = None,
    content_status: Annotated[AdminContentStatus, Query(alias="status")] = (
        AdminContentStatus.PUBLISHED
    ),
    limit: Limit = DEFAULT_LIMIT,
    cursor: Cursor = None,
) -> AdminContentPage:
    rows = await service.list_for_admin(
        session,
        content_type=content_type,
        status=content_status,
        limit=limit,
        cursor=KeysetCursor.decode(cursor) if cursor else None,
    )
    page = rows[:limit]
    counts = await comments.count_published(session, [content.id for content in page])
    next_cursor = None
    if len(rows) > limit:
        last = page[-1]
        next_cursor = KeysetCursor(last.created_at, last.id).encode()
    return AdminContentPage(
        items=[_item(content, counts.get(content.id, 0)) for content in page],
        next_cursor=next_cursor,
    )


@admin_router.delete(
    "/{content_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a news post or demo from the site (audited; imports keep it deleted)",
    responses=_NOT_FOUND,
)
async def remove_content(session: DbSession, admin: Admin, content_id: ContentId) -> Response:
    content = await service.get_for_update(session, content_id)
    await service.remove(session, content, actor_subject=admin.subject)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@admin_router.post(
    "/{content_id}/restore",
    response_model=AdminContentItem,
    summary="Publish deleted content again (audited)",
    responses={**_NOT_FOUND, status.HTTP_409_CONFLICT: {"model": ErrorEnvelope}},
)
async def restore_content(
    session: DbSession, admin: Admin, content_id: ContentId
) -> AdminContentItem:
    content = await service.get_for_update(session, content_id)
    await service.restore(session, content, actor_subject=admin.subject)
    await session.commit()
    counts = await comments.count_published(session, [content.id])
    return _item(content, counts.get(content.id, 0))


def _item(content: Content, comment_count: int) -> AdminContentItem:
    return AdminContentItem(
        id=content.id,
        type=ContentType(content.type),
        slug=content.slug,
        title=content.title,
        status=ContentStatus(content.status),
        published_at=content.published_at,
        created_at=content.created_at,
        comment_count=comment_count,
    )
