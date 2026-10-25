from collections.abc import Awaitable, Callable

import pytest
from fastapi import FastAPI
from httpx import AsyncClient

from app.core.config import Settings
from app.main import create_app

pytestmark = pytest.mark.integration


async def test_ready_when_database_and_redis_are_up(
    integration_settings: Settings,
    client_for: Callable[[FastAPI], Awaitable[AsyncClient]],
) -> None:
    client = await client_for(create_app(integration_settings))
    response = await client.get("/api/v1/health/ready")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ready",
        "checks": {"database": "ok", "redis": "ok"},
    }
