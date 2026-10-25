"""Shared fixtures.

Integration tests use a real PostgreSQL and Redis (never SQLite). By default they start
throwaway containers with testcontainers; CI sets TEST_DATABASE_URL and TEST_REDIS_URL to
reuse its service containers instead.
"""

from __future__ import annotations

import os
from collections.abc import AsyncIterator, Awaitable, Callable, Iterator

import pytest
from asgi_lifespan import LifespanManager
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.config import Environment, Settings
from app.main import create_app

POSTGRES_IMAGE = "postgres:17-alpine"
REDIS_IMAGE = "redis:7-alpine"


@pytest.fixture(scope="session")
def database_url() -> Iterator[str]:
    if url := os.environ.get("TEST_DATABASE_URL"):
        yield url
        return
    from testcontainers.community.postgres import PostgresContainer

    with PostgresContainer(POSTGRES_IMAGE, driver="psycopg") as container:
        yield container.get_connection_url()


@pytest.fixture(scope="session")
def redis_url() -> Iterator[str]:
    if url := os.environ.get("TEST_REDIS_URL"):
        yield url
        return
    from testcontainers.core.container import DockerContainer
    from testcontainers.core.wait_strategies import LogMessageWaitStrategy

    container = (
        DockerContainer(REDIS_IMAGE)
        .with_exposed_ports(6379)
        .waiting_for(LogMessageWaitStrategy("Ready to accept connections"))
    )
    with container:
        host = container.get_container_host_ip()
        port = container.get_exposed_port(6379)
        yield f"redis://{host}:{port}/0"


def make_settings(database_url: str, redis_url: str, **overrides: object) -> Settings:
    values: dict[str, object] = {
        "APP_ENV": Environment.TEST,
        "database_url": database_url,
        "redis_url": redis_url,
        "log_json": False,
        "log_level": "WARNING",
        "dev_auth_enabled": True,
    }
    values.update(overrides)
    return Settings(**values)  # type: ignore[arg-type]


@pytest.fixture
def unit_settings() -> Settings:
    """Settings for tests that never open a connection."""
    return make_settings("postgresql+psycopg://unit@127.0.0.1:1/unit", "redis://127.0.0.1:1/0")


ClientFactory = Callable[[FastAPI], Awaitable[AsyncClient]]


@pytest.fixture
async def client_for() -> AsyncIterator[ClientFactory]:
    """Factory fixture: build an HTTP client around any app, with lifespan events run."""
    managers: list[LifespanManager] = []

    async def factory(app: FastAPI) -> AsyncClient:
        manager = LifespanManager(app)
        managers.append(manager)
        await manager.__aenter__()
        return AsyncClient(transport=ASGITransport(app=manager.app), base_url="http://test")

    yield factory
    for manager in reversed(managers):
        await manager.__aexit__(None, None, None)


@pytest.fixture
async def unit_client(unit_settings: Settings, client_for: ClientFactory) -> AsyncClient:
    """Client for an app whose dependencies are unreachable (fast, no containers)."""
    return await client_for(create_app(unit_settings))


@pytest.fixture(scope="session")
def migrated_database_url(database_url: str) -> str:
    """Database URL with all migrations applied once per test session."""
    from tests.integration.migrations import upgrade

    upgrade(database_url, "head")
    return database_url


@pytest.fixture
def integration_settings(migrated_database_url: str, redis_url: str) -> Settings:
    return make_settings(migrated_database_url, redis_url)


CONTENT_TABLES = (
    "comments",
    "users",
    "news_items",
    "content_sources",
    "contents",
    "sources",
    "audit_events",
    "outbox_events",
)


@pytest.fixture
def clean_database(migrated_database_url: str, redis_url: str) -> str:
    """Empty content tables and Redis before a test that writes them."""
    import redis
    from sqlalchemy import create_engine, text

    engine = create_engine(migrated_database_url)
    try:
        with engine.begin() as connection:
            connection.execute(text(f"TRUNCATE {', '.join(CONTENT_TABLES)} CASCADE"))
    finally:
        engine.dispose()
    client = redis.Redis.from_url(redis_url)
    try:
        client.flushdb()
    finally:
        client.close()
    return migrated_database_url
