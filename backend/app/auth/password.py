from __future__ import annotations

from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """
    Hash a plain-text password for storage.
    """
    if not password or not isinstance(password, str):
        raise ValueError("Password is required.")
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """
    Verify a plain-text password against a stored hash.
    """
    if not plain_password or not password_hash:
        return False

    try:
        return pwd_context.verify(plain_password, password_hash)
    except Exception:
        return False