"""Transactional outbox (ADR-006).

Side effects that must follow a database change (cache revalidation, notifications,
enqueueing follow-up jobs) are recorded as rows in the same transaction as the change.
A periodic relay task dispatches them, so an event is never lost when the broker or a
worker fails after commit, and never sent for a change that rolled back.

Handlers must be idempotent: a crash between handling and marking dispatched causes a
redelivery.
"""

from __future__ import annotations

import uuid
from collections.abc import Callable, Mapping
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Index, Integer, String, Text, func, select, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.core.db import Base, UUIDPrimaryKeyMixin
from app.core.logging import get_logger

logger = get_logger(__name__)

MAX_ATTEMPTS = 10

OutboxHandler = Callable[[Mapping[str, Any]], None]


class OutboxEvent(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "outbox_events"
    __table_args__ = (
        Index(
            "ix_outbox_events_pending",
            "created_at",
            postgresql_where=text("dispatched_at IS NULL"),
        ),
    )

    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    dispatched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    last_error: Mapped[str | None] = mapped_column(Text)


def record_event(session: Session, event_type: str, payload: Mapping[str, Any]) -> OutboxEvent:
    """Add an event to the caller's transaction. It is dispatched only if the caller commits."""
    event = OutboxEvent(id=uuid.uuid4(), event_type=event_type, payload=dict(payload))
    session.add(event)
    return event


def relay_pending_events(
    session: Session,
    handlers: Mapping[str, OutboxHandler],
    *,
    batch_size: int = 100,
) -> int:
    """Dispatch up to ``batch_size`` pending events; return how many were dispatched.

    Rows are locked with ``SKIP LOCKED`` so concurrent relays never handle the same event.
    Events without a handler or whose handler fails are retried up to ``MAX_ATTEMPTS``.
    """
    events = session.scalars(
        select(OutboxEvent)
        .where(OutboxEvent.dispatched_at.is_(None), OutboxEvent.attempts < MAX_ATTEMPTS)
        .order_by(OutboxEvent.created_at)
        .limit(batch_size)
        .with_for_update(skip_locked=True)
    ).all()

    dispatched = 0
    for event in events:
        handler = handlers.get(event.event_type)
        event.attempts += 1
        if handler is None:
            event.last_error = f"No handler registered for {event.event_type!r}"
            logger.warning("outbox_no_handler", event_id=str(event.id), event_type=event.event_type)
            continue
        try:
            handler(event.payload)
        except Exception as exc:
            event.last_error = f"{type(exc).__name__}: {exc}"[:2000]
            logger.warning(
                "outbox_handler_failed",
                event_id=str(event.id),
                event_type=event.event_type,
                attempts=event.attempts,
                exc_info=True,
            )
            continue
        event.dispatched_at = func.now()
        event.last_error = None
        dispatched += 1

    session.commit()
    return dispatched
