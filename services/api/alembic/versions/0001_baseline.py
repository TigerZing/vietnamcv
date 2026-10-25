"""Baseline: extensions, search helpers and the transactional outbox.

Revision ID: 0001
Revises:
Create Date: 2026-10-25
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # pg_trgm: fuzzy title matching. unaccent: diacritic-insensitive Vietnamese search.
    # citext: case-insensitive usernames and slugs. All are available on major managed hosts.
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")

    # unaccent() is only STABLE, so it cannot be used in generated columns or indexes.
    # Pinning the dictionary makes this wrapper safe to declare IMMUTABLE.
    op.execute(
        """
        CREATE FUNCTION public.immutable_unaccent(text) RETURNS text
        LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
        RETURN public.unaccent('public.unaccent'::regdictionary, $1)
        """
    )

    op.create_table(
        "outbox_events",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("dispatched_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_outbox_events")),
    )
    op.create_index(
        "ix_outbox_events_pending",
        "outbox_events",
        ["created_at"],
        unique=False,
        postgresql_where=sa.text("dispatched_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index(
        "ix_outbox_events_pending",
        table_name="outbox_events",
        postgresql_where=sa.text("dispatched_at IS NULL"),
    )
    op.drop_table("outbox_events")
    op.execute("DROP FUNCTION IF EXISTS public.immutable_unaccent(text)")
    # Extensions are left installed: other database objects or tools may rely on them,
    # and keeping them is harmless.
