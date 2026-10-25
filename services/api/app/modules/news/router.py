"""Public news endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Path, Query, status

from app.core.db import DbSession
from app.core.errors import ErrorEnvelope
from app.core.pagination import DEFAULT_LIMIT, Cursor, Limit
from app.modules.news import service
from app.modules.news.models import NewsCategory, NewsRegion
from app.modules.news.schemas import SLUG_PATTERN, NewsDetail, NewsPage

router = APIRouter(prefix="/news", tags=["news"])

Slug = Annotated[str, Path(max_length=200, pattern=SLUG_PATTERN)]


@router.get("", response_model=NewsPage, summary="List published news, newest first")
async def list_news(
    session: DbSession,
    limit: Limit = DEFAULT_LIMIT,
    cursor: Cursor = None,
    category: Annotated[NewsCategory | None, Query()] = None,
    region: Annotated[NewsRegion | None, Query()] = None,
) -> NewsPage:
    return await service.list_news(
        session, limit=limit, cursor=cursor, category=category, region=region
    )


@router.get(
    "/{slug}",
    response_model=NewsDetail,
    summary="Get one published news post",
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorEnvelope}},
)
async def get_news(session: DbSession, slug: Slug) -> NewsDetail:
    return await service.get_news(session, slug)
