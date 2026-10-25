"""Comment API schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.comments.models import AuthorKind, CommentStatus
from app.modules.comments.policy import (
    BODY_MAX,
    BODY_MIN,
    NAME_MAX,
    NAME_MIN,
    normalize_body,
    normalize_name,
)


class CommentAuthor(BaseModel):
    kind: AuthorKind
    name: str | None = Field(description="Null for anonymous authors")
    avatar_url: str | None
    verified: bool = Field(description="True when the name comes from a signed-in account")


class CommentOut(BaseModel):
    id: uuid.UUID
    author: CommentAuthor
    body: str
    status: CommentStatus
    created_at: datetime


class CommentPage(BaseModel):
    items: list[CommentOut]
    next_cursor: str | None


class PostingMode(StrEnum):
    ANONYMOUS = "anonymous"
    GUEST = "guest"
    ACCOUNT = "account"


class CommentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mode: PostingMode
    body: str = Field(max_length=BODY_MAX * 2)
    display_name: str | None = Field(default=None, max_length=NAME_MAX * 2)
    # Honeypot: hidden from people by the web form, so only bots fill it in.
    website: str | None = Field(default=None, max_length=500)

    @field_validator("body")
    @classmethod
    def _body(cls, value: str) -> str:
        body = normalize_body(value)
        if not BODY_MIN <= len(body) <= BODY_MAX:
            raise ValueError(f"must be {BODY_MIN} to {BODY_MAX} characters")
        return body

    @field_validator("display_name")
    @classmethod
    def _name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        name = normalize_name(value)
        return name or None

    @model_validator(mode="after")
    def _name_matches_mode(self) -> Self:
        if self.mode is PostingMode.GUEST:
            if self.display_name is None or not NAME_MIN <= len(self.display_name) <= NAME_MAX:
                raise ValueError(f"display_name must be {NAME_MIN} to {NAME_MAX} characters")
        else:
            self.display_name = None
        return self


class ModerationAction(StrEnum):
    PUBLISH = "publish"
    HIDE = "hide"


class ModerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: ModerationAction
    reason: str | None = Field(default=None, max_length=500)


class QueuedComment(CommentOut):
    content_id: uuid.UUID


class ModerationQueue(BaseModel):
    items: list[QueuedComment]
    next_cursor: str | None
