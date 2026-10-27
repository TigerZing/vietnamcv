"""Local user records, keyed by the identity provider's stable subject, and admin accounts."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from sqlalchemy import CheckConstraint, DateTime, String
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


class AdminAccount(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A site administrator who signs in with a username and password (ADR-015).

    Created from the command line only (``python -m app.cli.create_admin``); there is no
    sign-up endpoint. Only the scrypt hash of the password is stored.
    """

    __tablename__ = "admin_accounts"

    # Stored lower-case, so sign-in is case-insensitive on the username.
    username: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
