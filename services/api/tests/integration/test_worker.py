import importlib

import pytest
from sqlalchemy import create_engine, delete, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.outbox import OutboxEvent, record_event

pytestmark = pytest.mark.integration


@pytest.fixture
def worker_env(
    monkeypatch: pytest.MonkeyPatch, migrated_database_url: str, redis_url: str
) -> object:
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("DATABASE_URL", migrated_database_url)
    monkeypatch.setenv("REDIS_URL", redis_url)
    get_settings.cache_clear()
    tasks = importlib.import_module("app.worker.tasks")
    tasks._session_factory.cache_clear()
    yield tasks
    get_settings.cache_clear()


def test_queues_and_reliability_settings(worker_env: object) -> None:
    from app.worker.celery_app import Queues, celery_app

    conf = celery_app.conf
    assert {queue.name for queue in conf.task_queues} == set(Queues.ALL)
    assert conf.task_acks_late is True
    assert conf.worker_prefetch_multiplier == 1
    assert conf.accept_content == ["json"]
    assert conf.beat_scheduler == "redbeat.RedBeatScheduler"


def test_ping_task(worker_env: object) -> None:
    assert worker_env.ping.apply().get() == "pong"  # type: ignore[attr-defined]


def test_relay_outbox_task_marks_events(worker_env: object, migrated_database_url: str) -> None:
    engine = create_engine(migrated_database_url)
    try:
        with Session(engine) as session:
            session.execute(delete(OutboxEvent))
            record_event(session, "NoHandlerYet", {"x": 1})
            session.commit()

        assert worker_env.relay_outbox.apply().get() == 0  # type: ignore[attr-defined]

        with Session(engine) as session:
            event = session.scalars(select(OutboxEvent)).one()
            assert event.attempts == 1
            assert event.last_error is not None
    finally:
        engine.dispose()
