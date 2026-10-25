"""Canonical content, provenance, news, users, comments and the audit trail.

Implements the ADR-003 subset needed for curated news posts: sources, contents,
content_sources, news_items and audit_events, plus users and comments for discussion.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-25
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "audit_events",
        sa.Column("actor_subject", sa.String(length=200), nullable=False),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("target_type", sa.String(length=32), nullable=False),
        sa.Column("target_id", sa.Uuid(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("before", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("after", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_audit_events")),
    )
    op.create_index(
        "ix_audit_events_target",
        "audit_events",
        ["target_type", "target_id", "created_at"],
        unique=False,
    )
    op.create_table(
        "contents",
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="draft", nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.CheckConstraint(
            "status <> 'published' OR published_at IS NOT NULL",
            name=op.f("ck_contents_published_at"),
        ),
        sa.CheckConstraint(
            "status IN ('draft', 'pending_review', 'published', 'rejected', 'archived')",
            name=op.f("ck_contents_status"),
        ),
        sa.CheckConstraint("type IN ('news')", name=op.f("ck_contents_type")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_contents")),
        sa.UniqueConstraint("slug", name=op.f("uq_contents_slug")),
    )
    op.create_index(
        "ix_contents_feed", "contents", ["status", "type", "published_at", "id"], unique=False
    )
    op.create_table(
        "sources",
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("base_url", sa.String(length=500), nullable=False),
        sa.Column("trust_tier", sa.String(length=32), nullable=False),
        sa.Column("enabled", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("terms_url", sa.String(length=500), nullable=True),
        sa.Column("attribution_text", sa.String(length=300), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_sources")),
        sa.UniqueConstraint("code", name=op.f("uq_sources_code")),
    )
    op.create_table(
        "users",
        sa.Column("auth_subject", sa.String(length=200), nullable=False),
        sa.Column("display_name", sa.String(length=100), nullable=True),
        sa.Column("avatar_url", sa.String(length=1000), nullable=True),
        sa.Column("status", sa.String(length=16), server_default="active", nullable=False),
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
        sa.CheckConstraint("status IN ('active', 'suspended')", name=op.f("ck_users_status")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("auth_subject", name=op.f("uq_users_auth_subject")),
    )
    op.create_table(
        "comments",
        sa.Column("content_id", sa.Uuid(), nullable=False),
        sa.Column("author_kind", sa.String(length=16), nullable=False),
        sa.Column("display_name", sa.String(length=40), nullable=True),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("client_fingerprint", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("moderated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("moderated_by", sa.String(length=200), nullable=True),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.CheckConstraint(
            "(author_kind = 'account') = (user_id IS NOT NULL)",
            name=op.f("ck_comments_account_has_user"),
        ),
        sa.CheckConstraint(
            "author_kind <> 'guest' OR display_name IS NOT NULL",
            name=op.f("ck_comments_guest_has_name"),
        ),
        sa.CheckConstraint(
            "author_kind IN ('anonymous', 'guest', 'account')", name=op.f("ck_comments_author_kind")
        ),
        sa.CheckConstraint(
            "status IN ('published', 'pending', 'hidden')", name=op.f("ck_comments_status")
        ),
        sa.ForeignKeyConstraint(
            ["content_id"],
            ["contents.id"],
            name=op.f("fk_comments_content_id_contents"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_comments_user_id_users"), ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_comments")),
    )
    op.create_index("ix_comments_queue", "comments", ["status", "created_at"], unique=False)
    op.create_index(
        "ix_comments_thread", "comments", ["content_id", "status", "created_at", "id"], unique=False
    )
    op.create_index(op.f("ix_comments_user_id"), "comments", ["user_id"], unique=False)
    op.create_table(
        "content_sources",
        sa.Column("content_id", sa.Uuid(), nullable=False),
        sa.Column("source_id", sa.Uuid(), nullable=False),
        sa.Column("external_id", sa.String(length=500), nullable=False),
        sa.Column("canonical_url", sa.String(length=2000), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("source_published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "source_published_precision", sa.String(length=8), server_default="day", nullable=False
        ),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.CheckConstraint(
            "source_published_precision IN ('day', 'month')",
            name=op.f("ck_content_sources_precision"),
        ),
        sa.ForeignKeyConstraint(
            ["content_id"],
            ["contents.id"],
            name=op.f("fk_content_sources_content_id_contents"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["source_id"],
            ["sources.id"],
            name=op.f("fk_content_sources_source_id_sources"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_content_sources")),
        sa.UniqueConstraint(
            "source_id", "external_id", name=op.f("uq_content_sources_source_id_external_id")
        ),
    )
    op.create_index(
        op.f("ix_content_sources_content_id"), "content_sources", ["content_id"], unique=False
    )
    op.create_table(
        "news_items",
        sa.Column("content_id", sa.Uuid(), nullable=False),
        sa.Column("region", sa.String(length=16), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column(
            "keywords",
            postgresql.ARRAY(sa.String(length=100)),
            server_default=sa.text("'{}'::character varying[]"),
            nullable=False,
        ),
        sa.Column("original_language", sa.String(length=8), nullable=False),
        sa.Column("editor_note", sa.Text(), nullable=True),
        sa.Column("video_provider", sa.String(length=16), nullable=True),
        sa.Column("video_id", sa.String(length=32), nullable=True),
        sa.Column("video_title", sa.String(length=300), nullable=True),
        sa.CheckConstraint(
            "category IN ('industrial', 'medical-imaging', 'public-sector', 'robotics', "
            "'market', 'models-open-source', 'edge-hardware', 'research', 'datasets', "
            "'events', 'jobs')",
            name=op.f("ck_news_items_category"),
        ),
        sa.CheckConstraint(
            "region IN ('vietnam', 'international')", name=op.f("ck_news_items_region")
        ),
        sa.CheckConstraint(
            "video_provider IS NULL OR video_provider IN ('youtube')",
            name=op.f("ck_news_items_video_provider"),
        ),
        sa.CheckConstraint(
            "(video_provider IS NULL) = (video_id IS NULL)",
            name=op.f("ck_news_items_video_complete"),
        ),
        sa.ForeignKeyConstraint(
            ["content_id"],
            ["contents.id"],
            name=op.f("fk_news_items_content_id_contents"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("content_id", name=op.f("pk_news_items")),
    )


def downgrade() -> None:
    op.drop_table("news_items")
    op.drop_index(op.f("ix_content_sources_content_id"), table_name="content_sources")
    op.drop_table("content_sources")
    op.drop_index(op.f("ix_comments_user_id"), table_name="comments")
    op.drop_index("ix_comments_thread", table_name="comments")
    op.drop_index("ix_comments_queue", table_name="comments")
    op.drop_table("comments")
    op.drop_table("users")
    op.drop_table("sources")
    op.drop_index("ix_contents_feed", table_name="contents")
    op.drop_table("contents")
    op.drop_index("ix_audit_events_target", table_name="audit_events")
    op.drop_table("audit_events")
