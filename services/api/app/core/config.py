"""Application settings loaded from environment variables.

Settings are validated once at startup. A missing or malformed variable fails fast with
a message naming the variable, instead of surfacing later as an obscure runtime error.
"""

from __future__ import annotations

from enum import StrEnum
from functools import lru_cache
from typing import Annotated, Literal, Self

from pydantic import (
    AnyHttpUrl,
    Field,
    PostgresDsn,
    RedisDsn,
    SecretStr,
    ValidationError,
    field_validator,
    model_validator,
)
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

_LOCAL_FINGERPRINT_SECRET = "local-only-fingerprint-secret"  # noqa: S105 - placeholder


class Environment(StrEnum):
    LOCAL = "local"
    TEST = "test"
    STAGING = "staging"
    PRODUCTION = "production"

    @property
    def is_deployed(self) -> bool:
        return self in {Environment.STAGING, Environment.PRODUCTION}


class ConfigurationError(RuntimeError):
    """Raised when environment configuration is missing or invalid."""


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=None,
        extra="ignore",
        case_sensitive=False,
        frozen=True,
    )

    environment: Environment = Field(validation_alias="APP_ENV")
    database_url: PostgresDsn
    redis_url: RedisDsn
    celery_broker_url: RedisDsn | None = None

    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    log_json: bool = True

    cors_allowed_origins: Annotated[list[AnyHttpUrl], NoDecode] = Field(default_factory=list)
    health_check_timeout_seconds: float = Field(default=2.0, gt=0, le=10)

    # Development-only identity switch. Never enabled outside local/test (validated below).
    dev_auth_enabled: bool = False

    # Google sign-in (ADR-009). The API only verifies ID tokens, so it needs the OAuth client
    # ID (the token audience) and never the client secret. Unset disables Google sign-in.
    google_oauth_client_id: str | None = Field(default=None, validation_alias="GOOGLE_CLIENT_ID")

    # Keys the HMAC that turns client IP addresses into rate-limit and abuse fingerprints,
    # so raw IPs are never stored. Must be a real secret outside local/test.
    client_fingerprint_secret: SecretStr = SecretStr(_LOCAL_FINGERPRINT_SECRET)

    @field_validator("database_url", mode="before")
    @classmethod
    def _use_psycopg_driver(cls, value: object) -> object:
        # Accept plain postgres URLs from managed providers; SQLAlchemy needs the driver name.
        if isinstance(value, str):
            for prefix in ("postgres://", "postgresql://"):
                if value.startswith(prefix):
                    return "postgresql+psycopg://" + value.removeprefix(prefix)
        return value

    @field_validator("cors_allowed_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def _guard_deployed_environments(self) -> Self:
        if self.environment.is_deployed and self.dev_auth_enabled:
            raise ValueError("DEV_AUTH_ENABLED must be false in staging and production")
        if (
            self.environment.is_deployed
            and self.client_fingerprint_secret.get_secret_value() == _LOCAL_FINGERPRINT_SECRET
        ):
            raise ValueError("CLIENT_FINGERPRINT_SECRET must be set in staging and production")
        return self

    @property
    def broker_url(self) -> str:
        return str(self.celery_broker_url or self.redis_url)


def load_settings() -> Settings:
    """Build settings from the environment, converting validation errors to a clear message."""
    try:
        return Settings()  # values come from the environment
    except ValidationError as exc:
        problems = []
        for error in exc.errors():
            location = ".".join(str(part) for part in error["loc"]) or "settings"
            problems.append(f"  - {location.upper()}: {error['msg']}")
        raise ConfigurationError(
            "Invalid environment configuration:\n" + "\n".join(problems)
        ) from None


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return load_settings()
