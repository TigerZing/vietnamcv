"""Admin sign-in schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.passwords import MAX_PASSWORD_LENGTH


class AdminLoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=MAX_PASSWORD_LENGTH)


class AdminSession(BaseModel):
    access_token: str = Field(description="Send as `Authorization: Bearer <token>`")
    token_type: str = "bearer"  # noqa: S105 - the OAuth token type, not a secret
    expires_at: datetime
    username: str


class AdminMe(BaseModel):
    subject: str
    username: str | None
