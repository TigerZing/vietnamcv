"""Admin accounts with passwords, and the `removed` content status (ADR-015).

Revision ID: 0007
Revises: 0006
Create Date: 2026-10-27
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_STATUSES = "'draft', 'pending_review', 'published', 'rejected', 'archived'"


def upgrade() -> None:
    op.create_table(
        "admin_accounts",
        sa.Column("username", sa.String(length=64), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_admin_accounts")),
        sa.UniqueConstraint("username", name=op.f("uq_admin_accounts_username")),
    )
    op.drop_constraint(op.f("ck_contents_status"), "contents", type_="check")
    op.create_check_constraint(
        op.f("ck_contents_status"), "contents", f"status IN ({_STATUSES}, 'removed')"
    )


def downgrade() -> None:
    # Before 0007 there is no "removed": keep such content off the site as archived.
    op.execute("UPDATE contents SET status = 'archived' WHERE status = 'removed'")
    op.drop_constraint(op.f("ck_contents_status"), "contents", type_="check")
    op.create_check_constraint(op.f("ck_contents_status"), "contents", f"status IN ({_STATUSES})")
    op.drop_table("admin_accounts")
