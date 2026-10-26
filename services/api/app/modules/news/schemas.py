"""News API schemas and the curated-import fixture format."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

from app.modules.content.models import DatePrecision, ImageRights, LinkKind, TextLanguage
from app.modules.news.models import NewsCategory, NewsRegion, VideoProvider

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
YOUTUBE_ID_PATTERN = r"^[A-Za-z0-9_-]{11}$"
# A technology hashtag without the "#": letters and digits, then also "+", "." or "-".
TAG_PATTERN = r"^[A-Za-z0-9][A-Za-z0-9+.-]{0,39}$"


class SourceRef(BaseModel):
    name: str
    url: str = Field(description="Original article URL")
    published_on: date | None = Field(description="Date the source published the story")
    published_precision: DatePrecision


class Video(BaseModel):
    provider: VideoProvider
    id: str
    title: str | None


class Image(BaseModel):
    id: uuid.UUID
    url: str = Field(description="Path of the image bytes on this API")
    width: int
    height: int
    alt: str
    caption: str | None
    credit: str
    credit_url: str | None
    rights: ImageRights


class Link(BaseModel):
    kind: LinkKind
    label: str
    url: str


class NewsSummary(BaseModel):
    """A news card."""

    id: uuid.UUID
    slug: str
    title: str = Field(description="Title in the returned language")
    original_title: str = Field(description="Title as the source published it")
    summary: str
    language: TextLanguage = Field(
        description="Language of title, summary and body; Vietnamese when no translation"
    )
    category: NewsCategory
    region: NewsRegion
    keywords: list[str]
    tags: list[str] = Field(description='Technology hashtags, shown as "#tag"')
    published_at: datetime
    source: SourceRef
    video: Video | None
    image: Image | None
    ai_assisted: bool
    comment_count: int


class NewsDetail(NewsSummary):
    body: str | None = Field(
        description=(
            'Post text: paragraphs split by blank lines, "## " headings, "- " items, and '
            '"{{figure:N}}" lines placing figures[N-1]'
        )
    )
    figures: list[Image] = Field(description="Images from inside the source article, in order")
    links: list[Link]
    original_language: str
    editor_note: str | None
    fetched_at: datetime


class NewsPage(BaseModel):
    items: list[NewsSummary]
    next_cursor: str | None


class TagCount(BaseModel):
    tag: str
    count: int = Field(description="Published posts with this tag")


class TagList(BaseModel):
    items: list[TagCount] = Field(description="Most used first")


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


class CuratedImage(BaseModel):
    """An image: a URL the import downloads, or a file next to the fixture."""

    model_config = ConfigDict(extra="forbid")

    url: HttpUrl | None = None
    file: str | None = Field(default=None, pattern=r"^[a-z0-9][a-z0-9/_-]*\.(png|jpg|webp)$")
    alt: str = Field(min_length=1, max_length=500)
    caption: str | None = None
    alt_en: str | None = Field(default=None, min_length=1, max_length=500)
    caption_en: str | None = None
    credit: str = Field(min_length=1, max_length=300)
    credit_url: HttpUrl | None = None
    rights: ImageRights

    @model_validator(mode="after")
    def _one_origin(self) -> CuratedImage:
        if (self.url is None) == (self.file is None):
            raise ValueError("Give exactly one of url or file")
        if self.url is not None and self.url.scheme != "https":
            raise ValueError("Image URLs must use HTTPS")
        return self

    @property
    def origin(self) -> str:
        return str(self.url) if self.url is not None else f"file:{self.file}"


class CuratedText(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=500)
    summary: str = Field(min_length=1)
    body: str | None = Field(default=None, min_length=1)


class CuratedLink(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: LinkKind
    label: str = Field(min_length=1, max_length=300)
    url: HttpUrl


# News covers products, applications, industry and the market. Research papers belong in
# Papers, and competitions and conference deadlines are not collected (owner, 2026-10-26).
EXCLUDED_CATEGORIES = frozenset({NewsCategory.RESEARCH, NewsCategory.EVENTS})


class CuratedNewsItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(pattern=SLUG_PATTERN, max_length=200)
    title: str = Field(min_length=1, max_length=500, description="Title as the source has it")
    text: dict[TextLanguage, CuratedText] = Field(
        description="VietnamCV's text per language; Vietnamese is required"
    )
    ai_assisted: bool = False
    source: str = Field(description="Code of a source in the same file")
    external_id: str = Field(min_length=1, max_length=500)
    url: HttpUrl
    collected_on: date
    published_on: date
    published_precision: DatePrecision = DatePrecision.DAY
    region: NewsRegion
    category: NewsCategory
    keywords: list[str] = Field(default_factory=list)
    tags: list[Annotated[str, Field(pattern=TAG_PATTERN)]] = Field(
        default_factory=list, max_length=8
    )
    original_language: str = Field(pattern=r"^[a-z]{2}$")
    editor_note: str | None = None
    video: CuratedVideo | None = None
    image: CuratedImage | None = None
    # Images from inside the source article, in reading order. A body line
    # "{{figure:N}}" places figure N (from 1) there; unplaced figures follow the text.
    figures: list[CuratedImage] = Field(default_factory=list, max_length=30)
    links: list[CuratedLink] = Field(default_factory=list)

    @model_validator(mode="after")
    def _vietnamese_text(self) -> CuratedNewsItem:
        if TextLanguage.VI not in self.text:
            raise ValueError("text.vi is required")
        if self.category in EXCLUDED_CATEGORIES:
            raise ValueError(
                f"News does not collect '{self.category}' posts (papers, competitions, deadlines)"
            )
        return self


class CuratedWithdrawal(BaseModel):
    """A post taken off the site; it stays in the database as archived."""

    model_config = ConfigDict(extra="forbid")

    source: str = Field(description="Code of a source in the same file")
    external_id: str = Field(min_length=1, max_length=500)
    reason: str = Field(min_length=1, max_length=300)


class CuratedNewsFile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str
    sources: list[CuratedSource]
    items: list[CuratedNewsItem]
    withdrawn: list[CuratedWithdrawal] = Field(default_factory=list)

    @model_validator(mode="after")
    def _withdrawn_not_listed(self) -> CuratedNewsFile:
        listed = {(item.source, item.external_id) for item in self.items}
        both = [w.external_id for w in self.withdrawn if (w.source, w.external_id) in listed]
        if both:
            raise ValueError(f"Posts both listed and withdrawn: {both}")
        return self
