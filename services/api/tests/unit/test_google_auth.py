import time
from typing import Any

import pytest
from fastapi import FastAPI
from httpx import AsyncClient

from app.core.config import Settings
from app.core.security import CurrentPrincipal, Role
from app.main import create_app
from tests.conftest import ClientFactory
from tests.google_tokens import FakeGoogle


@pytest.fixture(scope="module")
def google() -> FakeGoogle:
    return FakeGoogle()


def build_app(settings: Settings, google: FakeGoogle | None) -> FastAPI:
    app = create_app(settings)
    app.state.id_token_verifier = google.verifier if google else None

    @app.get("/me-test")
    async def me(principal: CurrentPrincipal) -> dict[str, object]:
        return {
            "subject": principal.subject,
            "name": principal.name,
            "member": principal.has_role(Role.MEMBER),
            "moderator": principal.has_role(Role.MODERATOR),
        }

    return app


@pytest.fixture
async def client(
    unit_settings: Settings, client_for: ClientFactory, google: FakeGoogle
) -> AsyncClient:
    return await client_for(build_app(unit_settings, google))


async def test_valid_google_token_is_a_member(client: AsyncClient, google: FakeGoogle) -> None:
    response = await client.get(
        "/me-test", headers={"Authorization": f"Bearer {google.token(sub='42')}"}
    )
    assert response.status_code == 200
    assert response.json() == {
        "subject": "google|42",
        "name": "Nguyễn Văn A",
        "member": True,
        "moderator": False,
    }


@pytest.mark.parametrize(
    "claims",
    [
        {"aud": "someone-else.apps.googleusercontent.com"},
        {"iss": "https://evil.example"},
        {"exp": int(time.time()) - 3600},
        {"sub": None},
    ],
)
async def test_invalid_claims_are_rejected(
    client: AsyncClient, google: FakeGoogle, claims: dict[str, Any]
) -> None:
    response = await client.get(
        "/me-test", headers={"Authorization": f"Bearer {google.token(**claims)}"}
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"


async def test_token_signed_by_another_key_is_rejected(client: AsyncClient) -> None:
    forged = FakeGoogle().token()  # same kid, different private key
    response = await client.get("/me-test", headers={"Authorization": f"Bearer {forged}"})
    assert response.status_code == 401


@pytest.mark.parametrize("header", ["Bearer", "Basic abc", "Bearer    "])
async def test_malformed_authorization_header(client: AsyncClient, header: str) -> None:
    response = await client.get("/me-test", headers={"Authorization": header})
    assert response.status_code == 401


async def test_bearer_token_rejected_when_sign_in_not_configured(
    unit_settings: Settings, client_for: ClientFactory, google: FakeGoogle
) -> None:
    client = await client_for(build_app(unit_settings, None))
    response = await client.get("/me-test", headers={"Authorization": f"Bearer {google.token()}"})
    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Sign-in is not configured"
