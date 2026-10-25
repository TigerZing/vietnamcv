"""Keyset pagination helpers (specs/03-DATABASE.md: ``(timestamp, id)`` with tie-breaking).

Cursors are opaque to clients: URL-safe base64 of ``<ISO timestamp>|<uuid>``.
"""

from __future__ import annotations

import base64
import binascii
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Annotated

from fastapi import Query

from app.core.errors import DomainValidationError

DEFAULT_LIMIT = 20
MAX_LIMIT = 100

Limit = Annotated[int, Query(ge=1, le=MAX_LIMIT, description="Page size")]
Cursor = Annotated[
    str | None, Query(max_length=200, description="Opaque cursor from `next_cursor`")
]


@dataclass(frozen=True, slots=True)
class KeysetCursor:
    timestamp: datetime
    id: uuid.UUID

    def encode(self) -> str:
        raw = f"{self.timestamp.isoformat()}|{self.id}".encode()
        return base64.urlsafe_b64encode(raw).decode().rstrip("=")

    @classmethod
    def decode(cls, value: str) -> KeysetCursor:
        try:
            padded = value + "=" * (-len(value) % 4)
            timestamp, _, identifier = base64.urlsafe_b64decode(padded).decode().partition("|")
            cursor = cls(datetime.fromisoformat(timestamp), uuid.UUID(identifier))
        except (binascii.Error, UnicodeDecodeError, ValueError):
            raise DomainValidationError("Invalid cursor", details={"field": "cursor"}) from None
        if cursor.timestamp.tzinfo is None:
            raise DomainValidationError("Invalid cursor", details={"field": "cursor"})
        return cursor
