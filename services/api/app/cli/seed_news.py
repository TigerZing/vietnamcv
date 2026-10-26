"""Import editor-approved news posts: ``python -m app.cli.seed_news [FILE ...]``.

Without arguments, imports every ``seed/news/*.json`` file. The import is idempotent:
re-running it updates text and metadata of existing posts and never duplicates them.
Posts listed under ``withdrawn`` are archived (taken off the site, kept in the database).
Each post is committed separately so posts get distinct ``published_at`` values, older
stories first, which keeps the feed in story order.

Lead images given by URL are downloaded once and stored in the database; images given by
``file`` are read from next to the fixture. A failed download leaves the post without a
new image and is retried on the next run.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

import httpx

from app.core.config import get_settings
from app.core.db import create_async_db_engine, create_async_session_factory
from app.core.logging import configure_logging, get_logger
from app.modules.media import service as media
from app.modules.news import service
from app.modules.news.schemas import CuratedImage, CuratedNewsFile

SEED_DIR = Path(__file__).resolve().parents[2] / "seed" / "news"

logger = get_logger(__name__)


def image_loader(base_dir: Path, client: httpx.AsyncClient) -> service.ImageLoader:
    async def load(image: CuratedImage) -> bytes:
        if image.url is not None:
            referer = str(image.credit_url) if image.credit_url else None
            return await media.download(client, str(image.url), referer=referer)
        assert image.file is not None  # noqa: S101 - the schema requires url or file
        return (base_dir / image.file).read_bytes()

    return load


async def seed(
    files: list[Path],
    database_url: str,
    *,
    client: httpx.AsyncClient | None = None,
) -> dict[str, int]:
    engine = create_async_db_engine(database_url)
    factory = create_async_session_factory(engine)
    totals = {outcome.value: 0 for outcome in service.ImportOutcome}
    http = client or media.http_client()
    try:
        for path in files:
            data = CuratedNewsFile.model_validate_json(path.read_bytes())
            load_image = image_loader(path.parent, http)
            async with factory() as session:
                await service.import_sources(session, data)
                await session.commit()
            for entry in sorted(data.items, key=lambda item: (item.published_on, item.slug)):
                async with factory() as session:
                    sources = await service.import_sources(session, data)
                    outcome = await service.import_item(
                        session, entry, sources, load_image=load_image
                    )
                    await session.commit()
                totals[outcome.value] += 1
            for withdrawal in data.withdrawn:
                async with factory() as session:
                    sources = await service.import_sources(session, data)
                    if await service.withdraw_item(session, withdrawal, sources):
                        totals[service.ImportOutcome.WITHDRAWN.value] += 1
                    await session.commit()
            logger.info("news_seed_file_imported", file=path.name, items=len(data.items))
    finally:
        if client is None:
            await http.aclose()
        await engine.dispose()
    return totals


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="*", type=Path, help="Fixture files (default: seed/news)")
    args = parser.parse_args(argv)
    settings = get_settings()
    configure_logging(level=settings.log_level, json=settings.log_json)
    files = args.files or sorted(SEED_DIR.glob("*.json"))
    totals = asyncio.run(seed(files, str(settings.database_url)))
    logger.info("news_seed_done", **totals)
    return 0


if __name__ == "__main__":
    sys.exit(main())
