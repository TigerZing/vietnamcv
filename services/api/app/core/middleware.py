"""ASGI middleware: request IDs, access logging and last-resort error handling."""

from __future__ import annotations

import re
import time
import uuid
from http import HTTPStatus

import structlog
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.errors import error_response
from app.core.logging import get_logger
from app.core.request_context import reset_request_id, set_request_id

REQUEST_ID_HEADER = "x-request-id"
# Accept a caller-supplied ID only if it is short and harmless to echo into logs and headers.
_VALID_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{8,128}$")

logger = get_logger("app.access")


def _incoming_request_id(scope: Scope) -> str | None:
    for name, value in scope["headers"]:
        if name == REQUEST_ID_HEADER.encode():
            candidate: str = value.decode("latin-1")
            return candidate if _VALID_REQUEST_ID.match(candidate) else None
    return None


class RequestContextMiddleware:
    """Assigns a request ID, binds it to log context, echoes it and logs each request.

    Unhandled exceptions are converted to the error envelope here, inside the request
    context, so 500 responses still carry the request ID.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = _incoming_request_id(scope) or uuid.uuid4().hex
        token = set_request_id(request_id)
        structlog.contextvars.bind_contextvars(request_id=request_id)
        started = time.perf_counter()
        status_code = HTTPStatus.INTERNAL_SERVER_ERROR.value
        response_started = False

        async def send_with_request_id(message: Message) -> None:
            nonlocal status_code, response_started
            if message["type"] == "http.response.start":
                response_started = True
                status_code = message["status"]
                headers = list(message.get("headers", []))
                headers.append((REQUEST_ID_HEADER.encode(), request_id.encode()))
                message["headers"] = headers
            await send(message)

        try:
            await self.app(scope, receive, send_with_request_id)
        except Exception as exc:
            logger.exception("unhandled_exception", exc_type=type(exc).__name__)
            if response_started:
                raise
            response = error_response(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "An unexpected error occurred",
            )
            await response(scope, receive, send_with_request_id)
        finally:
            logger.info(
                "http_request",
                method=scope["method"],
                path=scope["path"],
                status_code=status_code,
                duration_ms=round((time.perf_counter() - started) * 1000, 2),
            )
            structlog.contextvars.unbind_contextvars("request_id")
            reset_request_id(token)
