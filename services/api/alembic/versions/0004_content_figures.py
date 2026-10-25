"""In-article images (figures), English alt text and captions, and each image use's origin.

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-25
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("content_media", sa.Column("alt_text_en", sa.String(length=500), nullable=True))
    op.add_column("content_media", sa.Column("caption_en", sa.Text(), nullable=True))
    op.add_column("content_media", sa.Column("origin", sa.String(length=2000), nullable=True))
    op.drop_constraint(op.f("ck_content_media_role"), "content_media", type_="check")
    op.create_check_constraint(
        op.f("ck_content_media_role"), "content_media", "role IN ('illustration', 'figure')"
    )


def downgrade() -> None:
    op.execute("DELETE FROM content_media WHERE role = 'figure'")
    op.drop_constraint(op.f("ck_content_media_role"), "content_media", type_="check")
    op.create_check_constraint(
        op.f("ck_content_media_role"), "content_media", "role IN ('illustration')"
    )
    op.drop_column("content_media", "origin")
    op.drop_column("content_media", "caption_en")
    op.drop_column("content_media", "alt_text_en")
