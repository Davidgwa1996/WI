import hashlib
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError  # ✅ fixed typo

from app.models import APIKey

logger = logging.getLogger(__name__)


def hash_api_key(raw_key: str) -> str:
    """Hash the raw API key using SHA-256."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def create_api_key(db: Session, organization_id: int, name: str) -> tuple[APIKey, str]:
    """
    Create a new API key for an organization.
    
    Args:
        db: Database session
        organization_id: ID of the organization
        name: Human-readable name for the API key
    
    Returns:
        tuple: (APIKey object, plaintext_key)
    
    Raises:
        Exception: If database operation fails
    """
    try:
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

        logger.info(f"Created API key '{name}' for organization {organization_id}")
        return api_key, raw_key

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating API key '{name}': {e}")
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating API key '{name}': {e}")
        raise


def get_api_key_by_prefix(db: Session, key_prefix: str) -> APIKey | None:
    """Retrieve an API key by its prefix (first 12 characters)."""
    return db.query(APIKey).filter(APIKey.key_prefix == key_prefix).first()


def revoke_api_key(db: Session, api_key_id: int, organization_id: int) -> bool:
    """
    Revoke (deactivate) an API key.
    
    Returns:
        bool: True if revoked, False if not found or already inactive
    """
    api_key = db.query(APIKey).filter(
        APIKey.id == api_key_id,
        APIKey.organization_id == organization_id
    ).first()
    
    if not api_key or not api_key.is_active:
        return False
    
    api_key.is_active = False
    db.commit()
    logger.info(f"Revoked API key '{api_key.name}' (id {api_key_id})")
    return True


def validate_api_key(db: Session, raw_key: str) -> APIKey | None:
    """
    Validate an API key by its hash.
    
    Returns:
        APIKey object if valid and active, None otherwise
    """
    key_hash = hash_api_key(raw_key)
    api_key = db.query(APIKey).filter(APIKey.key_hash == key_hash).first()
    
    if api_key and api_key.is_active:
        # Update last_used_at timestamp
        api_key.last_used_at = datetime.utcnow()
        db.commit()
        return api_key
    return None