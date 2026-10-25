"""FastAPI application factory."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis

from app.api.v1.router import api_router
from app.core.config import Settings, get_settings
from app.core.db import create_async_db_engine, create_async_session_factory
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging, get_logger
from app.core.middleware import RequestContextMiddleware

logger = get_logger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(level=settings.log_level, json=settings.log_json)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        engine = create_async_db_engine(str(settings.database_url))
        redis = Redis.from_url(
            str(settings.redis_url),
            socket_connect_timeout=settings.health_check_timeout_seconds,
            socket_timeout=settings.health_check_timeout_seconds,
        )
        app.state.db_engine = engine
        app.state.session_factory = create_async_session_factory(engine)
        app.state.redis = redis
        logger.info("api_started", environment=settings.environment.value)
        try:
            yield
        finally:
            await redis.aclose()
            await engine.dispose()
            logger.info("api_stopped")

    app = FastAPI(
        title="VietnamCV API",
        version="0.1.0",
        description="Public and administrative API for VietnamCV.",
        openapi_url="/api/v1/openapi.json",
        docs_url="/api/v1/docs",
        redoc_url=None,
        lifespan=lifespan,
    )
    app.state.settings = settings

    if settings.cors_allowed_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin).rstrip("/") for origin in settings.cors_allowed_origins],
            allow_methods=["GET", "POST", "PATCH", "DELETE"],
            allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "X-Request-ID"],
            expose_headers=["X-Request-ID"],
        )
    # Added last so it is the outermost middleware and wraps everything, including CORS.
    app.add_middleware(RequestContextMiddleware)

    register_exception_handlers(app)
    app.include_router(api_router)
    return app
