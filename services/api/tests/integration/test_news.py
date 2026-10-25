from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app.cli.seed_news import SEED_DIR, seed
from app.core.config import Settings
from app.main import create_app
from app.modules.audit.models import AuditEvent
from app.modules.content.models import Content
from app.modules.news.schemas import CuratedNewsFile
from tests.conftest import ClientFactory
from tests.media_helpers import FakeImageServer

pytestmark = pytest.mark.integration

FIXTURE = Path(__file__).resolve().parents[1] / "fixtures" / "news_small.json"


@pytest.fixture
async def client(
    clean_database: str, integration_settings: Settings, client_for: ClientFactory
) -> AsyncClient:
    await seed([FIXTURE], clean_database, client=FakeImageServer().client())
    return await client_for(create_app(integration_settings))


async def test_feed_is_newest_story_first(client: AsyncClient) -> None:
    response = await client.get("/api/v1/news")
    assert response.status_code == 200
    body = response.json()
    assert [item["slug"] for item in body["items"]] == ["newest-post", "video-post", "older-post"]
    assert body["next_cursor"] is None


async def test_feed_paginates_with_cursor(client: AsyncClient) -> None:
    first = (await client.get("/api/v1/news", params={"limit": 2})).json()
    assert [item["slug"] for item in first["items"]] == ["newest-post", "video-post"]
    second = (
        await client.get("/api/v1/news", params={"limit": 2, "cursor": first["next_cursor"]})
    ).json()
    assert [item["slug"] for item in second["items"]] == ["older-post"]
    assert second["next_cursor"] is None


async def test_feed_filters(client: AsyncClient) -> None:
    by_region = (await client.get("/api/v1/news", params={"region": "vietnam"})).json()
    assert [item["slug"] for item in by_region["items"]] == ["older-post"]
    by_category = (await client.get("/api/v1/news", params={"category": "research"})).json()
    assert [item["slug"] for item in by_category["items"]] == ["video-post"]


async def test_invalid_filter_and_cursor_are_422(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/news", params={"category": "nope"})).status_code == 422
    response = await client.get("/api/v1/news", params={"cursor": "garbage"})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_detail_has_provenance_video_and_note(client: AsyncClient) -> None:
    video = (await client.get("/api/v1/news/video-post")).json()
    assert video["video"] == {"provider": "youtube", "id": "abcdefghijk", "title": "Demo video"}
    assert video["source"] == {
        "name": "Demo Lab",
        "url": "https://lab.example/1",
        "published_on": "2026-10-20",
        "published_precision": "day",
    }
    older = (await client.get("/api/v1/news/older-post")).json()
    assert older["editor_note"] == "Chỉ có tháng, không có ngày."
    assert older["source"]["published_precision"] == "month"
    assert older["video"] is None
    assert older["comment_count"] == 0


@pytest.mark.parametrize("slug", ["missing-post", "Bad_Slug"])
async def test_unknown_or_invalid_slug(client: AsyncClient, slug: str) -> None:
    response = await client.get(f"/api/v1/news/{slug}")
    assert response.status_code in {404, 422}


async def test_unpublished_content_is_hidden(client: AsyncClient, clean_database: str) -> None:
    engine = create_engine(clean_database)
    with Session(engine) as session:
        content = session.scalars(select(Content).where(Content.slug == "older-post")).one()
        content.status = "archived"
        session.commit()
    engine.dispose()
    assert (await client.get("/api/v1/news/older-post")).status_code == 404
    slugs = [item["slug"] for item in (await client.get("/api/v1/news")).json()["items"]]
    assert "older-post" not in slugs


async def test_import_is_idempotent_and_audited(client: AsyncClient, clean_database: str) -> None:
    before = (await client.get("/api/v1/news/newest-post")).json()
    totals = await seed([FIXTURE], clean_database, client=FakeImageServer().client())
    assert totals == {"created": 0, "updated": 3}
    after = (await client.get("/api/v1/news/newest-post")).json()
    assert after["published_at"] == before["published_at"]

    engine = create_engine(clean_database)
    with Session(engine) as session:
        assert session.scalar(select(func.count()).select_from(Content)) == 3
        actions = session.scalars(select(AuditEvent.action)).all()
    engine.dispose()
    assert actions == ["content.published"] * 3


async def test_committed_seed_files_import(clean_database: str) -> None:
    files = sorted(SEED_DIR.glob("*.json"))
    assert files, "expected at least one curated news file"
    expected = sum(
        len(CuratedNewsFile.model_validate_json(path.read_bytes()).items) for path in files
    )
    server = FakeImageServer()
    totals = await seed(files, clean_database, client=server.client())
    assert totals["created"] == expected
    assert server.requests, "expected the committed posts to have downloadable images"
