import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import create_engine, inspect

from app.models import Base
from tests.integration.migrations import downgrade, upgrade

pytestmark = pytest.mark.integration


def test_upgrade_downgrade_upgrade_round_trip(migrated_database_url: str) -> None:
    downgrade(migrated_database_url, "base")
    engine = create_engine(migrated_database_url)
    try:
        tables = set(inspect(engine).get_table_names()) - {"alembic_version"}
        assert tables == set(), f"downgrade left tables behind: {tables}"
    finally:
        engine.dispose()

    upgrade(migrated_database_url, "head")


def test_models_match_migrations(migrated_database_url: str) -> None:
    """Fails when a model changes without a matching migration."""
    engine = create_engine(migrated_database_url)
    try:
        with engine.connect() as connection:
            context = MigrationContext.configure(
                connection, opts={"compare_type": True, "compare_server_default": True}
            )
            diff = compare_metadata(context, Base.metadata)
    finally:
        engine.dispose()
    assert diff == []


def test_immutable_unaccent_strips_vietnamese_diacritics(migrated_database_url: str) -> None:
    engine = create_engine(migrated_database_url)
    try:
        with engine.connect() as connection:
            value = connection.exec_driver_sql(
                "SELECT public.immutable_unaccent('Phát hiện đối tượng')"
            ).scalar_one()
    finally:
        engine.dispose()
    # unaccent maps đ to d as well as removing tone marks.
    assert value == "Phat hien doi tuong"
