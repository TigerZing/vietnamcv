"""Localized post text, stored images and related links (ADR-010).

Adds ``content_translations`` (title, summary and body per language),
``news_items.ai_assisted``, ``media_assets`` (image bytes), ``content_media`` (an image
used by a content, with credit and rights) and ``content_links``.

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-25
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "content_translations",
        sa.Column("content_id", sa.Uuid(), nullable=False),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.CheckConstraint(
            "language IN ('vi', 'en')", name=op.f("ck_content_translations_language")
        ),
        sa.ForeignKeyConstraint(
            ["content_id"],
            ["contents.id"],
            name=op.f("fk_content_translations_content_id_contents"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_content_translations")),
        sa.UniqueConstraint(
            "content_id", "language", name=op.f("uq_content_translations_content_id_language")
        ),
    )
    op.add_column(
        "news_items",
        sa.Column("ai_assisted", sa.Boolean(), server_default="false", nullable=False),
    )
    op.create_table(
        "media_assets",
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("mime_type", sa.String(length=64), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("byte_size", sa.Integer(), nullable=False),
        sa.Column("data", sa.LargeBinary(), nullable=False),
        sa.Column("origin", sa.String(length=2000), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.CheckConstraint(
            "byte_size > 0 AND byte_size <= 2097152", name=op.f("ck_media_assets_byte_size")
        ),
        sa.CheckConstraint("width > 0 AND height > 0", name=op.f("ck_media_assets_dimensions")),
        sa.CheckConstraint("mime_type IN ('image/webp')", name=op.f("ck_media_assets_mime_type")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_media_assets")),
        sa.UniqueConstraint("sha256", name=op.f("uq_media_assets_sha256")),
    )
    op.create_table(
        "content_media",
        sa.Column("content_id", sa.Uuid(), nullable=False),
        sa.Column("media_id", sa.Uuid(), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("position", sa.Integer(), server_default="0", nullable=False),
        sa.Column("alt_text", sa.String(length=500), nullable=False),
        sa.Column("caption", sa.Text(), nullable=True),
        sa.Column("credit", sa.String(length=300), nullable=False),
        sa.Column("credit_url", sa.String(length=2000), nullable=True),
        sa.Column("rights", sa.String(length=32), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.CheckConstraint("position >= 0", name=op.f("ck_content_media_position")),
        sa.CheckConstraint(
            "rights IN ('own', 'licensed', 'permission_pending')",
            name=op.f("ck_content_media_rights"),
        ),
        sa.CheckConstraint("role IN ('illustration')", name=op.f("ck_content_media_role")),
        sa.ForeignKeyConstraint(
            ["content_id"],
            ["contents.id"],
            name=op.f("fk_content_media_content_id_contents"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["media_id"],
            ["media_assets.id"],
            name=op.f("fk_content_media_media_id_media_assets"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_content_media")),
        sa.UniqueConstraint(
            "content_id", "role", "position", name=op.f("uq_content_media_content_id_role_position")
        ),
    )
    op.create_index(op.f("ix_content_media_media_id"), "content_media", ["media_id"], unique=False)
    op.create_table(
        "content_links",
        sa.Column("content_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("label", sa.String(length=300), nullable=False),
        sa.Column("url", sa.String(length=2000), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.CheckConstraint(
            "kind IN ('official', 'paper', 'code', 'dataset', 'model', 'reference')",
            name=op.f("ck_content_links_kind"),
        ),
        sa.CheckConstraint("position >= 0", name=op.f("ck_content_links_position")),
        sa.ForeignKeyConstraint(
            ["content_id"],
            ["contents.id"],
            name=op.f("fk_content_links_content_id_contents"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_content_links")),
        sa.UniqueConstraint(
            "content_id", "position", name=op.f("uq_content_links_content_id_position")
        ),
    )


def downgrade() -> None:
    op.drop_table("content_links")
    op.drop_index(op.f("ix_content_media_media_id"), table_name="content_media")
    op.drop_table("content_media")
    op.drop_table("media_assets")
    op.drop_column("news_items", "ai_assisted")
    op.drop_table("content_translations")
