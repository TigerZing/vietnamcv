"""Fixed-window rate limiting on Redis, plus privacy-preserving client fingerprints.

Raw IP addresses are never stored: they are reduced to an HMAC keyed by
``CLIENT_FINGERPRINT_SECRET``. The client address is ``request.client.host``, which
uvicorn fills from ``X-Forwarded-For`` only for proxies listed in ``FORWARDED_ALLOW_IPS``.
"""

from __future__ import annotations

import hashlib
import hmac
from dataclasses import dataclass

from fastapi import Request
from redis.asyncio import Redis

from app.core.config import Settings
from app.core.errors import RateLimitedError


@dataclass(frozen=True, slots=True)
class RateLimit:
    """At most ``limit`` hits per ``window_seconds`` for one key."""

    name: str
    limit: int
    window_seconds: int


def client_fingerprint(request: Request, settings: Settings) -> str:
    host = request.client.host if request.client else "unknown"
    secret = settings.client_fingerprint_secret.get_secret_value().encode()
    return hmac.new(secret, host.encode(), hashlib.sha256).hexdigest()


async def enforce(redis: Redis, rule: RateLimit, key: str) -> None:
    """Count one hit; raise :class:`RateLimitedError` once the window's budget is spent."""
    redis_key = f"ratelimit:{rule.name}:{key}"
    async with redis.pipeline(transaction=True) as pipe:
        pipe.incr(redis_key)
        pipe.expire(redis_key, rule.window_seconds, nx=True)
        pipe.ttl(redis_key)
        count, _, ttl = await pipe.execute()
    if int(count) > rule.limit:
        raise RateLimitedError(
            "Too many requests, please try again later",
            details={"rule": rule.name, "retry_after_seconds": max(int(ttl), 1)},
        )


async def claim_once(redis: Redis, key: str, ttl_seconds: int) -> bool:
    """Return True the first time ``key`` is claimed within ``ttl_seconds``."""
    return bool(await redis.set(f"once:{key}", "1", nx=True, ex=ttl_seconds))
