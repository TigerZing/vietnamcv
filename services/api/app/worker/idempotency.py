"""Run-once guard for background jobs (ADR-006).

Celery delivers at least once, so a job can run twice (worker crash, visibility timeout).
:func:`run_once` makes a unit of work effective once per idempotency key:

* a short-lived lock stops two workers running the same key concurrently;
* a completion marker, written only after success, makes later deliveries no-ops;
* a failed run leaves no marker, so a retry does the work again.

This guards side effects outside PostgreSQL. Database writes should also rely on unique
constraints and upserts, which remain correct even if Redis loses the marker.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from enum import StrEnum

from redis import Redis


class RunOutcome(StrEnum):
    EXECUTED = "executed"
    ALREADY_DONE = "already_done"
    IN_PROGRESS = "in_progress"


@dataclass(frozen=True, slots=True)
class RunResult[T]:
    outcome: RunOutcome
    value: T | None = None


def run_once[T](
    redis: Redis,
    key: str,
    work: Callable[[], T],
    *,
    lock_ttl_seconds: int = 15 * 60,
    done_ttl_seconds: int = 7 * 24 * 60 * 60,
) -> RunResult[T]:
    done_key = f"idempotency:done:{key}"
    lock_key = f"idempotency:lock:{key}"

    if redis.exists(done_key):
        return RunResult(RunOutcome.ALREADY_DONE)
    if not redis.set(lock_key, "1", nx=True, ex=lock_ttl_seconds):
        return RunResult(RunOutcome.IN_PROGRESS)
    try:
        # Re-check after taking the lock: another worker may have finished in between.
        if redis.exists(done_key):
            return RunResult(RunOutcome.ALREADY_DONE)
        value = work()
        redis.set(done_key, "1", ex=done_ttl_seconds)
        return RunResult(RunOutcome.EXECUTED, value)
    finally:
        redis.delete(lock_key)
