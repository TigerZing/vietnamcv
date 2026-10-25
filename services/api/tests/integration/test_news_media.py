"""Localized post text, stored images, rights policy and related links."""

from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app.cli.seed_news import seed
from app.core.config import Environment, Settings
from app.main import create_app
from app.modules.content.models import Content
from app.modules.media.models import MediaAsset
from tests.conftest import ClientFactory, make_settings
from tests.media_helpers import FakeImageServer

pytestmark = pytest.mark.integration

FIXTURE = Path(__file__).resolve().parents[1] / "fixtures" / "news_small.json"


@pytest.fixture
async def client(
    clean_database: str, integration_settings: Settings, client_for: ClientFactory
) -> AsyncClient:
    await seed([FIXTURE], clean_database, client=FakeImageServer().client())
    return await client_for(create_app(integration_settings))


async def test_text_follows_requested_language(client: AsyncClient) -> None:
    vi = (await client.get("/api/v1/news/newest-post")).json()
    assert vi["language"] == "vi"
    assert vi["title"] == "Tiêu đề Newest post"
    assert vi["original_title"] == "Newest post"
    assert vi["body"].startswith("Đoạn một.")

    en = (await client.get("/api/v1/news/newest-post", params={"lang": "en"})).json()
    assert en["language"] == "en"
    assert (en["title"], en["summary"], en["body"]) == (
        "Newest post (EN)",
        "English summary.",
        "English body.",
    )

    feed = (await client.get("/api/v1/news", params={"lang": "en"})).json()["items"]
    assert {item["slug"]: item["title"] for item in feed}["newest-post"] == "Newest post (EN)"


async def test_missing_translation_falls_back_to_vietnamese(client: AsyncClient) -> None:
    older = (await client.get("/api/v1/news/older-post", params={"lang": "en"})).json()
    assert older["language"] == "vi"
    assert older["title"] == "Bài cũ"


async def test_unsupported_language_is_422(client: AsyncClient) -> None:
    response = await client.get("/api/v1/news/older-post", params={"lang": "fr"})
    assert response.status_code == 422


async def test_images_are_stored_and_served(client: AsyncClient) -> None:
    post = (await client.get("/api/v1/news/newest-post")).json()
    image = post["image"]
    assert image["alt"] == "Ảnh minh họa bài mới"
    assert image["credit"] == "Demo News"
    assert image["credit_url"] == "https://news.example/newest"
    assert image["rights"] == "permission_pending"
    assert (image["width"], image["height"]) == (64, 48)

    response = await client.get(image["url"])
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/webp"
    assert response.content[:4] == b"RIFF"
    assert "immutable" in response.headers["cache-control"]
    assert response.headers["x-content-type-options"] == "nosniff"

    cached = await client.get(image["url"], headers={"If-None-Match": response.headers["etag"]})
    assert cached.status_code == 304

    own = (await client.get("/api/v1/news/video-post")).json()["image"]
    assert own["rights"] == "own"
    assert (own["width"], own["height"]) == (320, 180)
    assert (await client.get("/api/v1/news/older-post")).json()["image"] is None


async def test_links_and_ai_label(client: AsyncClient) -> None:
    post = (await client.get("/api/v1/news/video-post")).json()
    assert post["ai_assisted"] is True
    assert post["links"] == [
        {"kind": "paper", "label": "Paper", "url": "https://arxiv.org/abs/2512.04890"},
        {"kind": "code", "label": "Code", "url": "https://github.com/example/demo"},
    ]
    assert (await client.get("/api/v1/news/older-post")).json()["links"] == []


async def test_unknown_or_unpublished_media_is_404(
    client: AsyncClient, clean_database: str
) -> None:
    missing = await client.get("/api/v1/media/00000000-0000-0000-0000-000000000000")
    assert missing.status_code == 404
    url = (await client.get("/api/v1/news/newest-post")).json()["image"]["url"]

    engine = create_engine(clean_database)
    with Session(engine) as session:
        content = session.scalars(select(Content).where(Content.slug == "newest-post")).one()
        content.status = "archived"
        session.commit()
    engine.dispose()
    assert (await client.get(url)).status_code == 404


async def test_deployed_environments_hide_images_pending_permission(
    clean_database: str, redis_url: str, client_for: ClientFactory
) -> None:
    await seed([FIXTURE], clean_database, client=FakeImageServer().client())
    local = await client_for(create_app(make_settings(clean_database, redis_url)))
    pending_url = (await local.get("/api/v1/news/newest-post")).json()["image"]["url"]

    staging = make_settings(
        clean_database,
        redis_url,
        APP_ENV=Environment.STAGING,
        dev_auth_enabled=False,
        client_fingerprint_secret="staging-test-secret",
    )
    deployed = await client_for(create_app(staging))
    assert (await deployed.get("/api/v1/news/newest-post")).json()["image"] is None
    assert (await deployed.get(pending_url)).status_code == 404
    own = (await deployed.get("/api/v1/news/video-post")).json()["image"]
    assert own is not None
    assert (await deployed.get(own["url"])).status_code == 200


async def test_failed_download_is_retried_and_success_is_not_refetched(
    clean_database: str,
) -> None:
    broken = FakeImageServer(status=503)
    await seed([FIXTURE], clean_database, client=broken.client())
    assert broken.requests == ["https://images.example/newest.jpg"]

    working = FakeImageServer()
    await seed([FIXTURE], clean_database, client=working.client())
    assert working.requests == ["https://images.example/newest.jpg"]
    assert working.referers == ["https://news.example/newest"]

    again = FakeImageServer()
    await seed([FIXTURE], clean_database, client=again.client())
    assert again.requests == []

    engine = create_engine(clean_database)
    with Session(engine) as session:
        assert session.scalar(select(func.count()).select_from(MediaAsset)) == 2
    engine.dispose()


async def test_non_image_download_is_rejected(clean_database: str) -> None:
    server = FakeImageServer(body=b"<html>not an image</html>")
    await seed([FIXTURE], clean_database, client=server.client())
    engine = create_engine(clean_database)
    with Session(engine) as session:
        origins = session.scalars(select(MediaAsset.origin)).all()
    engine.dispose()
    assert origins == ["file:images/demo.png"]


async def test_identical_images_are_stored_once(clean_database: str) -> None:
    same = (FIXTURE.parent / "images" / "demo.png").read_bytes()
    await seed([FIXTURE], clean_database, client=FakeImageServer(same).client())
    engine = create_engine(clean_database)
    with Session(engine) as session:
        count = session.scalar(select(func.count()).select_from(MediaAsset))
    engine.dispose()
    assert count == 1
