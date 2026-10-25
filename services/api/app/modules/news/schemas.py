"""News API schemas and the curated-import fixture format."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.modules.content.models import DatePrecision
from app.modules.news.models import NewsCategory, NewsRegion, VideoProvider

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
YOUTUBE_ID_PATTERN = r"^[A-Za-z0-9_-]{11}$"


class SourceRef(BaseModel):
    name: str
    url: str = Field(description="Original article URL")
    published_on: date | None = Field(description="Date the source published the story")
    published_precision: DatePrecision


class Video(BaseModel):
    provider: VideoProvider
    id: str
    title: str | None


class NewsSummary(BaseModel):
    """A news card."""

    id: uuid.UUID
    slug: str
    title: str
    summary: str
    language: str
    category: NewsCategory
    region: NewsRegion
    keywords: list[str]
    published_at: datetime
    source: SourceRef
    video: Video | None
    comment_count: int


class NewsDetail(NewsSummary):
    original_language: str
    editor_note: str | None
    fetched_at: datetime


class NewsPage(BaseModel):
    items: list[NewsSummary]
    next_cursor: str | None


# --- Curated import (editor-approved rows exported from the news sheet) ---


class CuratedSource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(pattern=SLUG_PATTERN, max_length=64)
    name: str = Field(min_length=1, max_length=200)
    kind: str = Field(min_length=1, max_length=32)
    base_url: HttpUrl


class CuratedVideo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    provider: VideoProvider
    id: str = Field(pattern=YOUTUBE_ID_PATTERN)
    title: str | None = Field(default=None, max_length=300)


class CuratedNewsItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(pattern=SLUG_PATTERN, max_length=200)
    title: str = Field(min_length=1, max_length=500)
    summary: str = Field(min_length=1)
    source: str = Field(description="Code of a source in the same file")
    external_id: str = Field(min_length=1, max_length=500)
    url: HttpUrl
    collected_on: date
    published_on: date
    published_precision: DatePrecision = DatePrecision.DAY
    region: NewsRegion
    category: NewsCategory
    keywords: list[str] = Field(default_factory=list)
    original_language: str = Field(pattern=r"^[a-z]{2}$")
    editor_note: str | None = None
    video: CuratedVideo | None = None


class CuratedNewsFile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str
    sources: list[CuratedSource]
    items: list[CuratedNewsItem]
