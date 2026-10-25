"""Platform-level tasks. Feature modules define their own tasks next to their code."""

from __future__ import annotations

from collections.abc import Mapping
from functools import lru_cache

from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.core.db import create_sync_db_engine, create_sync_session_factory
from app.core.logging import get_logger
from app.core.outbox import OutboxHandler, relay_pending_events
from app.worker.celery_app import celery_app

logger = get_logger(__name__)

# Event type -> handler. Feature modules register handlers here as they are built
# (for example cache revalidation on ContentPublished in Sprint 1).
OUTBOX_HANDLERS: Mapping[str, OutboxHandler] = {}


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
