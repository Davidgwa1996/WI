from datetime import datetime, timedelta
import secrets
from sqlalchemy.orm import Session

from app.models import TeamInvite, User
from app.auth.password import hash_password


def generate_invite_token() -> str:
    return secrets.token_urlsafe(32)


def create_team_invite(
    db: Session,
    organization_id: int,
    invited_by_user_id: int | None,
    email: str,
    role: str,
    expires_hours: int = 72,
) -> TeamInvite:
    invite = TeamInvite(
        organization_id=organization_id,
        invited_by_user_id=invited_by_user_id,
        email=email,
        role=role,
        token=generate_invite_token(),
        expires_at=datetime.utcnow() + timedelta(hours=expires_hours),
        is_accepted=False,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


def accept_team_invite(
    db: Session,
    token: str,
    full_name: str,
    password: str,
) -> User | None:
    invite = db.query(TeamInvite).filter(TeamInvite.token == token).first()
    if not invite:
        return None

    if invite.is_accepted:
        return None

    if invite.expires_at < datetime.utcnow():
        return None

    existing_user = db.query(User).filter(User.email == invite.email).first()
    if existing_user:
        invite.is_accepted = True
        db.add(invite)
        db.commit()
        return existing_user

    user = User(
        organization_id=invite.organization_id,
        full_name=full_name,
        email=invite.email,
        password_hash=hash_password(password),
        role=invite.role,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    invite.is_accepted = True
    db.add(invite)
    db.commit()
    db.refresh(user)

    return user