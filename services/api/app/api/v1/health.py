"""Liveness and readiness probes (specs/02-ARCHITECTURE.md)."""

from __future__ import annotations

import asyncio
from enum import StrEnum
from typing import Literal

from fastapi import APIRouter, Request, Response, status
from pydantic import BaseModel
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.core.config import Settings
from app.core.logging import get_logger

router = APIRouter(prefix="/health", tags=["health"])
logger = get_logger(__name__)


class CheckStatus(StrEnum):
    OK = "ok"
    FAILED = "failed"


class LivenessResponse(BaseModel):
    status: Literal["ok"] = "ok"


class ReadinessResponse(BaseModel):
    status: Literal["ready", "not_ready"]
    checks: dict[str, CheckStatus]


async def _check_database(engine: AsyncEngine) -> None:
    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))


async def _check_redis(client: Redis) -> None:
    await client.ping()


@router.get("/live", response_model=LivenessResponse, summary="Process is alive")
async def live() -> LivenessResponse:
    return LivenessResponse()


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    summary="Dependencies are reachable",
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"model": ReadinessResponse}},
)
async def ready(request: Request, response: Response) -> ReadinessResponse:
    settings: Settings = request.app.state.settings
    timeout = settings.health_check_timeout_seconds
    probes = {
        "database": _check_database(request.app.state.db_engine),
        "redis": _check_redis(request.app.state.redis),
    }

    checks: dict[str, CheckStatus] = {}
    for name, probe in probes.items():
        try:
            await asyncio.wait_for(probe, timeout=timeout)
            checks[name] = CheckStatus.OK
        except Exception as exc:
            logger.warning("readiness_check_failed", check=name, error=type(exc).__name__)
            checks[name] = CheckStatus.FAILED

    if all(result is CheckStatus.OK for result in checks.values()):
        return ReadinessResponse(status="ready", checks=checks)
    response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return ReadinessResponse(status="not_ready", checks=checks)
