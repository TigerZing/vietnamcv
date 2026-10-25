import re
from collections.abc import Awaitable, Callable

import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from pydantic import BaseModel

from app.core.config import Settings
from app.core.errors import ConflictError, NotFoundError
from app.main import create_app

ClientFactory = Callable[[FastAPI], Awaitable[AsyncClient]]


class Payload(BaseModel):
    name: str


@pytest.fixture
async def client(unit_settings: Settings, client_for: ClientFactory) -> AsyncClient:
    app = create_app(unit_settings)

    @app.get("/boom/not-found")
    async def not_found() -> None:
        raise NotFoundError("Content not found", details={"slug": "missing"})

    @app.get("/boom/conflict")
    async def conflict() -> None:
        raise ConflictError("Duplicate external identity")

    @app.get("/boom/crash")
    async def crash() -> None:
        raise RuntimeError("secret internal detail")

    @app.post("/boom/validate")
    async def validate(payload: Payload) -> Payload:
        return payload

    return await client_for(app)


def assert_envelope(body: dict[str, object], code: str, request_id: str) -> None:
    error = body["error"]
    assert isinstance(error, dict)
    assert error["code"] == code
    assert error["request_id"] == request_id
    assert isinstance(error["message"], str)
    assert isinstance(error["details"], dict)


async def test_app_error_uses_envelope(client: AsyncClient) -> None:
    response = await client.get("/boom/not-found")
    assert response.status_code == 404
    assert_envelope(response.json(), "NOT_FOUND", response.headers["x-request-id"])
    assert response.json()["error"]["details"] == {"slug": "missing"}


async def test_conflict_maps_to_409(client: AsyncClient) -> None:
    response = await client.get("/boom/conflict")
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "CONFLICT"


async def test_unknown_route_uses_envelope(client: AsyncClient) -> None:
    response = await client.get("/does-not-exist")
    assert response.status_code == 404
    assert_envelope(response.json(), "NOT_FOUND", response.headers["x-request-id"])


async def test_validation_error_hides_input(client: AsyncClient) -> None:
    response = await client.post("/boom/validate", json={"name": 123, "password": "hunter2"})
    assert response.status_code == 422
    body = response.json()
    assert_envelope(body, "VALIDATION_ERROR", response.headers["x-request-id"])
    assert "hunter2" not in response.text
    assert body["error"]["details"]["errors"][0]["loc"] == ["body", "name"]


async def test_unhandled_error_returns_generic_500_with_request_id(client: AsyncClient) -> None:
    response = await client.get("/boom/crash")
    assert response.status_code == 500
    assert_envelope(response.json(), "INTERNAL_ERROR", response.headers["x-request-id"])
    assert "secret internal detail" not in response.text


async def test_valid_incoming_request_id_is_echoed(client: AsyncClient) -> None:
    response = await client.get("/boom/not-found", headers={"X-Request-ID": "trace-12345678"})
    assert response.headers["x-request-id"] == "trace-12345678"
    assert response.json()["error"]["request_id"] == "trace-12345678"


async def test_malformed_incoming_request_id_is_replaced(client: AsyncClient) -> None:
    response = await client.get("/boom/not-found", headers={"X-Request-ID": "bad id\nwith newline"})
    assert re.fullmatch(r"[0-9a-f]{32}", response.headers["x-request-id"])
