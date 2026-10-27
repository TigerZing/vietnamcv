"""Create an admin account or set its password: ``python -m app.cli.create_admin NAME``.

The password is asked for twice without echo; ``--password-stdin`` reads it from standard
input instead (for scripts). ``--delete`` removes the account. There is no sign-up page:
this command is the only way to make an admin (ADR-015).
"""

from __future__ import annotations

import argparse
import asyncio
import getpass
import sys

from app.core.config import get_settings
from app.core.db import create_async_db_engine, create_async_session_factory
from app.core.errors import DomainValidationError
from app.core.logging import configure_logging
from app.modules.identity import service


async def _run(database_url: str, username: str, password: str | None) -> str:
    engine = create_async_db_engine(database_url)
    factory = create_async_session_factory(engine)
    try:
        async with factory() as session:
            if password is None:
                deleted = await service.delete_admin_account(session, username)
                await session.commit()
                return "deleted" if deleted else "not found"
            created = await service.set_admin_account(session, username, password)
            await session.commit()
            return "created" if created else "password changed"
    finally:
        await engine.dispose()


def _read_password(from_stdin: bool) -> str:
    if from_stdin:
        return sys.stdin.readline().rstrip("\n")
    first = getpass.getpass("Password (at least 10 characters): ")
    if first != getpass.getpass("Repeat the password: "):
        raise SystemExit("error: the passwords do not match")
    return first


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("username")
    parser.add_argument("--password-stdin", action="store_true")
    parser.add_argument("--delete", action="store_true", help="remove the account")
    args = parser.parse_args(argv)
    settings = get_settings()
    configure_logging(level="WARNING", json=False)
    password = None if args.delete else _read_password(args.password_stdin)
    try:
        outcome = asyncio.run(_run(str(settings.database_url), args.username, password))
    except DomainValidationError as exc:
        print(f"error: {exc.message}", file=sys.stderr)  # noqa: T201 - CLI output
        return 1
    print(f"Admin {service.normalize_username(args.username)}: {outcome}")  # noqa: T201
    return 0


if __name__ == "__main__":
    sys.exit(main())
