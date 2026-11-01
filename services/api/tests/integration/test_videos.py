import pytest
from httpx import AsyncClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.main import create_app
from app.modules.content.models import Content
from tests.conftest import ClientFactory

pytestmark = pytest.mark.integration

SLUG = "video-2026-09-02-graduateml-1397856995822151"
BASE = f"/api/v1/videos/{SLUG}"
VISITOR = {"X-Visitor-Id": "6f1c1f1e-3b53-4a55-9a43-7d3e0d1f0a11"}
OTHER = {"X-Visitor-Id": "0b6c9c7e-8d2a-4f3e-b1a0-2c4e5f607182"}
COMMENT = {"mode": "anonymous", "body": "Video rất hay, cảm ơn nhé"}


@pytest.fixture
async def client(
    clean_database: str, integration_settings: Settings, client_for: ClientFactory
) -> AsyncClient:
    return await client_for(create_app(integration_settings))


def video_rows(database_url: str) -> int:
    engine = create_engine(database_url)
    try:
        with Session(engine) as session:
            return (
                session.scalar(
                    select(func.count()).select_from(Content).where(Content.type == "video")
                )
                or 0
            )
    finally:
        engine.dispose()


async def test_reads_of_an_unknown_video_are_empty_and_create_nothing(
    client: AsyncClient, clean_database: str
) -> None:
    engagement = await client.get(f"{BASE}/engagement", headers=VISITOR)
    comments = await client.get(f"{BASE}/comments")

    assert engagement.json() == {"likes": 0, "comments": 0, "liked": False}
    assert comments.json() == {"items": [], "next_cursor": None}
    assert video_rows(clean_database) == 0


async def test_likes_count_one_per_visitor_and_can_be_taken_back(
    client: AsyncClient, clean_database: str
) -> None:
    assert (await client.put(f"{BASE}/like", headers=VISITOR)).json()["likes"] == 1
    assert (await client.put(f"{BASE}/like", headers=VISITOR)).json()["likes"] == 1
    both = await client.put(f"{BASE}/like", headers=OTHER)
    assert both.json() == {"likes": 2, "comments": 0, "liked": True}
    assert video_rows(clean_database) == 1

    after = await client.delete(f"{BASE}/like", headers=VISITOR)
    assert after.json() == {"likes": 1, "comments": 0, "liked": False}
    seen = await client.get(f"{BASE}/engagement", headers=OTHER)
    assert seen.json()["liked"] is True


async def test_a_like_needs_a_well_formed_visitor_id(client: AsyncClient) -> None:
    assert (await client.put(f"{BASE}/like")).status_code == 422
    bad = await client.put(f"{BASE}/like", headers={"X-Visitor-Id": "nope"})
    assert bad.status_code == 422


async def test_first_comment_registers_the_video_and_shows_up(client: AsyncClient) -> None:
    created = await client.post(f"{BASE}/comments", json=COMMENT)
    assert created.status_code == 201

    page = (await client.get(f"{BASE}/comments")).json()
    assert [item["body"] for item in page["items"]] == [COMMENT["body"]]
    assert (await client.get(f"{BASE}/engagement")).json()["comments"] == 1


async def test_only_video_slugs_are_accepted(client: AsyncClient) -> None:
    response = await client.put("/api/v1/videos/newest-post/like", headers=VISITOR)
    assert response.status_code == 422


async def test_a_removed_video_stays_gone(client: AsyncClient, clean_database: str) -> None:
    await client.put(f"{BASE}/like", headers=VISITOR)
    engine = create_engine(clean_database)
    try:
        with Session(engine) as session:
            content = session.scalars(select(Content).where(Content.slug == SLUG)).one()
            content.status = "removed"
            session.commit()
    finally:
        engine.dispose()

    assert (await client.get(f"{BASE}/engagement")).status_code == 404
    assert (await client.put(f"{BASE}/like", headers=OTHER)).status_code == 404
    assert (await client.post(f"{BASE}/comments", json=COMMENT)).status_code == 404
