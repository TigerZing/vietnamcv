"""Short video API schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field

VIDEO_SLUG_PATTERN = r"^video-[a-z0-9]+(?:-[a-z0-9]+)*$"
VISITOR_ID_PATTERN = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"


class VideoEngagement(BaseModel):
    likes: int = Field(ge=0)
    comments: int = Field(ge=0)
    liked: bool = Field(description="Whether the visitor sending the request liked the video")
