from __future__ import annotations

import logging
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.auth.password import hash_password, verify_password
from app.models import Organization, User

logger = logging.getLogger(__name__)


def register_organization_owner(
    db: Session,
    organization_name: str,
    organization_slug: str,
    full_name: str,
    email: str,
    password: str,
) -> User:
    """
    Create a brand-new organization and its first owner account.

    Final flow:
    - user creates workspace
    - workspace is created as organization
    - creator becomes owner automatically
    """
    try:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise ValueError("Email is already registered.")

        existing_org = (
            db.query(Organization)
            .filter(Organization.slug == organization_slug)
            .first()
        )
        if existing_org:
            raise ValueError("Organization slug already exists.")

        organization = Organization(
            name=organization_name.strip(),
            slug=organization_slug.strip().lower(),
            plan="free",
            is_active=True,
            billing_email=email.strip().lower(),
        )
        db.add(organization)
        db.flush()

        user = User(
            organization_id=organization.id,
            full_name=full_name.strip(),
            email=email.strip().lower(),
            password_hash=hash_password(password),
            role="owner",
            is_active=True,
            is_verified=True,
        )
        db.add(user)

        db.commit()
        db.refresh(user)

        logger.info(
            "Created new organization '%s' with owner '%s'",
            organization.slug,
            user.email,
        )
        return user

    except ValueError:
        db.rollback()
        raise

    except SQLAlchemyError as e:
        db.rollback()
        logger.error("Database error in register_organization_owner: %s", e, exc_info=True)
        raise

    except Exception as e:
        db.rollback()
        logger.error("Unexpected error in register_organization_owner: %s", e, exc_info=True)
        raise


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """
    Authenticate a user with email and password.
    Only active users can log in.
    """
    try:
        normalized_email = email.strip().lower()

        user = db.query(User).filter(User.email == normalized_email).first()
        if not user:
            return None

        if not user.is_active:
            logger.warning("Login blocked for inactive user: %s", normalized_email)
            return None

        if not verify_password(password, user.password_hash):
            return None

        return user

    except Exception as e:
        logger.error("Unexpected error in authenticate_user: %s", e, exc_info=True)
        return None