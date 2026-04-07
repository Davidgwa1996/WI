import hashlib
from sqlalchemy.orm import Session

from app.models import APIKey


def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def create_api_key(db: Session, organization_id: int, name: str) -> tuple[APIKey, str]:
    raw_key = APIKey.generate_plaintext_key()
    key_prefix = raw_key[:12]

    api_key = APIKey(
        organization_id=organization_id,
        name=name,
        key_prefix=key_prefix,
        key_hash=hash_api_key(raw_key),
        is_active=True,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    return api_key, raw_key