"""Import the demo product list: ``python -m app.cli.seed_demos [FILE]``.

Without arguments, imports ``seed/demos.json``. Idempotent: re-running it updates titles,
never duplicates a demo, and archives demos that were removed from the list (ADR-013).
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

from app.core.config import get_settings
from app.core.db import create_async_db_engine, create_async_session_factory
from app.core.logging import configure_logging, get_logger
from app.modules.demos import service
from app.modules.demos.schemas import CuratedDemoFile

SEED_FILE = Path(__file__).resolve().parents[2] / "seed" / "demos.json"

logger = get_logger(__name__)


async def seed(path: Path, database_url: str) -> dict[str, int]:
    data = CuratedDemoFile.model_validate_json(await asyncio.to_thread(path.read_bytes))
    engine = create_async_db_engine(database_url)
    factory = create_async_session_factory(engine)
    try:
        async with factory() as session:
            totals = await service.import_demos(session, data)
            await session.commit()
    finally:
        await engine.dispose()
    return totals


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", nargs="?", type=Path, default=SEED_FILE)
    args = parser.parse_args(argv)
    settings = get_settings()
    configure_logging(level=settings.log_level, json=settings.log_json)
    totals = asyncio.run(seed(args.file, str(settings.database_url)))
    logger.info("demo_seed_done", **totals)
    return 0


if __name__ == "__main__":
    sys.exit(main())
