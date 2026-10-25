"""Assembles the versioned public API."""

from fastapi import APIRouter

from app.api.v1 import health
from app.core.errors import ERROR_RESPONSES

api_router = APIRouter(prefix="/api/v1", responses=ERROR_RESPONSES)
api_router.include_router(health.router)
