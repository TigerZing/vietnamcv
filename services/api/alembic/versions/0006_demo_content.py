"""Demo products as content, so they can carry comments (ADR-013).

Revision ID: 0006
Revises: 0005
Create Date: 2026-10-27
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(op.f("ck_contents_type"), "contents", type_="check")
    op.create_check_constraint(op.f("ck_contents_type"), "contents", "type IN ('news', 'demo')")


def downgrade() -> None:
    # Demo rows (and, by cascade, their comments and provenance) cannot exist before 0006.
    op.execute("DELETE FROM contents WHERE type = 'demo'")
    op.drop_constraint(op.f("ck_contents_type"), "contents", type_="check")
    op.create_check_constraint(op.f("ck_contents_type"), "contents", "type IN ('news')")
