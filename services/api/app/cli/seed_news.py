"""Import editor-approved news posts: ``python -m app.cli.seed_news [FILE ...]``.

Without arguments, imports every ``seed/news/*.json`` file. The import is idempotent:
re-running it updates text and metadata of existing posts and never duplicates them.
Each post is committed separately so posts get distinct ``published_at`` values, older
stories first, which keeps the feed in story order.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

from app.core.config import get_settings
from app.core.db import create_async_db_engine, create_async_session_factory
from app.core.logging import configure_logging, get_logger
from app.modules.news import service
from app.modules.news.schemas import CuratedNewsFile

SEED_DIR = Path(__file__).resolve().parents[2] / "seed" / "news"

logger = get_logger(__name__)


async def seed(files: list[Path], database_url: str) -> dict[str, int]:
    engine = create_async_db_engine(database_url)
    factory = create_async_session_factory(engine)
    totals = {outcome.value: 0 for outcome in service.ImportOutcome}
    try:
        for path in files:
            data = CuratedNewsFile.model_validate_json(path.read_bytes())
            async with factory() as session:
                await service.import_sources(session, data)
                await session.commit()
            for entry in sorted(data.items, key=lambda item: (item.published_on, item.slug)):
                async with factory() as session:
                    sources = await service.import_sources(session, data)
                    outcome = await service.import_item(session, entry, sources)
                    await session.commit()
                totals[outcome.value] += 1
            logger.info("news_seed_file_imported", file=path.name, items=len(data.items))
    finally:
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
