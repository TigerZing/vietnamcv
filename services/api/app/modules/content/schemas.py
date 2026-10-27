"""Admin content schemas (ADR-015)."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel

from app.modules.content.models import ContentStatus, ContentType


class AdminContentStatus(StrEnum):
    """The lists the admin dashboard shows."""

    PUBLISHED = ContentStatus.PUBLISHED.value
    REMOVED = ContentStatus.REMOVED.value
    ARCHIVED = ContentStatus.ARCHIVED.value


class AdminContentItem(BaseModel):
    id: uuid.UUID
    type: ContentType
    slug: str
    title: str
    status: ContentStatus
    published_at: datetime | None
    created_at: datetime
    comment_count: int


class AdminContentPage(BaseModel):
    items: list[AdminContentItem]
    next_cursor: str | None
