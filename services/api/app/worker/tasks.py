"""Platform-level tasks. Feature modules define their own tasks next to their code."""

from __future__ import annotations

from collections.abc import Mapping
from functools import lru_cache
from typing import Any

from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.core.db import create_sync_db_engine, create_sync_session_factory
from app.core.logging import get_logger
from app.core.outbox import OutboxHandler, relay_pending_events
from app.worker.celery_app import celery_app

logger = get_logger(__name__)


def _log_content_published(payload: Mapping[str, Any]) -> None:
    # Web pages read news at request time, so there is no cache to revalidate yet. When
    # pages become cached, this handler triggers on-demand revalidation instead.
    logger.info("content_published", **{key: str(value) for key, value in payload.items()})


# Event type -> handler. Feature modules register handlers here as they are built.
OUTBOX_HANDLERS: Mapping[str, OutboxHandler] = {"ContentPublished": _log_content_published}


@lru_cache(maxsize=1)
def _session_factory() -> sessionmaker[Session]:
    return create_sync_session_factory(create_sync_db_engine(str(get_settings().database_url)))


@celery_app.task(name="app.worker.tasks.ping")
def ping() -> str:
    return "pong"


@celery_app.task(name="app.worker.tasks.relay_outbox")
def relay_outbox() -> int:
    with _session_factory()() as session:
        dispatched = relay_pending_events(session, OUTBOX_HANDLERS)
    if dispatched:
        logger.info("outbox_relayed", dispatched=dispatched)
    return dispatched
