import io

import pytest
from PIL import Image

from app.core.errors import DomainValidationError
from app.modules.media.service import MAX_EDGE, normalize
from tests.media_helpers import png_bytes


def test_normalize_reencodes_to_webp() -> None:
    image = normalize(png_bytes(64, 48))
    assert image.data[:4] == b"RIFF"
    assert image.data[8:12] == b"WEBP"
    assert (image.width, image.height) == (64, 48)
    assert len(image.sha256) == 64


def test_same_input_gives_same_hash() -> None:
    assert normalize(png_bytes()).sha256 == normalize(png_bytes()).sha256


def test_large_images_are_resized() -> None:
    image = normalize(png_bytes(MAX_EDGE * 2, MAX_EDGE))
    assert (image.width, image.height) == (MAX_EDGE, MAX_EDGE // 2)


def test_metadata_is_stripped() -> None:
    source = Image.new("RGB", (40, 30), (1, 2, 3))
    exif = Image.Exif()
    exif[0x010F] = "SecretCamera"  # Make
    buffer = io.BytesIO()
    source.save(buffer, format="JPEG", exif=exif.tobytes())
    stored = normalize(buffer.getvalue())
    with Image.open(io.BytesIO(stored.data)) as reopened:
        assert not reopened.getexif()
    assert b"SecretCamera" not in stored.data


@pytest.mark.parametrize(
    "raw",
    [
        b"",
        b"<html></html>",
        b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        png_bytes()[:40],
    ],
)
def test_non_images_are_rejected(raw: bytes) -> None:
    with pytest.raises(DomainValidationError):
        normalize(raw)


def test_unsupported_formats_are_rejected() -> None:
    buffer = io.BytesIO()
    Image.new("RGB", (10, 10)).save(buffer, format="BMP")
    with pytest.raises(DomainValidationError):
        normalize(buffer.getvalue())
