import pytest

from app.core.config import ConfigurationError, Environment, Settings, load_settings

BASE_ENV = {
    "APP_ENV": "local",
    "DATABASE_URL": "postgresql://user:pass@db:5432/vietnamcv",
    "REDIS_URL": "redis://redis:6379/0",
}


@pytest.fixture
def env(monkeypatch: pytest.MonkeyPatch) -> pytest.MonkeyPatch:
    for key in ("APP_ENV", "DATABASE_URL", "REDIS_URL", "DEV_AUTH_ENABLED", "CORS_ALLOWED_ORIGINS"):
        monkeypatch.delenv(key, raising=False)
    for key, value in BASE_ENV.items():
        monkeypatch.setenv(key, value)
    return monkeypatch


def test_loads_valid_environment(env: pytest.MonkeyPatch) -> None:
    settings = load_settings()
    assert settings.environment is Environment.LOCAL
    assert settings.broker_url == "redis://redis:6379/0"


def test_plain_postgres_url_gets_psycopg_driver(env: pytest.MonkeyPatch) -> None:
    assert str(load_settings().database_url).startswith("postgresql+psycopg://")


def test_missing_variable_is_named_in_error(env: pytest.MonkeyPatch) -> None:
    env.delenv("DATABASE_URL")
    with pytest.raises(ConfigurationError, match="DATABASE_URL"):
        load_settings()


def test_invalid_environment_is_rejected(env: pytest.MonkeyPatch) -> None:
    env.setenv("APP_ENV", "prod")
    with pytest.raises(ConfigurationError, match="APP_ENV"):
        load_settings()


@pytest.mark.parametrize("environment", ["staging", "production"])
def test_dev_auth_is_refused_in_deployed_environments(
    env: pytest.MonkeyPatch, environment: str
) -> None:
    env.setenv("APP_ENV", environment)
    env.setenv("DEV_AUTH_ENABLED", "true")
    with pytest.raises(ConfigurationError, match="DEV_AUTH_ENABLED"):
        load_settings()


def test_dev_auth_allowed_locally(env: pytest.MonkeyPatch) -> None:
    env.setenv("DEV_AUTH_ENABLED", "true")
    assert load_settings().dev_auth_enabled is True


def test_cors_origins_are_comma_separated(env: pytest.MonkeyPatch) -> None:
    env.setenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000, https://vietnamcv.example")
    origins = [str(origin) for origin in load_settings().cors_allowed_origins]
    assert origins == ["http://localhost:3000/", "https://vietnamcv.example/"]


def test_settings_are_immutable(env: pytest.MonkeyPatch) -> None:
    settings: Settings = load_settings()
    with pytest.raises(ValueError, match="frozen"):
        settings.log_level = "DEBUG"  # type: ignore[misc]


@pytest.mark.parametrize("environment", ["staging", "production"])
def test_fingerprint_secret_required_in_deployed_environments(
    env: pytest.MonkeyPatch, environment: str
) -> None:
    env.setenv("APP_ENV", environment)
    env.delenv("CLIENT_FINGERPRINT_SECRET", raising=False)
    with pytest.raises(ConfigurationError, match="CLIENT_FINGERPRINT_SECRET"):
        load_settings()
    env.setenv("CLIENT_FINGERPRINT_SECRET", "a-real-secret")
    assert load_settings().environment.is_deployed
