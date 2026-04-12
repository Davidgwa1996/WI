from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import APIKey

logger = logging.getLogger(__name__)


def hash_api_key(raw_key: str) -> str:
    """Hash a raw API key using SHA-256."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def create_api_key(db: Session, organization_id: int, name: str) -> tuple[APIKey, str]:
    """
    Create a new API key for an organization.

    Returns:
        (api_key_record, plaintext_key)
    """
    try:
        raw_key = APIKey.generate_plaintext_key()
        key_prefix = raw_key[:12]

        api_key = APIKey(
            organization_id=organization_id,
            name=name.strip(),
            key_prefix=key_prefix,
            key_hash=hash_api_key(raw_key),
            is_active=True,
        )

        db.add(api_key)
        db.commit()
        db.refresh(api_key)

        logger.info(
            "Created API key '%s' for organization %s",
            api_key.name,
            organization_id,
        )
        return api_key, raw_key

    except SQLAlchemyError as e:
        db.rollback()
        logger.error("Database error creating API key '%s': %s", name, e)
        raise
    except Exception as e:
        db.rollback()
        logger.error("Unexpected error creating API key '%s': %s", name, e)
        raise


def list_api_keys(db: Session, organization_id: int) -> List[APIKey]:
    """List all API keys for an organization."""
    return (
        db.query(APIKey)
        .filter(APIKey.organization_id == organization_id)
        .order_by(APIKey.created_at.desc())
        .all()
    )


def get_api_key_by_id(db: Session, api_key_id: int, organization_id: int) -> Optional[APIKey]:
    """Get one API key by id within an organization."""
    return (
        db.query(APIKey)
        .filter(
            APIKey.id == api_key_id,
            APIKey.organization_id == organization_id,
        )
        .first()
    )


def get_api_key_by_prefix(db: Session, key_prefix: str) -> Optional[APIKey]:
    """Retrieve an API key by its visible prefix."""
    return db.query(APIKey).filter(APIKey.key_prefix == key_prefix).first()


def revoke_api_key(db: Session, api_key_id: int, organization_id: int) -> bool:
    """
    Revoke an API key by marking it inactive.

    Returns:
        True if revoked, False if not found or already inactive.
    """
    api_key = get_api_key_by_id(db, api_key_id, organization_id)
    if not api_key or not api_key.is_active:
        return False

    try:
        api_key.is_active = False
        db.add(api_key)
        db.commit()

        logger.info("Revoked API key '%s' (id %s)", api_key.name, api_key_id)
        return True
    except Exception as e:
        db.rollback()
        logger.error("Failed to revoke API key id %s: %s", api_key_id, e)
        raise


def validate_api_key(db: Session, raw_key: str) -> Optional[APIKey]:
    """
    Validate a raw API key.

    Returns:
        APIKey if valid and active, otherwise None.
    """
    key_hash = hash_api_key(raw_key)

    api_key = (
        db.query(APIKey)
        .filter(
            APIKey.key_hash == key_hash,
            APIKey.is_active == True,  # noqa: E712
        )
        .first()
    )

    if not api_key:
        return None

    try:
        api_key.last_used_at = datetime.now(timezone.utc)
        db.add(api_key)
        db.commit()
        db.refresh(api_key)
    except Exception as e:
        db.rollback()
        logger.warning(
            "API key validated but failed to update last_used_at for key id %s: %s",
            api_key.id,
            e,
        )

    return api_key