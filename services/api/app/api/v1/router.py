"""Assembles the versioned public API."""

from fastapi import APIRouter

from app.api.v1 import health
from app.core.errors import ERROR_RESPONSES
from app.modules.comments import router as comments
from app.modules.content import router as content
from app.modules.demos import router as demos
from app.modules.identity import router as identity
from app.modules.media import router as media
from app.modules.news import router as news

api_router = APIRouter(prefix="/api/v1", responses=ERROR_RESPONSES)
api_router.include_router(health.router)
api_router.include_router(news.router)
api_router.include_router(comments.router)
api_router.include_router(comments.admin_router)
api_router.include_router(media.router)
api_router.include_router(demos.router)
api_router.include_router(identity.admin_router)
api_router.include_router(content.admin_router)
