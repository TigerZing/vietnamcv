from app.core import passwords


def test_hash_round_trip_and_salting() -> None:
    first = passwords.hash_password("correct horse battery")
    second = passwords.hash_password("correct horse battery")
    assert first != second  # random salt
    assert first.startswith("scrypt$")
    assert "correct horse" not in first
    assert passwords.verify_password("correct horse battery", first)
    assert not passwords.verify_password("correct horse batterY", first)
    assert not passwords.needs_rehash(first)


def test_malformed_hashes_never_verify() -> None:
    for encoded in ("", "plain", "scrypt$1$2$3$x$y", "bcrypt$a$b$c$d$e", "scrypt$a$8$1$AA==$AA=="):
        assert not passwords.verify_password("anything", encoded)


def test_weaker_parameters_need_rehash() -> None:
    assert passwords.needs_rehash("scrypt$16384$8$1$AAAA$AAAA")
