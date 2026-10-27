from pathlib import Path
from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.cli import create_admin
from app.cli.seed_demos import SEED_FILE as DEMO_SEED
from app.cli.seed_demos import seed as seed_demos
from app.cli.seed_news import seed as seed_news
from app.core.config import Settings
from app.core.security import DEV_PRINCIPAL_HEADER
from app.main import create_app
from app.modules.audit.models import AuditEvent
from app.modules.comments.models import Comment
from app.modules.content.models import Content
from app.modules.identity.models import AdminAccount
from tests.conftest import ClientFactory
from tests.media_helpers import FakeImageServer

pytestmark = pytest.mark.integration

FIXTURE = Path(__file__).resolve().parents[1] / "fixtures" / "news_small.json"
PASSWORD = "mat-khau-rat-dai-2026"


async def reseed(database_url: str) -> None:
    await seed_news([FIXTURE], database_url, client=FakeImageServer().client())
    await seed_demos(DEMO_SEED, database_url)


@pytest.fixture
async def client(
    clean_database: str, integration_settings: Settings, client_for: ClientFactory
) -> AsyncClient:
    await reseed(clean_database)
    await create_admin._run(clean_database, "Admin", PASSWORD)
    return await client_for(create_app(integration_settings))


async def login(
    client: AsyncClient, username: str = "admin", password: str = PASSWORD
) -> dict[str, Any]:
    response = await client.post(
        "/api/v1/admin/auth/login", json={"username": username, "password": password}
    )
    return {"status": response.status_code, "body": response.json()}


async def admin_headers(client: AsyncClient) -> dict[str, str]:
    result = await login(client)
    assert result["status"] == 200
    return {"Authorization": f"Bearer {result['body']['access_token']}"}


def content_id(database_url: str, slug: str) -> str:
    engine = create_engine(database_url)
    try:
        with Session(engine) as session:
            found = session.scalar(select(Content.id).where(Content.slug == slug))
            assert found is not None
            return str(found)
    finally:
        engine.dispose()


def rows(database_url: str, statement):  # type: ignore[no-untyped-def]
    engine = create_engine(database_url)
    try:
        with Session(engine) as session:
            return session.execute(statement).all()
    finally:
        engine.dispose()


async def test_login_issues_an_admin_session(client: AsyncClient, clean_database: str) -> None:
    result = await login(client, username="  ADMIN ")
    assert result["status"] == 200
    assert result["body"]["username"] == "admin"
    headers = {"Authorization": f"Bearer {result['body']['access_token']}"}

    me = await client.get("/api/v1/admin/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["username"] == "admin"

    stored = rows(clean_database, select(AdminAccount.password_hash, AdminAccount.last_login_at))
    assert stored[0][0].startswith("scrypt$")
    assert PASSWORD not in stored[0][0]
    assert stored[0][1] is not None


@pytest.mark.parametrize(
    ("username", "password"), [("admin", "wrong-password"), ("nobody", PASSWORD)]
)
async def test_wrong_credentials_get_the_same_401(
    client: AsyncClient, username: str, password: str
) -> None:
    result = await login(client, username, password)
    assert result["status"] == 401
    assert result["body"]["error"]["message"] == "Wrong username or password"


async def test_login_is_rate_limited(client: AsyncClient) -> None:
    for _ in range(10):
        assert (await login(client, password="wrong-password"))["status"] == 401
    result = await login(client)
    assert result["status"] == 429


async def test_admin_endpoints_need_the_admin_role(
    client: AsyncClient, clean_database: str
) -> None:
    target = content_id(clean_database, "newest-post")
    anonymous = await client.delete(f"/api/v1/admin/contents/{target}")
    assert anonymous.status_code == 401
    for name in ("member", "moderator"):
        response = await client.delete(
            f"/api/v1/admin/contents/{target}", headers={DEV_PRINCIPAL_HEADER: name}
        )
        assert response.status_code == 403
    listed = await client.get("/api/v1/admin/contents", headers={DEV_PRINCIPAL_HEADER: "member"})
    assert listed.status_code == 403


async def test_deleted_news_post_stays_deleted_after_reimport(
    client: AsyncClient, clean_database: str
) -> None:
    headers = await admin_headers(client)
    listed = await client.get("/api/v1/admin/contents?type=news", headers=headers)
    assert listed.status_code == 200
    slugs = [item["slug"] for item in listed.json()["items"]]
    assert "newest-post" in slugs
    target = content_id(clean_database, "newest-post")

    deleted = await client.delete(f"/api/v1/admin/contents/{target}", headers=headers)
    assert deleted.status_code == 204
    assert (await client.get("/api/v1/news/newest-post")).status_code == 404
    feed = (await client.get("/api/v1/news")).json()["items"]
    assert "newest-post" not in [item["slug"] for item in feed]

    await reseed(clean_database)
    assert (await client.get("/api/v1/news/newest-post")).status_code == 404

    removed = await client.get("/api/v1/admin/contents?status=removed", headers=headers)
    assert [item["slug"] for item in removed.json()["items"]] == ["newest-post"]

    again = await client.delete(f"/api/v1/admin/contents/{target}", headers=headers)
    assert again.status_code == 204
    actions = rows(
        clean_database, select(AuditEvent.action).where(AuditEvent.action == "content.removed")
    )
    assert len(actions) == 1

    restored = await client.post(f"/api/v1/admin/contents/{target}/restore", headers=headers)
    assert restored.status_code == 200
    assert restored.json()["status"] == "published"
    assert (await client.get("/api/v1/news/newest-post")).status_code == 200

    conflict = await client.post(f"/api/v1/admin/contents/{target}/restore", headers=headers)
    assert conflict.status_code == 409


async def test_deleted_demo_leaves_the_demo_list(client: AsyncClient, clean_database: str) -> None:
    headers = await admin_headers(client)
    before = (await client.get("/api/v1/demos")).json()["items"]
    assert "demo-01" in before

    target = content_id(clean_database, "demo-01")
    assert (
        await client.delete(f"/api/v1/admin/contents/{target}", headers=headers)
    ).status_code == 204
    await reseed(clean_database)

    after = (await client.get("/api/v1/demos")).json()["items"]
    assert "demo-01" not in after
    assert len(after) == len(before) - 1
    assert (await client.get("/api/v1/demos/demo-01/comments")).status_code == 404


async def test_unknown_content_is_404(client: AsyncClient) -> None:
    headers = await admin_headers(client)
    missing = "00000000-0000-0000-0000-000000000000"
    assert (
        await client.delete(f"/api/v1/admin/contents/{missing}", headers=headers)
    ).status_code == 404
    assert (
        await client.delete(f"/api/v1/admin/comments/{missing}", headers=headers)
    ).status_code == 404


async def test_admin_deletes_a_comment(client: AsyncClient, clean_database: str) -> None:
    created = await client.post(
        "/api/v1/news/newest-post/comments", json={"mode": "anonymous", "body": "Spam spam"}
    )
    assert created.status_code == 201
    comment_id = created.json()["id"]
    headers = await admin_headers(client)

    queue = await client.get("/api/v1/admin/comments?status=published", headers=headers)
    item = queue.json()["items"][0]
    assert item["content_slug"] == "newest-post"
    assert item["content_type"] == "news"

    moderator = await client.delete(
        f"/api/v1/admin/comments/{comment_id}", headers={DEV_PRINCIPAL_HEADER: "moderator"}
    )
    assert moderator.status_code == 403
    deleted = await client.delete(f"/api/v1/admin/comments/{comment_id}", headers=headers)
    assert deleted.status_code == 204

    assert rows(clean_database, select(Comment.id)) == []
    audit = rows(
        clean_database, select(AuditEvent.before).where(AuditEvent.action == "comment.deleted")
    )
    assert audit[0][0]["body"] == "Spam spam"
    listed = (await client.get("/api/v1/news/newest-post/comments")).json()["items"]
    assert listed == []


async def test_create_admin_command(clean_database: str) -> None:
    assert await create_admin._run(clean_database, "lan", PASSWORD) == "created"
    assert await create_admin._run(clean_database, "LAN", PASSWORD + "x") == "password changed"
    assert await create_admin._run(clean_database, "lan", None) == "deleted"
    assert await create_admin._run(clean_database, "lan", None) == "not found"
    with pytest.raises(Exception, match="Password must be"):
        await create_admin._run(clean_database, "lan", "short")
