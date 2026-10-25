"""Public news endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Path, Query, Request, status

from app.core.db import DbSession
from app.core.errors import ErrorEnvelope
from app.core.pagination import DEFAULT_LIMIT, Cursor, Limit
from app.modules.content.models import TextLanguage
from app.modules.news import service
from app.modules.news.models import NewsCategory, NewsRegion
from app.modules.news.schemas import SLUG_PATTERN, TAG_PATTERN, NewsDetail, NewsPage, TagList

router = APIRouter(prefix="/news", tags=["news"])

Slug = Annotated[str, Path(max_length=200, pattern=SLUG_PATTERN)]
Lang = Annotated[
    TextLanguage,
    Query(description="Language of title, summary and body; falls back to Vietnamese"),
]


def _allow_uncleared_images(request: Request) -> bool:
    # Images whose permission is still pending show locally only (ADR-010).
    return not request.app.state.settings.environment.is_deployed


@router.get("", response_model=NewsPage, summary="List published news, newest first")
async def list_news(
    session: DbSession,
    request: Request,
    *,
    limit: Limit = DEFAULT_LIMIT,
    cursor: Cursor = None,
    category: Annotated[NewsCategory | None, Query()] = None,
    region: Annotated[NewsRegion | None, Query()] = None,
    tag: Annotated[
        str | None, Query(pattern=TAG_PATTERN, description='Technology hashtag, without "#"')
    ] = None,
    lang: Lang = TextLanguage.VI,
) -> NewsPage:
    return await service.list_news(
        session,
        limit=limit,
        cursor=cursor,
        category=category,
        region=region,
        tag=tag,
        language=lang,
        allow_uncleared_images=_allow_uncleared_images(request),
    )


# Declared before "/{slug}" so that "tags" is never read as a slug.
@router.get("/tags", response_model=TagList, summary="Technology hashtags of published news")
async def list_tags(
    session: DbSession, region: Annotated[NewsRegion | None, Query()] = None
) -> TagList:
    return await service.list_tags(session, region=region)


@router.get(
    "/{slug}",
    response_model=NewsDetail,
    summary="Get one published news post",
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorEnvelope}},
)
async def get_news(
    session: DbSession, request: Request, slug: Slug, lang: Lang = TextLanguage.VI
) -> NewsDetail:
    return await service.get_news(
        session,
        slug,
        language=lang,
        allow_uncleared_images=_allow_uncleared_images(request),
    )
