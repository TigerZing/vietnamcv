"""Write the OpenAPI schema to a file: ``python -m app.cli.export_openapi [path]``.

Building the schema needs no database or Redis, so placeholder connection settings are
used when the environment does not provide them.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from app.core.config import Environment, Settings
from app.main import create_app

DEFAULT_OUTPUT = Path(__file__).resolve().parents[2] / "openapi.json"


def build_schema() -> dict[str, object]:
    settings = Settings.model_validate(
        {
            "APP_ENV": Environment.TEST,
            "database_url": os.environ.get(
                "DATABASE_URL", "postgresql+psycopg://openapi@localhost/openapi"
            ),
            "redis_url": os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
            "log_json": False,
            "log_level": "WARNING",
        }
    )
    return create_app(settings).openapi()


def main(argv: list[str]) -> None:
    output = Path(argv[1]) if len(argv) > 1 else DEFAULT_OUTPUT
    output.write_text(json.dumps(build_schema(), indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {output}")  # noqa: T201 - CLI output


if __name__ == "__main__":
    main(sys.argv)
