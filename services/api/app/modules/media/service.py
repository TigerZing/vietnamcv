"""Image intake: download, verify, re-encode and store (ADR-010)."""

from __future__ import annotations

import hashlib
import io
import uuid
from collections.abc import Sequence
from dataclasses import dataclass

import httpx
from PIL import Image, UnidentifiedImageError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import DomainValidationError
from app.modules.media import repository
from app.modules.media.models import MAX_STORED_BYTES, STORED_MIME_TYPE, MediaAsset

# Downloads larger than this are refused before decoding.
MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024
# Decompression-bomb guard: refuse images above this many pixels.
MAX_PIXELS = 40_000_000
# Stored images fit in this box; wide enough for a full-width article image.
MAX_EDGE = 1600
WEBP_QUALITY = 82
ACCEPTED_FORMATS = frozenset({"JPEG", "PNG", "WEBP", "GIF"})
USER_AGENT = "VietnamCV-media/0.1 (+https://github.com/TigerZing/vietnamcv)"


@dataclass(frozen=True, slots=True)
class NormalizedImage:
    data: bytes
    width: int
    height: int
    sha256: str


def normalize(raw: bytes) -> NormalizedImage:
    """Verify ``raw`` is a supported image and re-encode it as WebP without metadata.

    Re-encoding drops EXIF (location, camera serials) and anything appended to the file,
    and gives every stored image one format and a bounded size.
    """
    try:
        with Image.open(io.BytesIO(raw)) as probe:
            if probe.format not in ACCEPTED_FORMATS:
                raise DomainValidationError(
                    "Unsupported image format", details={"format": probe.format}
                )
            if probe.width * probe.height > MAX_PIXELS:
                raise DomainValidationError("Image is too large", details={"pixels": MAX_PIXELS})
            probe.verify()
        with Image.open(io.BytesIO(raw)) as image:
            image.seek(0)
            converted = image.convert("RGBA" if _has_alpha(image) else "RGB")
    except (UnidentifiedImageError, OSError, SyntaxError) as exc:
        raise DomainValidationError("File is not a readable image") from exc

    converted.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
    buffer = io.BytesIO()
    converted.save(buffer, format="WEBP", quality=WEBP_QUALITY, method=6)
    data = buffer.getvalue()
    if len(data) > MAX_STORED_BYTES:
        raise DomainValidationError("Image is too large after conversion")
    return NormalizedImage(
        data=data,
        width=converted.width,
        height=converted.height,
        sha256=hashlib.sha256(data).hexdigest(),
    )


def _has_alpha(image: Image.Image) -> bool:
    return image.mode in {"RGBA", "LA", "PA"} or "transparency" in image.info


async def store(session: AsyncSession, raw: bytes, *, origin: str) -> MediaAsset:
    """Normalize and store an image; returns the existing row when the bytes are known."""
    image = normalize(raw)
    existing = await repository.find_by_sha256(session, image.sha256)
    if existing is not None:
        return existing
    asset = MediaAsset(
        id=uuid.uuid4(),
        sha256=image.sha256,
        mime_type=STORED_MIME_TYPE,
        width=image.width,
        height=image.height,
        byte_size=len(image.data),
        data=image.data,
        origin=origin,
    )
    session.add(asset)
    await session.flush()
    return asset


async def get(session: AsyncSession, media_id: uuid.UUID) -> MediaAsset | None:
    return await repository.get(session, media_id)


async def get_many(
    session: AsyncSession, media_ids: Sequence[uuid.UUID]
) -> dict[uuid.UUID, MediaAsset]:
    return await repository.get_many(session, media_ids)


async def get_with_data(session: AsyncSession, media_id: uuid.UUID) -> MediaAsset | None:
    return await repository.get_with_data(session, media_id)


async def download(client: httpx.AsyncClient, url: str, *, referer: str | None = None) -> bytes:
    """Fetch an image from an editor-curated HTTPS URL, with a size limit.

    Only called by the curated import on URLs committed to the repository; never with a
    URL supplied by a visitor. ``referer`` is the article the image belongs to; some news
    CDNs refuse image requests without it.
    """
    if not url.startswith("https://"):
        raise DomainValidationError("Image URL must use HTTPS", details={"url": url})
    headers = {"User-Agent": USER_AGENT, "Accept": "image/avif,image/webp,image/*;q=0.8"}
    if referer:
        headers["Referer"] = referer
    async with client.stream("GET", url, headers=headers) as response:
        response.raise_for_status()
        if response.url.scheme != "https":
            raise DomainValidationError("Image URL redirected off HTTPS", details={"url": url})
        content_type = response.headers.get("content-type", "")
        if not content_type.startswith("image/"):
            raise DomainValidationError(
                "URL did not return an image", details={"url": url, "type": content_type}
            )
        chunks: list[bytes] = []
        received = 0
        async for chunk in response.aiter_bytes():
            received += len(chunk)
            if received > MAX_DOWNLOAD_BYTES:
                raise DomainValidationError("Image download is too large", details={"url": url})
            chunks.append(chunk)
    return b"".join(chunks)


def http_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=httpx.Timeout(20.0), follow_redirects=True, max_redirects=3)
