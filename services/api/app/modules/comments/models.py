"""Comments under published content: anonymous, guest-named or signed-in authors."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from app.core.db import Base, UUIDPrimaryKeyMixin


class AuthorKind(StrEnum):
    ANONYMOUS = "anonymous"  # no name shown
    GUEST = "guest"  # self-chosen, unverified display name
    ACCOUNT = "account"  # signed-in user (Google)


class CommentStatus(StrEnum):
    PUBLISHED = "published"
    PENDING = "pending"  # held for moderation
    HIDDEN = "hidden"  # removed by a moderator


class Comment(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "comments"
    __table_args__ = (
        CheckConstraint("author_kind IN ('anonymous', 'guest', 'account')", name="author_kind"),
        CheckConstraint("status IN ('published', 'pending', 'hidden')", name="status"),
        CheckConstraint(
            "(author_kind = 'account') = (user_id IS NOT NULL)", name="account_has_user"
        ),
        CheckConstraint(
            "author_kind <> 'guest' OR display_name IS NOT NULL", name="guest_has_name"
        ),
        Index("ix_comments_thread", "content_id", "status", "created_at", "id"),
        Index("ix_comments_queue", "status", "created_at"),
    )

    content_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False
    )
    author_kind: Mapped[str] = mapped_column(String(16), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(40))
    # SET NULL keeps public discussion intact if a user record is ever removed.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    # HMAC of the client IP (never the raw address), for abuse investigation and bans.
    client_fingerprint: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    moderated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    moderated_by: Mapped[str | None] = mapped_column(String(200))
