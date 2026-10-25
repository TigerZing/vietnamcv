"""A local stand-in for Google's signing keys, so tests never call Google."""

from __future__ import annotations

import time
from typing import Any

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa

from app.core.security import GoogleIdTokenVerifier

CLIENT_ID = "test-client.apps.googleusercontent.com"
KEY_ID = "test-key"


class _StaticJwks:
    """Mimics ``jwt.PyJWKClient.get_signing_key_from_jwt`` with one known key."""

    def __init__(self, public_key: rsa.RSAPublicKey) -> None:
        self._key = jwt.PyJWK.from_dict(
            {**jwt.algorithms.RSAAlgorithm.to_jwk(public_key, as_dict=True), "kid": KEY_ID}
        )

    def get_signing_key_from_jwt(self, token: str) -> jwt.PyJWK:
        if jwt.get_unverified_header(token).get("kid") != KEY_ID:
            raise jwt.PyJWKClientError("Unknown key")
        return self._key


class FakeGoogle:
    def __init__(self) -> None:
        self.private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.verifier = GoogleIdTokenVerifier(
            CLIENT_ID,
            jwks_client=_StaticJwks(self.private_key.public_key()),  # type: ignore[arg-type]
        )

    def token(self, sub: str = "1234567890", **overrides: Any) -> str:
        now = int(time.time())
        claims: dict[str, Any] = {
            "iss": "https://accounts.google.com",
            "aud": CLIENT_ID,
            "sub": sub,
            "iat": now,
            "exp": now + 3600,
            "name": "Nguyễn Văn A",
            "picture": "https://lh3.googleusercontent.com/a/test",
            "email": "a@example.com",
        }
        claims.update(overrides)
        claims = {key: value for key, value in claims.items() if value is not None}
        return jwt.encode(claims, self.private_key, algorithm="RS256", headers={"kid": KEY_ID})
