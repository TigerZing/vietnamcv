import pytest
from pydantic import ValidationError

from app.modules.comments.models import AuthorKind, CommentStatus
from app.modules.comments.policy import (
    has_link,
    initial_status,
    is_reserved_name,
    normalize_body,
    normalize_name,
)
from app.modules.comments.schemas import CommentCreate, PostingMode


def test_body_is_trimmed_and_newlines_capped() -> None:
    assert normalize_body("  Xin   chào \r\n\r\n\r\n\r\nbạn  ") == "Xin chào\n\nbạn"


def test_control_and_bidi_characters_are_removed() -> None:
    assert normalize_body("a\u202eb\u200bc\x07d") == "abcd"


def test_name_is_single_line() -> None:
    assert normalize_name("  Nguyễn \n  Văn   A ") == "Nguyễn Văn A"


@pytest.mark.parametrize(
    "name", ["Admin", "VietnamCV Team", "Ban quản trị", "kiểm duyệt viên", "MODERATOR"]
)
def test_reserved_names(name: str) -> None:
    assert is_reserved_name(name)


@pytest.mark.parametrize("name", ["Minh", "Lan Anh", "Đức"])
def test_ordinary_names_are_allowed(name: str) -> None:
    assert not is_reserved_name(name)


@pytest.mark.parametrize(
    "text", ["xem https://a.b/c", "vào www.example.org", "mua tại shop.vn nhé", "spam.xyz"]
)
def test_links_are_detected(text: str) -> None:
    assert has_link(text)


def test_plain_text_has_no_link() -> None:
    assert not has_link("Mô hình YOLO v.12 chạy 30 fps trên Jetson.")


def test_unverified_comment_with_link_is_held() -> None:
    assert initial_status(AuthorKind.ANONYMOUS, "xem www.x.com", None) is CommentStatus.PENDING
    assert initial_status(AuthorKind.GUEST, "ok", "shop.vn") is CommentStatus.PENDING


def test_account_comment_with_link_is_published() -> None:
    assert initial_status(AuthorKind.ACCOUNT, "xem www.x.com", None) is CommentStatus.PUBLISHED


def test_guest_mode_requires_a_name() -> None:
    with pytest.raises(ValidationError, match="display_name"):
        CommentCreate(mode=PostingMode.GUEST, body="Bài viết hay")
    with pytest.raises(ValidationError, match="display_name"):
        CommentCreate(mode=PostingMode.GUEST, body="Bài viết hay", display_name=" A ")


def test_name_is_dropped_outside_guest_mode() -> None:
    payload = CommentCreate(mode=PostingMode.ANONYMOUS, body="Hay", display_name="Minh")
    assert payload.display_name is None


@pytest.mark.parametrize("body", ["", "   ", "a", "x" * 2001])
def test_body_length_is_validated(body: str) -> None:
    with pytest.raises(ValidationError, match="body"):
        CommentCreate(mode=PostingMode.ANONYMOUS, body=body)
