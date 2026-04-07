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


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    if not user.is_active:
        return None
    return user