from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.cli.seed_news import seed
from app.core.config import Settings
from app.core.security import DEV_PRINCIPAL_HEADER
from app.main import create_app
from app.modules.audit.models import AuditEvent
from app.modules.comments import policy
from app.modules.comments.models import Comment
from app.modules.identity.models import User
from tests.conftest import ClientFactory
from tests.google_tokens import FakeGoogle

pytestmark = pytest.mark.integration

FIXTURE = Path(__file__).resolve().parents[1] / "fixtures" / "news_small.json"
URL = "/api/v1/news/newest-post/comments"


@pytest.fixture(scope="module")
def google() -> FakeGoogle:
    return FakeGoogle()


@pytest.fixture
async def client(
    clean_database: str,
    integration_settings: Settings,
    client_for: ClientFactory,
    google: FakeGoogle,
) -> AsyncClient:
    await seed([FIXTURE], clean_database)
    app = create_app(integration_settings)
    app.state.id_token_verifier = google.verifier
    return await client_for(app)


def bearer(google: FakeGoogle, **claims: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {google.token(**claims)}"}


async def test_anonymous_comment_is_published(client: AsyncClient) -> None:
    response = await client.post(URL, json={"mode": "anonymous", "body": "  Bài viết hay!  "})
    assert response.status_code == 201
    created = response.json()
    assert created["status"] == "published"
    assert created["body"] == "Bài viết hay!"
    assert created["author"] == {
        "kind": "anonymous",
        "name": None,
        "avatar_url": None,
        "verified": False,
    }

    listed = (await client.get(URL)).json()
    assert [item["id"] for item in listed["items"]] == [created["id"]]
    detail = (await client.get("/api/v1/news/newest-post")).json()
    assert detail["comment_count"] == 1


async def test_guest_comment_shows_chosen_name(client: AsyncClient) -> None:
    response = await client.post(
        URL, json={"mode": "guest", "display_name": " Lan  Anh ", "body": "Cảm ơn tác giả"}
    )
    assert response.status_code == 201
    assert response.json()["author"]["name"] == "Lan Anh"
    assert response.json()["author"]["verified"] is False


async def test_google_comment_uses_verified_profile(
    client: AsyncClient, google: FakeGoogle, clean_database: str
) -> None:
    response = await client.post(
        URL, json={"mode": "account", "body": "Mình đã thử mô hình này"}, headers=bearer(google)
    )
    assert response.status_code == 201
    author = response.json()["author"]
    assert author == {
        "kind": "account",
        "name": "Nguyễn Văn A",
        "avatar_url": "https://lh3.googleusercontent.com/a/test",
        "verified": True,
    }
    # A later sign-in with a new name refreshes the stored profile instead of duplicating.
    await client.post(
        URL, json={"mode": "account", "body": "Bình luận thứ hai"}, headers=bearer(google, name="B")
    )
    engine = create_engine(clean_database)
    with Session(engine) as session:
        users = session.scalars(select(User)).all()
    engine.dispose()
    assert [(user.auth_subject, user.display_name) for user in users] == [
        ("google|1234567890", "B")
    ]


async def test_account_mode_requires_sign_in(client: AsyncClient) -> None:
    response = await client.post(URL, json={"mode": "account", "body": "Xin chào"})
    assert response.status_code == 401


async def test_signed_in_user_may_still_post_anonymously(
    client: AsyncClient, google: FakeGoogle
) -> None:
    response = await client.post(
        URL, json={"mode": "anonymous", "body": "Ẩn danh thôi"}, headers=bearer(google)
    )
    assert response.status_code == 201
    assert response.json()["author"]["kind"] == "anonymous"


async def test_unverified_comment_with_link_waits_for_moderation(client: AsyncClient) -> None:
    response = await client.post(
        URL, json={"mode": "anonymous", "body": "Khuyến mãi tại www.spam.example.com"}
    )
    assert response.status_code == 201
    assert response.json()["status"] == "pending"
    assert (await client.get(URL)).json()["items"] == []


async def test_honeypot_rejects_bots(client: AsyncClient) -> None:
    response = await client.post(
        URL, json={"mode": "anonymous", "body": "Hello", "website": "http://bot.example"}
    )
    assert response.status_code == 422
    assert (await client.get(URL)).json()["items"] == []


async def test_reserved_guest_name_is_rejected(client: AsyncClient) -> None:
    response = await client.post(
        URL, json={"mode": "guest", "display_name": "Ban Quản Trị", "body": "Thông báo"}
    )
    assert response.status_code == 422
    assert response.json()["error"]["details"] == {
        "field": "display_name",
        "reason": "reserved_name",
    }


async def test_duplicate_comment_is_rejected(client: AsyncClient) -> None:
    payload = {"mode": "anonymous", "body": "Giống hệt nhau"}
    assert (await client.post(URL, json=payload)).status_code == 201
    response = await client.post(URL, json={**payload, "body": "giống HỆT nhau"})
    assert response.status_code == 409


async def test_guest_burst_is_rate_limited(client: AsyncClient) -> None:
    for index in range(policy.GUEST_BURST.limit):
        response = await client.post(URL, json={"mode": "anonymous", "body": f"Ý kiến {index}"})
        assert response.status_code == 201
    response = await client.post(URL, json={"mode": "anonymous", "body": "Một ý nữa"})
    assert response.status_code == 429
    error = response.json()["error"]
    assert error["code"] == "RATE_LIMITED"
    assert error["details"]["retry_after_seconds"] > 0


async def test_comment_on_unknown_post_is_404(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/news/missing-post/comments", json={"mode": "anonymous", "body": "Xin chào"}
    )
    assert response.status_code == 404


async def test_comments_paginate_newest_first(client: AsyncClient, google: FakeGoogle) -> None:
    for index in range(3):
        await client.post(
            URL, json={"mode": "account", "body": f"Bình luận {index}"}, headers=bearer(google)
        )
    first = (await client.get(URL, params={"limit": 2})).json()
    assert [item["body"] for item in first["items"]] == ["Bình luận 2", "Bình luận 1"]
    second = (await client.get(URL, params={"limit": 2, "cursor": first["next_cursor"]})).json()
    assert [item["body"] for item in second["items"]] == ["Bình luận 0"]


async def test_moderation_requires_moderator(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/admin/comments")).status_code == 401
    response = await client.get("/api/v1/admin/comments", headers={DEV_PRINCIPAL_HEADER: "member"})
    assert response.status_code == 403


async def test_moderator_publishes_and_hides_with_audit(
    client: AsyncClient, clean_database: str
) -> None:
    held = (
        await client.post(URL, json={"mode": "anonymous", "body": "Xem www.example.com nhé"})
    ).json()
    moderator = {DEV_PRINCIPAL_HEADER: "moderator"}
    queue = (await client.get("/api/v1/admin/comments", headers=moderator)).json()
    assert [item["id"] for item in queue["items"]] == [held["id"]]

    published = await client.post(
        f"/api/v1/admin/comments/{held['id']}/moderate",
        json={"action": "publish"},
        headers=moderator,
    )
    assert published.json()["status"] == "published"
    assert [item["id"] for item in (await client.get(URL)).json()["items"]] == [held["id"]]

    hidden = await client.post(
        f"/api/v1/admin/comments/{held['id']}/moderate",
        json={"action": "hide", "reason": "Quảng cáo"},
        headers=moderator,
    )
    assert hidden.json()["status"] == "hidden"
    assert (await client.get(URL)).json()["items"] == []

    engine = create_engine(clean_database)
    with Session(engine) as session:
        events = session.scalars(
            select(AuditEvent)
            .where(AuditEvent.target_type == "comment")
            .order_by(AuditEvent.created_at)
        ).all()
        comment = session.get_one(Comment, held["id"])
    engine.dispose()
    assert [(event.action, event.reason) for event in events] == [
        ("comment.publish", None),
        ("comment.hide", "Quảng cáo"),
    ]
    assert all(event.actor_subject == "dev|moderator" for event in events)
    assert comment.moderated_by == "dev|moderator"
    assert comment.client_fingerprint is not None
    assert len(comment.client_fingerprint) == 64  # HMAC, never the raw address
