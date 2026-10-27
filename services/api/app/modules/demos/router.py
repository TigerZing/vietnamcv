"""Which demos are on the site, so the web hides the ones an admin deleted (ADR-015)."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.db import DbSession
from app.modules.demos import service

router = APIRouter(tags=["demos"])


class DemoSlugs(BaseModel):
    items: list[str]


@router.get(
    "/demos",
    response_model=DemoSlugs,
    summary="Slugs of the published demos (`demo-<id>`)",
)
async def list_demos(session: DbSession) -> DemoSlugs:
    return DemoSlugs(items=await service.published_slugs(session))
