from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.auth.password import hash_password, verify_password
from app.models import Organization, User


def register_organization_owner(
    db: Session,
    organization_name: str,
    organization_slug: str,
    full_name: str,
    email: str,
    password: str,
) -> User:
    try:
        organization = Organization(
            name=organization_name,
            slug=organization_slug,
            plan="free",
            is_active=True,
            billing_email=email,
        )
        db.add(organization)
        db.flush()

        user = User(
            organization_id=organization.id,
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role="owner",
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    except SQLAlchemyError as e:
        db.rollback()
        print(f"Database error in register_organization_owner: {e}")
        raise

    except Exception as e:
        db.rollback()
        print(f"Unexpected error in register_organization_owner: {e}")
        raise


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None

        if not verify_password(password, user.password_hash):
            return None

        if not user.is_active:
            return None

        return user

    except Exception as e:
        print(f"Unexpected error in authenticate_user: {e}")
        return None