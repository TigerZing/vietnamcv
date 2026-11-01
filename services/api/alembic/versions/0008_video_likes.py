"""Short videos as content, and their likes (ADR-019).

Revision ID: 0008
Revises: 0007
Create Date: 2026-11-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(op.f("ck_contents_type"), "contents", type_="check")
    op.create_check_constraint(
        op.f("ck_contents_type"), "contents", "type IN ('news', 'demo', 'video')"
    )
    op.create_table(
        "video_likes",
        sa.Column("content_id", sa.Uuid(), nullable=False),
        sa.Column("visitor_hash", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["content_id"],
            ["contents.id"],
            name=op.f("fk_video_likes_content_id_contents"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("content_id", "visitor_hash", name=op.f("pk_video_likes")),
    )


def downgrade() -> None:
    op.drop_table("video_likes")
    # Video rows (and, by cascade, their comments and provenance) cannot exist before 0008.
    op.execute("DELETE FROM contents WHERE type = 'video'")
    op.drop_constraint(op.f("ck_contents_type"), "contents", type_="check")
    op.create_check_constraint(op.f("ck_contents_type"), "contents", "type IN ('news', 'demo')")
