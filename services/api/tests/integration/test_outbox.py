from collections.abc import Iterator, Mapping
from typing import Any

import pytest
from sqlalchemy import Engine, create_engine, delete, select
from sqlalchemy.orm import Session

from app.core.outbox import MAX_ATTEMPTS, OutboxEvent, record_event, relay_pending_events

pytestmark = pytest.mark.integration


@pytest.fixture
def engine(migrated_database_url: str) -> Iterator[Engine]:
    engine = create_engine(migrated_database_url)
    with Session(engine) as session:
        session.execute(delete(OutboxEvent))
        session.commit()
    yield engine
    engine.dispose()


def test_rolled_back_event_is_never_dispatched(engine: Engine) -> None:
    received: list[Mapping[str, Any]] = []
    with Session(engine) as session:
        record_event(session, "ContentPublished", {"content_id": "a"})
        session.rollback()

    with Session(engine) as session:
        assert relay_pending_events(session, {"ContentPublished": received.append}) == 0
    assert received == []


def test_committed_event_is_dispatched_once(engine: Engine) -> None:
    received: list[Mapping[str, Any]] = []
    with Session(engine) as session:
        record_event(session, "ContentPublished", {"content_id": "a"})
        session.commit()

    handlers = {"ContentPublished": received.append}
    with Session(engine) as session:
        assert relay_pending_events(session, handlers) == 1
    with Session(engine) as session:
        assert relay_pending_events(session, handlers) == 0

    assert received == [{"content_id": "a"}]


def test_failing_handler_is_retried_and_records_error(engine: Engine) -> None:
    def failing(_payload: Mapping[str, Any]) -> None:
        raise RuntimeError("cache unavailable")

    with Session(engine) as session:
        record_event(session, "ContentPublished", {"content_id": "a"})
        session.commit()

    with Session(engine) as session:
        assert relay_pending_events(session, {"ContentPublished": failing}) == 0
    with Session(engine) as session:
        event = session.scalars(select(OutboxEvent)).one()
        assert event.attempts == 1
        assert event.dispatched_at is None
        assert event.last_error == "RuntimeError: cache unavailable"


def test_event_is_abandoned_after_max_attempts(engine: Engine) -> None:
    with Session(engine) as session:
        event = record_event(session, "Unhandled", {})
        event.attempts = MAX_ATTEMPTS
        session.commit()

    with Session(engine) as session:
        assert relay_pending_events(session, {}) == 0
        assert session.scalars(select(OutboxEvent)).one().attempts == MAX_ATTEMPTS
