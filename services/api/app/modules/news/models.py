"""News-specific fields on top of a canonical ``contents`` row."""

from __future__ import annotations

import uuid
from enum import StrEnum

from sqlalchemy import CheckConstraint, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.core.db import Base
from app.modules.content.models import Content


class NewsRegion(StrEnum):
    VIETNAM = "vietnam"
    INTERNATIONAL = "international"


class NewsCategory(StrEnum):
    INDUSTRIAL = "industrial"
    MEDICAL_IMAGING = "medical-imaging"
    PUBLIC_SECTOR = "public-sector"
    ROBOTICS = "robotics"
    MARKET = "market"
    MODELS_OPEN_SOURCE = "models-open-source"
    EDGE_HARDWARE = "edge-hardware"
    RESEARCH = "research"
    DATASETS = "datasets"
    EVENTS = "events"
    JOBS = "jobs"


class VideoProvider(StrEnum):
    YOUTUBE = "youtube"


def _in(column: str, values: type[StrEnum]) -> str:
    return f"{column} IN ({', '.join(repr(member.value) for member in values)})"


class NewsItem(Base):
    __tablename__ = "news_items"
    __table_args__ = (
        CheckConstraint(_in("region", NewsRegion), name="region"),
        CheckConstraint(_in("category", NewsCategory), name="category"),
        CheckConstraint("(video_provider IS NULL) = (video_id IS NULL)", name="video_complete"),
        CheckConstraint(
            "video_provider IS NULL OR " + _in("video_provider", VideoProvider),
            name="video_provider",
        ),
    )

    content_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("contents.id", ondelete="CASCADE"), primary_key=True
    )
    region: Mapped[str] = mapped_column(String(16), nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    keywords: Mapped[list[str]] = mapped_column(
        ARRAY(String(100)), nullable=False, server_default=text("'{}'::character varying[]")
    )
    original_language: Mapped[str] = mapped_column(String(8), nullable=False)
    # Editor's caveat shown with the post (for example "dates not verified").
    editor_note: Mapped[str | None] = mapped_column(Text)
    video_provider: Mapped[str | None] = mapped_column(String(16))
    video_id: Mapped[str | None] = mapped_column(String(32))
    video_title: Mapped[str | None] = mapped_column(String(300))

    content: Mapped[Content] = relationship(lazy="raise")
