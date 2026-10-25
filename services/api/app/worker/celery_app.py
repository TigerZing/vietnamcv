"""Celery application shared by worker and beat processes.

Run a worker:  ``celery -A app.worker.celery_app worker -Q default,fetch,enrich,publish``
Run beat:      ``celery -A app.worker.celery_app beat``

Beat uses RedBeat, which holds a Redis lock so a second beat process cannot schedule
duplicate runs if one is started by mistake.
"""

from __future__ import annotations

from celery import Celery, signals
from kombu import Queue

from app.core.config import Settings, get_settings
from app.core.logging import configure_logging


class Queues:
    DEFAULT = "default"
    FETCH = "fetch"
    ENRICH = "enrich"
    PUBLISH = "publish"

    ALL = (DEFAULT, FETCH, ENRICH, PUBLISH)


def create_celery(settings: Settings) -> Celery:
    app = Celery("vietnamcv", include=["app.worker.tasks"])
    app.conf.update(
        broker_url=settings.broker_url,
        # Results are not used: tasks write their outcome to PostgreSQL.
        task_ignore_result=True,
        result_backend=None,
        task_serializer="json",
        accept_content=["json"],
        timezone="UTC",
        enable_utc=True,
        task_queues=[Queue(name) for name in Queues.ALL],
        task_default_queue=Queues.DEFAULT,
        task_routes={
            "app.worker.tasks.relay_outbox": {"queue": Queues.PUBLISH},
            "app.modules.ingestion.*": {"queue": Queues.FETCH},
            "app.modules.enrichment.*": {"queue": Queues.ENRICH},
        },
        # At-least-once delivery: a task is acknowledged only after it finishes, so tasks
        # must be idempotent (see app.worker.idempotency).
        task_acks_late=True,
        task_reject_on_worker_lost=True,
        worker_prefetch_multiplier=1,
        task_time_limit=15 * 60,
        task_soft_time_limit=14 * 60,
        broker_transport_options={"visibility_timeout": 60 * 60},
        broker_connection_retry_on_startup=True,
        worker_hijack_root_logger=False,
        beat_scheduler="redbeat.RedBeatScheduler",
        redbeat_redis_url=str(settings.redis_url),
        redbeat_lock_timeout=5 * 60,
        beat_schedule={
            "relay-outbox": {
                "task": "app.worker.tasks.relay_outbox",
                "schedule": 30.0,
                "options": {"expires": 25},
            },
        },
    )
    return app


@signals.setup_logging.connect
def _configure_worker_logging(**_kwargs: object) -> None:
    settings = get_settings()
    configure_logging(level=settings.log_level, json=settings.log_json)


celery_app = create_celery(get_settings())
