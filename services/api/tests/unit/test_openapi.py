from app.cli.export_openapi import build_schema


def test_schema_documents_error_envelope_and_health_routes() -> None:
    schema = build_schema()
    paths = schema["paths"]
    assert isinstance(paths, dict)
    assert "/api/v1/health/live" in paths
    assert "/api/v1/health/ready" in paths
    components = schema["components"]
    assert isinstance(components, dict)
    assert "ErrorEnvelope" in components["schemas"]
