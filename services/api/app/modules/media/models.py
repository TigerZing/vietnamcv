"""Stored image files (ADR-010). Bytes live in PostgreSQL until object storage is chosen."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Integer, LargeBinary, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, UUIDPrimaryKeyMixin

# Every stored image is re-encoded to this format (see service.normalize).
STORED_MIME_TYPE = "image/webp"
MAX_STORED_BYTES = 2 * 1024 * 1024


class MediaAsset(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "media_assets"
    __table_args__ = (
        CheckConstraint(f"mime_type IN ('{STORED_MIME_TYPE}')", name="mime_type"),
        CheckConstraint(f"byte_size > 0 AND byte_size <= {MAX_STORED_BYTES}", name="byte_size"),
        CheckConstraint("width > 0 AND height > 0", name="dimensions"),
    )

    # SHA-256 of the stored bytes; identical images are stored once.
    sha256: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    mime_type: Mapped[str] = mapped_column(String(64), nullable=False)
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    byte_size: Mapped[int] = mapped_column(Integer, nullable=False)
    data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False, deferred=True)
    # Where the original file came from: a URL, or a repository path for our own files.
    origin: Mapped[str] = mapped_column(String(2000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
