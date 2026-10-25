"""Comment content rules and anti-abuse limits. Pure functions, unit-tested."""

from __future__ import annotations

import re
import unicodedata

from app.core.rate_limit import RateLimit
from app.modules.comments.models import AuthorKind, CommentStatus

BODY_MIN = 2
BODY_MAX = 2000
NAME_MIN = 2
NAME_MAX = 40
MAX_CONSECUTIVE_NEWLINES = 2

# Limits per client fingerprint (anonymous and guest) or per account.
GUEST_BURST = RateLimit("comments:guest:burst", limit=3, window_seconds=5 * 60)
GUEST_DAILY = RateLimit("comments:guest:daily", limit=20, window_seconds=24 * 3600)
ACCOUNT_BURST = RateLimit("comments:account:burst", limit=6, window_seconds=5 * 60)
ACCOUNT_DAILY = RateLimit("comments:account:daily", limit=60, window_seconds=24 * 3600)
# The same text from the same client on the same post is rejected for this long.
DUPLICATE_WINDOW_SECONDS = 3600

# C0 controls except tab/newline, DEL, zero-width and bidirectional override characters.
_CONTROL = re.compile(r"[\x00-\x08\x0b-\x1f\x7f\u200b-\u200f\u202a-\u202e\u2066-\u2069]")
_MANY_NEWLINES = re.compile(r"\n{3,}")
_SPACES = re.compile(r"[ \t]+")
_LINK = re.compile(r"(https?://|www\.|\b[a-z0-9-]+\.(com|net|org|vn|io|xyz|top|info)\b)", re.I)

# Names a guest may not use, compared without diacritics or case. Signed-in accounts show
# their verified name with a badge instead.
_RESERVED_NAME_PARTS = ("admin", "moderator", "quan tri", "kiem duyet", "vietnamcv", "ban bien tap")


def _fold(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value.replace("đ", "d").replace("Đ", "D"))
    return "".join(ch for ch in decomposed if not unicodedata.combining(ch)).casefold()


def normalize_body(value: str) -> str:
    text = unicodedata.normalize("NFC", value).replace("\r\n", "\n").replace("\r", "\n")
    text = _CONTROL.sub("", text)
    lines = [_SPACES.sub(" ", line).strip() for line in text.split("\n")]
    return _MANY_NEWLINES.sub("\n" * MAX_CONSECUTIVE_NEWLINES, "\n".join(lines)).strip()


def normalize_name(value: str) -> str:
    text = _CONTROL.sub("", unicodedata.normalize("NFC", value))
    return _SPACES.sub(" ", text.replace("\n", " ")).strip()


def is_reserved_name(name: str) -> bool:
    folded = _fold(name)
    return any(part in folded for part in _RESERVED_NAME_PARTS)


def has_link(text: str) -> bool:
    return bool(_LINK.search(text))


def initial_status(kind: AuthorKind, body: str, display_name: str | None) -> CommentStatus:
    """Signed-in comments publish immediately; unverified ones with links wait for review."""
    if kind is AuthorKind.ACCOUNT:
        return CommentStatus.PUBLISHED
    if has_link(body) or (display_name is not None and has_link(display_name)):
        return CommentStatus.PENDING
    return CommentStatus.PUBLISHED
