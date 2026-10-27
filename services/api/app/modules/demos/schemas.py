"""The curated demo list the seed imports (ADR-013)."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.modules.news.schemas import SLUG_PATTERN, CuratedSource

LINKEDIN_URN_PATTERN = r"^urn:li:(ugcPost|activity|share):\d{15,25}$"


class CuratedDemo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: str = Field(pattern=SLUG_PATTERN, max_length=200)
    urn: str = Field(pattern=LINKEDIN_URN_PATTERN, description="LinkedIn update URN")
    url: HttpUrl
    title: str = Field(min_length=1, max_length=500, description="Vietnamese title")
    published_on: date


class CuratedDemoFile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str | None = None
    source: CuratedSource
    items: list[CuratedDemo] = Field(min_length=1)
