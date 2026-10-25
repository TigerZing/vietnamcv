"""Technology hashtags on news, and the news date that orders the feed.

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-25
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "news_items",
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.String(length=40)),
            server_default=sa.text("'{}'::character varying[]"),
            nullable=False,
        ),
    )
    op.add_column(
        "news_items",
        sa.Column(
            "dated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    # Existing posts take the source's date, else their publication on VietnamCV.
    op.execute(
        """
        UPDATE news_items AS n
        SET dated_at = COALESCE(
            (SELECT cs.source_published_at FROM content_sources AS cs
             WHERE cs.content_id = n.content_id
             ORDER BY cs.fetched_at, cs.id LIMIT 1),
            (SELECT c.published_at FROM contents AS c WHERE c.id = n.content_id),
            n.dated_at
        )
        """
    )
    op.create_index("ix_news_items_feed", "news_items", ["dated_at", "content_id"])
    op.create_index("ix_news_items_region_feed", "news_items", ["region", "dated_at", "content_id"])
    op.create_index("ix_news_items_tags", "news_items", ["tags"], postgresql_using="gin")


def downgrade() -> None:
    op.drop_index("ix_news_items_tags", table_name="news_items")
    op.drop_index("ix_news_items_region_feed", table_name="news_items")
    op.drop_index("ix_news_items_feed", table_name="news_items")
    op.drop_column("news_items", "dated_at")
    op.drop_column("news_items", "tags")
