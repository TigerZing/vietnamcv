"""Canonical content records and their provenance (ADR-003)."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.core.db import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ContentType(StrEnum):
    NEWS = "news"
    DEMO = "demo"  # a demo product shown on /demos (ADR-013)


class ContentStatus(StrEnum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    PUBLISHED = "published"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class DatePrecision(StrEnum):
    """How much of a source date is known. Monthly magazines only give the month."""

    DAY = "day"
    MONTH = "month"


class ImageRights(StrEnum):
    """Whether VietnamCV may show an image in public (ADR-010)."""

    # Made by or for VietnamCV.
    OWN = "own"
    # The rights holder allowed this use, or the image's licence does.
    LICENSED = "licensed"
    # Taken from the source with credit; permission not yet obtained. Hidden when deployed.
    PERMISSION_PENDING = "permission_pending"


class TextLanguage(StrEnum):
    """Languages VietnamCV publishes its own text in (ADR-008). Vietnamese is the source."""

    VI = "vi"
    EN = "en"


class MediaRole(StrEnum):
    # The lead image, shown on cards and at the top of the post (position 0 only).
    ILLUSTRATION = "illustration"
    # Images from inside the source article, shown in the post text in position order.
    FIGURE = "figure"


class LinkKind(StrEnum):
    """A related link shown at the end of a post, after the source."""

    OFFICIAL = "official"
    PAPER = "paper"
    CODE = "code"
    DATASET = "dataset"
    MODEL = "model"
    REFERENCE = "reference"


def _in(column: str, values: type[StrEnum]) -> str:
    return f"{column} IN ({', '.join(repr(member.value) for member in values)})"


class Source(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "sources"

    code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    base_url: Mapped[str] = mapped_column(String(500), nullable=False)
    trust_tier: Mapped[str] = mapped_column(String(32), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    terms_url: Mapped[str | None] = mapped_column(String(500))
    attribution_text: Mapped[str | None] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Content(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "contents"
    __table_args__ = (
        CheckConstraint("type IN ('news', 'demo')", name="type"),
        CheckConstraint(
            "status IN ('draft', 'pending_review', 'published', 'rejected', 'archived')",
            name="status",
        ),
        CheckConstraint("status <> 'published' OR published_at IS NOT NULL", name="published_at"),
        # Feed query: WHERE status = 'published' AND type = ? ORDER BY published_at, id.
        Index("ix_contents_feed", "status", "type", "published_at", "id"),
    )

    type: Mapped[str] = mapped_column(String(32), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    # Original title, preserved as published by the source (English titles stay English).
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    # Short Vietnamese text; localized versions live in content_translations.
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(8), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, server_default=ContentStatus.DRAFT.value
    )
    # Null until the first publication on VietnamCV; never reset by later edits.
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    sources: Mapped[list[ContentSource]] = relationship(
        back_populates="content", cascade="all, delete-orphan", lazy="raise"
    )


class ContentSource(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "content_sources"
    __table_args__ = (
        UniqueConstraint("source_id", "external_id"),
        CheckConstraint("source_published_precision IN ('day', 'month')", name="precision"),
    )

    content_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("sources.id", ondelete="RESTRICT"), nullable=False
    )
    external_id: Mapped[str] = mapped_column(String(500), nullable=False)
    canonical_url: Mapped[str] = mapped_column(String(2000), nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    source_published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    source_published_precision: Mapped[str] = mapped_column(
        String(8), nullable=False, server_default=DatePrecision.DAY.value
    )

    content: Mapped[Content] = relationship(back_populates="sources", lazy="raise")
    source: Mapped[Source] = relationship(lazy="raise")


class ContentMedia(UUIDPrimaryKeyMixin, Base):
    """An image used by a content, with the credit and rights of that use."""

    __tablename__ = "content_media"
    __table_args__ = (
        UniqueConstraint("content_id", "role", "position"),
        CheckConstraint(_in("role", MediaRole), name="role"),
        CheckConstraint(_in("rights", ImageRights), name="rights"),
        CheckConstraint("position >= 0", name="position"),
    )

    content_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False
    )
    media_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("media_assets.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    alt_text: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[str | None] = mapped_column(Text)
    # English alt text and caption; Vietnamese is used when they are missing.
    alt_text_en: Mapped[str | None] = mapped_column(String(500))
    caption_en: Mapped[str | None] = mapped_column(Text)
    # Who made the image, as shown under it (for example "Ảnh: VnExpress").
    credit: Mapped[str] = mapped_column(String(300), nullable=False)
    # Page the image was taken from, linked from the credit.
    credit_url: Mapped[str | None] = mapped_column(String(2000))
    rights: Mapped[str] = mapped_column(String(32), nullable=False)
    # Where this use's file came from (URL or "file:<path>"). Identical files share one
    # media asset, so the asset's own origin can name a different use.
    origin: Mapped[str | None] = mapped_column(String(2000))


class ContentLink(UUIDPrimaryKeyMixin, Base):
    """A related link (paper, code, dataset, official page) listed after the source."""

    __tablename__ = "content_links"
    __table_args__ = (
        UniqueConstraint("content_id", "position"),
        CheckConstraint(_in("kind", LinkKind), name="kind"),
        CheckConstraint("position >= 0", name="position"),
    )

    content_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    label: Mapped[str] = mapped_column(String(300), nullable=False)
    url: Mapped[str] = mapped_column(String(2000), nullable=False)


class ContentTranslation(UUIDPrimaryKeyMixin, Base):
    """VietnamCV's own title, summary and article text in one language.

    The text is written by VietnamCV from the source, never the source's full text
    (specs/05-INGESTION.md). ``body`` is plain text: paragraphs separated by blank lines,
    "## " headings and "- " list items.
    """

    __tablename__ = "content_translations"
    __table_args__ = (
        UniqueConstraint("content_id", "language"),
        CheckConstraint(_in("language", TextLanguage), name="language"),
    )

    content_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False
    )
    language: Mapped[str] = mapped_column(String(8), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str | None] = mapped_column(Text)
