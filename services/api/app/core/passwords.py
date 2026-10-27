"""Password hashing with scrypt from the standard library (ADR-015).

Hashes are self-describing strings, ``scrypt$<n>$<r>$<p>$<salt>$<hash>`` (base64), so the
cost can be raised later without breaking stored hashes: :func:`needs_rehash` tells the
caller when to store a fresh one.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from functools import cache

# 2**15 x 8 x 1 needs 32 MiB per hash: well above OWASP's scrypt minimum.
_N = 2**15
_R = 8
_P = 1
_SALT_BYTES = 16
_KEY_BYTES = 32
_MAXMEM = 64 * 1024 * 1024
_PREFIX = "scrypt"
_PARTS = 6

MIN_PASSWORD_LENGTH = 10
MAX_PASSWORD_LENGTH = 256


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def _derive(password: str, salt: bytes, n: int, r: int, p: int) -> bytes:
    return hashlib.scrypt(
        password.encode("utf-8"), salt=salt, n=n, r=r, p=p, maxmem=_MAXMEM, dklen=_KEY_BYTES
    )


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(_SALT_BYTES)
    key = _derive(password, salt, _N, _R, _P)
    return f"{_PREFIX}${_N}${_R}${_P}${_b64(salt)}${_b64(key)}"


def verify_password(password: str, encoded: str) -> bool:
    """Constant-time check of ``password`` against a stored hash. False for bad hashes."""
    parts = encoded.split("$")
    if len(parts) != _PARTS or parts[0] != _PREFIX:
        return False
    try:
        n, r, p = (int(value) for value in parts[1:4])
        salt = base64.b64decode(parts[4], validate=True)
        expected = base64.b64decode(parts[5], validate=True)
        actual = _derive(password, salt, n, r, p)
    except ValueError:
        return False
    return hmac.compare_digest(actual, expected)


def needs_rehash(encoded: str) -> bool:
    return not encoded.startswith(f"{_PREFIX}${_N}${_R}${_P}$")


@cache
def dummy_hash() -> str:
    """A hash to verify against when the username does not exist, so both paths cost the same."""
    return hash_password(secrets.token_urlsafe(16))
