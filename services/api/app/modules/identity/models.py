"""Local user records, keyed by the identity provider's stable subject."""

from __future__ import annotations

from enum import StrEnum

from sqlalchemy import CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TimestampMixin, UUIDPrimaryKeyMixin


class UserStatus(StrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("status IN ('active', 'suspended')", name="status"),)

    auth_subject: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    display_name: Mapped[str | None] = mapped_column(String(100))
    avatar_url: Mapped[str | None] = mapped_column(String(1000))
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, server_default=UserStatus.ACTIVE.value
    )
