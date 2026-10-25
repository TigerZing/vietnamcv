from collections.abc import Iterator

import pytest
from redis import Redis

from app.worker.idempotency import RunOutcome, run_once

pytestmark = pytest.mark.integration


@pytest.fixture
def redis(redis_url: str) -> Iterator[Redis]:
    client = Redis.from_url(redis_url)
    client.flushdb()
    yield client
    client.close()


def test_second_delivery_has_no_effect(redis: Redis) -> None:
    effects: list[str] = []

    def work() -> int:
        effects.append("fetched")
        return len(effects)

    first = run_once(redis, "fetch:arxiv:2026-10-25T00", work)
    second = run_once(redis, "fetch:arxiv:2026-10-25T00", work)

    assert first.outcome is RunOutcome.EXECUTED
    assert first.value == 1
    assert second.outcome is RunOutcome.ALREADY_DONE
    assert effects == ["fetched"]


def test_failed_run_can_be_retried(redis: Redis) -> None:
    attempts: list[int] = []

    def flaky() -> str:
        attempts.append(1)
        if len(attempts) == 1:
            raise ConnectionError("upstream 503")
        return "ok"

    with pytest.raises(ConnectionError):
        run_once(redis, "key", flaky)
    result = run_once(redis, "key", flaky)

    assert result.outcome is RunOutcome.EXECUTED
    assert len(attempts) == 2


def test_concurrent_run_is_skipped(redis: Redis) -> None:
    redis.set("idempotency:lock:key", "1")
    result = run_once(redis, "key", lambda: "never")
    assert result.outcome is RunOutcome.IN_PROGRESS
