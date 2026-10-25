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
        CheckConstraint("type IN ('news')", name="type"),
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
    # Short Vietnamese text shown on cards and as the post body for curated news.
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
