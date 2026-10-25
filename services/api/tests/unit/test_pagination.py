import uuid
from datetime import UTC, datetime

import pytest

from app.core.errors import DomainValidationError
from app.core.pagination import KeysetCursor


def test_cursor_round_trip() -> None:
    cursor = KeysetCursor(datetime(2026, 10, 25, 7, 30, 1, 123456, tzinfo=UTC), uuid.uuid4())
    assert KeysetCursor.decode(cursor.encode()) == cursor


@pytest.mark.parametrize("value", ["", "not-base64!", "Zm9v", "MjAyNi0xMC0yNVQwMDowMDowMHx4"])
def test_malformed_cursor_is_a_validation_error(value: str) -> None:
    with pytest.raises(DomainValidationError):
        KeysetCursor.decode(value)
