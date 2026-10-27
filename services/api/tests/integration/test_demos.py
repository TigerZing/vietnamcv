import json
from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.cli.seed_demos import SEED_FILE, seed
from app.cli.seed_news import seed as seed_news
from app.core.config import Settings
from app.main import create_app
from app.modules.content.models import Content, ContentSource
from tests.conftest import ClientFactory
from tests.media_helpers import FakeImageServer

pytestmark = pytest.mark.integration

NEWS_FIXTURE = Path(__file__).resolve().parents[1] / "fixtures" / "news_small.json"
URL = "/api/v1/demos/demo-01/comments"


@pytest.fixture
async def client(
    clean_database: str, integration_settings: Settings, client_for: ClientFactory
) -> AsyncClient:
    await seed(SEED_FILE, clean_database)
    return await client_for(create_app(integration_settings))


def demo_rows(database_url: str) -> list[tuple[str, str]]:
    engine = create_engine(database_url)
    try:
        with Session(engine) as session:
            rows = session.execute(
                select(Content.slug, Content.status).where(Content.type == "demo")
            )
            return sorted((slug, status) for slug, status in rows)
    finally:
        engine.dispose()


async def test_seed_publishes_every_listed_demo_once(clean_database: str) -> None:
    listed = json.loads(SEED_FILE.read_text())["items"]
    first = await seed(SEED_FILE, clean_database)
    again = await seed(SEED_FILE, clean_database)

    assert first == {"created": len(listed), "updated": 0, "withdrawn": 0}
    assert again == {"created": 0, "updated": len(listed), "withdrawn": 0}
    rows = demo_rows(clean_database)
    assert rows == sorted((item["slug"], "published") for item in listed)
    engine = create_engine(clean_database)
    try:
        with Session(engine) as session:
            links = session.scalars(select(ContentSource.external_id)).all()
    finally:
        engine.dispose()
    assert sorted(links) == sorted(item["urn"] for item in listed)


async def test_demo_removed_from_the_list_is_archived(clean_database: str, tmp_path: Path) -> None:
    await seed(SEED_FILE, clean_database)
    data = json.loads(SEED_FILE.read_text())
    data["items"] = data["items"][1:]
    shorter = tmp_path / "demos.json"
    shorter.write_text(json.dumps(data))

    assert (await seed(shorter, clean_database))["withdrawn"] == 1
    assert ("demo-01", "archived") in demo_rows(clean_database)

    assert (await seed(SEED_FILE, clean_database))["withdrawn"] == 0
    assert ("demo-01", "published") in demo_rows(clean_database)


async def test_comment_on_a_demo(client: AsyncClient) -> None:
    created = await client.post(URL, json={"mode": "guest", "display_name": "Lan", "body": "Hay!"})
    assert created.status_code == 201
    assert created.json()["status"] == "published"

    listed = await client.get(URL)
    assert listed.status_code == 200
    assert [item["body"] for item in listed.json()["items"]] == ["Hay!"]
    assert listed.json()["items"][0]["author"]["name"] == "Lan"


async def test_demo_comments_are_separate_from_news(
    clean_database: str, integration_settings: Settings, client_for: ClientFactory
) -> None:
    await seed(SEED_FILE, clean_database)
    await seed_news([NEWS_FIXTURE], clean_database, client=FakeImageServer().client())
    client = await client_for(create_app(integration_settings))

    # A news slug is not a demo, and a demo slug is not a news post.
    assert (await client.get("/api/v1/demos/newest-post/comments")).status_code == 404
    assert (await client.get("/api/v1/news/demo-01/comments")).status_code == 404
    assert (await client.get("/api/v1/demos/demo-99/comments")).status_code == 404

    await client.post(URL, json={"mode": "anonymous", "body": "Demo comment"})
    news = await client.get("/api/v1/news/newest-post/comments")
    assert news.json()["items"] == []


async def test_demo_comments_follow_the_moderation_rules(client: AsyncClient) -> None:
    held = await client.post(URL, json={"mode": "anonymous", "body": "Xem https://example.com"})
    assert held.status_code == 201
    assert held.json()["status"] == "pending"
    assert (await client.get(URL)).json()["items"] == []
