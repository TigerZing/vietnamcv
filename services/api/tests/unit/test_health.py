import time

from httpx import AsyncClient


async def test_liveness_needs_no_dependencies(unit_client: AsyncClient) -> None:
    response = await unit_client.get("/api/v1/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_readiness_fails_fast_when_dependencies_are_down(unit_client: AsyncClient) -> None:
    started = time.perf_counter()
    response = await unit_client.get("/api/v1/health/ready")
    elapsed = time.perf_counter() - started

    assert response.status_code == 503
    assert response.json() == {
        "status": "not_ready",
        "checks": {"database": "failed", "redis": "failed"},
    }
    # Two probes, each bounded by the 2s timeout.
    assert elapsed < 5
