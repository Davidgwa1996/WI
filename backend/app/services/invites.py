from datetime import datetime, timedelta
import secrets
import os
import logging
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.models import TeamInvite, User
from app.auth.password import hash_password

# Configure logging
logger = logging.getLogger(__name__)

# Get frontend URL from environment variables (with fallback)
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://web3dkintel.netlify.app")
INVITE_EXPIRY_HOURS = int(os.getenv("INVITE_EXPIRY_HOURS", "72"))


def generate_invite_token() -> str:
    """
    Generate a secure unique token for the invite.
    
    Returns:
        str: URL-safe base64-encoded token (32 bytes)
    """
    token = secrets.token_urlsafe(32)
    logger.debug(f"Generated invite token: {token[:16]}...")
    return token


def create_team_invite(
    db: Session,
    organization_id: int,
    invited_by_user_id: Optional[int],
    email: str,
    role: str,
    expires_hours: int = INVITE_EXPIRY_HOURS,
) -> Tuple[TeamInvite, str]:
    """
    Create a team invite and return the invite object and the full HTTPS invite link.
    
    Args:
        db: Database session
        organization_id: ID of the organization
        invited_by_user_id: ID of the user sending the invite (can be None for system invites)
        email: Email address of the invitee
        role: Role to assign (admin, analyst, member, viewer, owner)
        expires_hours: Number of hours until the invite expires (default: 72)
    
    Returns:
        tuple: (TeamInvite object, invite_link)
    
    Raises:
        ValueError: If email is invalid or role is not recognized
    """
    # Validate inputs
    if not email or "@" not in email:
        raise ValueError(f"Invalid email address: {email}")
    
    # Normalise role (lowercase, strip spaces)
    role = role.lower().strip()
    
    # Updated valid roles to include 'analyst'
    valid_roles = ["admin", "analyst", "member", "viewer", "owner"]
    if role not in valid_roles:
        raise ValueError(f"Invalid role: {role}. Must be one of {valid_roles}")
    
    # Check for existing pending invite
    existing_invite = db.query(TeamInvite).filter(
        TeamInvite.email == email,
        TeamInvite.organization_id == organization_id,
        TeamInvite.is_accepted == False,
        TeamInvite.expires_at > datetime.utcnow()
    ).first()
    
    if existing_invite:
        logger.warning(f"Pending invite already exists for {email} in org {organization_id}")
        # Return existing invite instead of creating a new one
        existing_link = f"{FRONTEND_URL}/invite/{existing_invite.token}"
        return existing_invite, existing_link
    
    # Create new invite
    try:
        invite = TeamInvite(
            organization_id=organization_id,
            invited_by_user_id=invited_by_user_id,
            email=email.lower().strip(),  # Normalize email
            role=role,
            token=generate_invite_token(),
            expires_at=datetime.utcnow() + timedelta(hours=expires_hours),
            is_accepted=False,
            created_at=datetime.utcnow(),
        )
        db.add(invite)
        db.commit()
        db.refresh(invite)
        
        # Generate the full HTTPS invite link using the frontend URL
        invite_link = f"{FRONTEND_URL}/invite/{invite.token}"
        
        # Store the link in the invite's extra_data for reference (if column exists)
        if hasattr(invite, 'extra_data'):
            invite.extra_data = {
                "invite_link": invite_link,
                "created_at": datetime.utcnow().isoformat(),
                "expires_at": invite.expires_at.isoformat()
            }
            db.commit()
        
        logger.info(f"Created invite for {email} in org {organization_id} with role {role}")
        return invite, invite_link
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create invite for {email}: {e}")
        raise


def accept_team_invite(
    db: Session,
    token: str,
    full_name: str,
    password: str,
) -> Optional[User]:
    """
    Accept a team invite and create/activate the user account.
    
    Args:
        db: Database session
        token: Invite token
        full_name: User's full name
        password: User's chosen password
    
    Returns:
        User object if successful, None if invalid/expired invite
    """
    if not token:
        logger.warning("Accept invite called with empty token")
        return None
    
    # Find the invite by token
    invite = db.query(TeamInvite).filter(TeamInvite.token == token).first()
    
    if not invite:
        logger.warning(f"No invite found with token: {token[:16]}...")
        return None

    # Check if already accepted
    if invite.is_accepted:
        logger.warning(f"Invite {token[:16]}... already accepted")
        return None

    # Check if expired
    if invite.expires_at < datetime.utcnow():
        logger.warning(f"Invite {token[:16]}... expired at {invite.expires_at}")
        return None

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == invite.email).first()
    if existing_user:
        # User exists, just mark invite as accepted and add to organization
        invite.is_accepted = True
        invite.accepted_at = datetime.utcnow()
        db.add(invite)
        db.commit()
        
        logger.info(f"Existing user {existing_user.email} accepted invite to org {invite.organization_id}")
        return existing_user

    # Create new user
    try:
        user = User(
            organization_id=invite.organization_id,
            full_name=full_name.strip(),
            email=invite.email.lower(),
            password_hash=hash_password(password),
            role=invite.role,
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow(),
        )
        db.add(user)
        db.flush()  # Get user ID without committing

        # Mark invite as accepted
        invite.is_accepted = True
        invite.accepted_at = datetime.utcnow()
        db.add(invite)
        db.commit()
        db.refresh(user)
        
        logger.info(f"Created new user {user.email} with role {user.role} from invite")
        return user
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to accept invite for token {token[:16]}...: {e}")
        return None


def get_invite_by_token(db: Session, token: str) -> Optional[TeamInvite]:
    """
    Get an invite by its token.
    
    Args:
        db: Database session
        token: Invite token
    
    Returns:
        TeamInvite object if found, None otherwise
    """
    if not token:
        return None
    
    return db.query(TeamInvite).filter(TeamInvite.token == token).first()


def get_invite_link(token: str) -> str:
    """
    Generate the full HTTPS invite link for a given token.
    
    Args:
        token: Invite token
    
    Returns:
        str: Full HTTPS URL for the invite
    """
    return f"{FRONTEND_URL}/invite/{token}"


def get_pending_invites_by_email(db: Session, email: str) -> list[TeamInvite]:
    """
    Get all pending invites for a specific email address.
    
    Args:
        db: Database session
        email: Email address to search for
    
    Returns:
        list: List of pending TeamInvite objects
    """
    return db.query(TeamInvite).filter(
        TeamInvite.email == email.lower(),
        TeamInvite.is_accepted == False,
        TeamInvite.expires_at > datetime.utcnow()
    ).order_by(TeamInvite.created_at.desc()).all()


def cancel_invite(db: Session, invite_id: int, organization_id: int) -> bool:
    """
    Cancel a pending invite.
    
    Args:
        db: Database session
        invite_id: ID of the invite to cancel
        organization_id: Organization ID for authorization
    
    Returns:
        bool: True if cancelled, False if not found or already accepted
    """
    invite = db.query(TeamInvite).filter(
        TeamInvite.id == invite_id,
        TeamInvite.organization_id == organization_id,
        TeamInvite.is_accepted == False
    ).first()
    
    if not invite:
        logger.warning(f"Invite {invite_id} not found or already accepted")
        return False
    
    try:
        db.delete(invite)
        db.commit()
        logger.info(f"Cancelled invite {invite_id} for {invite.email}")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to cancel invite {invite_id}: {e}")
        return False


def refresh_invite_link(db: Session, invite_id: int, organization_id: int) -> Optional[str]:
    """
    Generate a new token for an existing invite (refresh the link).
    
    Args:
        db: Database session
        invite_id: ID of the invite to refresh
        organization_id: Organization ID for authorization
    
    Returns:
        str: New invite link, or None if failed
    """
    invite = db.query(TeamInvite).filter(
        TeamInvite.id == invite_id,
        TeamInvite.organization_id == organization_id,
        TeamInvite.is_accepted == False
    ).first()
    
    if not invite:
        logger.warning(f"Cannot refresh invite {invite_id}: not found or already accepted")
        return None
    
    try:
        # Generate new token and extend expiry
        invite.token = generate_invite_token()
        invite.expires_at = datetime.utcnow() + timedelta(hours=INVITE_EXPIRY_HOURS)
        db.commit()
        
        new_link = f"{FRONTEND_URL}/invite/{invite.token}"
        logger.info(f"Refreshed invite link for {invite.email}")
        return new_link
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to refresh invite {invite_id}: {e}")
        return None


# Configuration validation function
def validate_invite_config() -> dict:
    """
    Validate that invite configuration is complete.
    
    Returns:
        dict: Configuration status
    """
    config_status = {
        "frontend_url": FRONTEND_URL,
        "invite_expiry_hours": INVITE_EXPIRY_HOURS,
        "is_valid": True,
        "issues": []
    }
    
    if not FRONTEND_URL:
        config_status["is_valid"] = False
        config_status["issues"].append("FRONTEND_URL is not set")
    elif not FRONTEND_URL.startswith("https://"):
        config_status["issues"].append(f"FRONTEND_URL should use HTTPS: {FRONTEND_URL}")
    
    if INVITE_EXPIRY_HOURS <= 0:
        config_status["is_valid"] = False
        config_status["issues"].append("INVITE_EXPIRY_HOURS must be positive")
    
    return config_status