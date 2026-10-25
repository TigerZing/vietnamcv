"""Serves stored images."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Request, Response, status

from app.core.db import DbSession
from app.core.errors import ErrorEnvelope, NotFoundError
from app.modules.content import service as content_service
from app.modules.media import service

router = APIRouter(prefix="/media", tags=["media"])

# Stored bytes never change for an id, so caches may keep them indefinitely.
_IMMUTABLE = "public, max-age=31536000, immutable"


@router.get(
    "/{media_id}",
    summary="Get a stored image used by published content",
    response_class=Response,
    responses={
        status.HTTP_200_OK: {"content": {"image/webp": {}}, "description": "Image bytes"},
        status.HTTP_404_NOT_FOUND: {"model": ErrorEnvelope},
    },
)
async def get_media(session: DbSession, request: Request, media_id: uuid.UUID) -> Response:
    allow_uncleared = not request.app.state.settings.environment.is_deployed
    if not await content_service.media_is_public(
        session, media_id, allow_uncleared=allow_uncleared
    ):
        raise NotFoundError("Image not found", details={"media_id": str(media_id)})
    asset = await service.get_with_data(session, media_id)
    if asset is None:
        raise NotFoundError("Image not found", details={"media_id": str(media_id)})
    etag = f'"{asset.sha256}"'
    headers = {
        "Cache-Control": _IMMUTABLE,
        "ETag": etag,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
    }
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED, headers=headers)
    return Response(content=asset.data, media_type=asset.mime_type, headers=headers)
