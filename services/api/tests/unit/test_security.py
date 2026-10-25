from collections.abc import Awaitable, Callable

import pytest
from fastapi import Depends, FastAPI
from httpx import AsyncClient

from app.core.config import Settings
from app.core.security import (
    DEV_PRINCIPAL_HEADER,
    CurrentPrincipal,
    Principal,
    Role,
    require_role,
)
from app.main import create_app

ClientFactory = Callable[[FastAPI], Awaitable[AsyncClient]]


def build_app(settings: Settings) -> FastAPI:
    app = create_app(settings)

    @app.get("/me-test")
    async def me(principal: CurrentPrincipal) -> dict[str, str]:
        return {"subject": principal.subject}

    @app.get("/moderation-test")
    async def moderation(
        principal: Principal = Depends(require_role(Role.MODERATOR)),  # noqa: B008
    ) -> dict[str, str]:
        return {"subject": principal.subject}

    return app


@pytest.fixture
async def client(unit_settings: Settings, client_for: ClientFactory) -> AsyncClient:
    return await client_for(build_app(unit_settings))


async def test_anonymous_is_401(client: AsyncClient) -> None:
    response = await client.get("/me-test")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"


async def test_member_can_access_authenticated_route(client: AsyncClient) -> None:
    response = await client.get("/me-test", headers={DEV_PRINCIPAL_HEADER: "member"})
    assert response.status_code == 200
    assert response.json() == {"subject": "dev|member"}


async def test_member_is_forbidden_from_moderation(client: AsyncClient) -> None:
    response = await client.get("/moderation-test", headers={DEV_PRINCIPAL_HEADER: "member"})
    assert response.status_code == 403
    assert response.json()["error"]["details"] == {"required_role": "moderator"}


@pytest.mark.parametrize("name", ["moderator", "admin"])
async def test_moderator_and_admin_can_moderate(client: AsyncClient, name: str) -> None:
    response = await client.get("/moderation-test", headers={DEV_PRINCIPAL_HEADER: name})
    assert response.status_code == 200


async def test_unknown_dev_principal_is_401(client: AsyncClient) -> None:
    response = await client.get("/me-test", headers={DEV_PRINCIPAL_HEADER: "root"})
    assert response.status_code == 401


async def test_header_ignored_when_dev_auth_disabled(
    unit_settings: Settings, client_for: ClientFactory
) -> None:
    settings = unit_settings.model_copy(update={"dev_auth_enabled": False})
    client = await client_for(build_app(settings))
    response = await client.get("/me-test", headers={DEV_PRINCIPAL_HEADER: "admin"})
    assert response.status_code == 401


@pytest.mark.parametrize(
    ("granted", "required", "allowed"),
    [
        (Role.ADMIN, Role.MODERATOR, True),
        (Role.ADMIN, Role.MEMBER, True),
        (Role.MODERATOR, Role.MEMBER, True),
        (Role.MODERATOR, Role.ADMIN, False),
        (Role.MEMBER, Role.MODERATOR, False),
    ],
)
def test_role_hierarchy(granted: Role, required: Role, allowed: bool) -> None:
    assert Principal(subject="s", roles=frozenset({granted})).has_role(required) is allowed
