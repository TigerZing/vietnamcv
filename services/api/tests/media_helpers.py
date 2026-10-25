"""Offline stand-ins for image downloads. Tests never reach the network."""

from __future__ import annotations

import io

import httpx
from PIL import Image


def png_bytes(
    width: int = 64, height: int = 48, color: tuple[int, int, int] = (200, 30, 30)
) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (width, height), color).save(buffer, format="PNG")
    return buffer.getvalue()


class FakeImageServer:
    """Answers every request with one image, or with ``status`` when it is not 200."""

    def __init__(self, body: bytes | None = None, *, status: int = 200) -> None:
        self.body = body if body is not None else png_bytes()
        self.status = status
        self.requests: list[str] = []
        self.referers: list[str | None] = []

    def client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(transport=httpx.MockTransport(self._handle))

    def _handle(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(str(request.url))
        self.referers.append(request.headers.get("referer"))
        if self.status != 200:
            return httpx.Response(self.status)
        return httpx.Response(200, content=self.body, headers={"content-type": "image/png"})
