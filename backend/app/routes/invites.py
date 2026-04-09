from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
import os
from datetime import datetime
import logging

from app.auth.dependencies import get_current_user, require_roles
from app.auth.jwt_handler import create_access_token
from app.database import get_db
from app.models import TeamInvite, User
from app.schemas import InviteCreate, InviteOut, InviteAccept, TokenResponse, ApiMessage
from app.services.audit import create_audit_log
from app.services.invites import create_team_invite, accept_team_invite, get_invite_link, get_invite_by_token
from app.services.email import send_invite_email, validate_email_config, get_email_provider_info
from app.config import settings

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/invites", tags=["invites"])


@router.get("/", response_model=list[InviteOut])
def list_invites(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    """List all invites for the current user's organization."""
    return (
        db.query(TeamInvite)
        .filter(TeamInvite.organization_id == current_user.organization_id)
        .order_by(TeamInvite.created_at.desc())
        .all()
    )


@router.get("/check/{token}")
def check_invite(
    token: str,
    db: Session = Depends(get_db),
):
    """
    Check if an invite token is valid.
    Returns invite details without accepting it.
    """
    invite = get_invite_by_token(db, token)
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if invite.is_accepted:
        raise HTTPException(status_code=400, detail="Invite already accepted")
    
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invite has expired")
    
    return {
        "email": invite.email,
        "role": invite.role,
        "organization_id": invite.organization_id,
        "expires_at": invite.expires_at.isoformat(),
        "is_valid": True
    }


@router.post("/", response_model=InviteOut)
def create_invite(
    payload: InviteCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    """
    Create a new team invite.
    Returns the invite object. The invite link is generated with HTTPS.
    """
    # Create the invite (returns tuple of invite and invite_link)
    invite, invite_link = create_team_invite(
        db=db,
        organization_id=current_user.organization_id,
        invited_by_user_id=current_user.id,
        email=payload.email,
        role=payload.role,
    )
    
    # Get organization name for email
    organization_name = current_user.organization.name if current_user.organization else "Web3 Intel"
    
    # Send email with the invite link (in background to not block response)
    background_tasks.add_task(
        send_invite_email,
        email=payload.email,
        invite_link=invite_link,
        role=payload.role,
        invited_by=current_user.full_name,
        organization_name=organization_name,
        expires_hours=72
    )
    
    # Create audit log with the invite link for reference
    create_audit_log(
        db=db,
        organization_id=current_user.organization_id,
        actor_user=current_user,
        action="invite.created",
        target_type="team_invite",
        target_id=str(invite.id),
        message=f"Invited {invite.email} as {invite.role}. Invite link: {invite_link}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    
    logger.info(f"Created invite for {payload.email} with role {payload.role}")
    
    return invite


@router.post("/accept", response_model=TokenResponse)
def accept_invite(
    payload: InviteAccept,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Accept an invite using the token.
    Creates or activates a user account and returns an access token.
    """
    user = accept_team_invite(
        db=db,
        token=payload.token,
        full_name=payload.full_name,
        password=payload.password,
    )

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired invite")
    
    # Send welcome email in background
    if user.is_active:
        background_tasks.add_task(
            send_welcome_email,
            email=user.email,
            user_name=user.full_name,
            organization_name=user.organization.name if user.organization else "Web3 Intel"
        )

    # Generate access token for the user
    token = create_access_token(subject=user.email)
    
    logger.info(f"User {user.email} accepted invite and joined organization {user.organization_id}")
    
    return TokenResponse(access_token=token)


@router.post("/{invite_id}/resend", response_model=ApiMessage)
def resend_invite(
    invite_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    """
    Resend an invite email for an existing invite.
    """
    invite = db.query(TeamInvite).filter(
        TeamInvite.id == invite_id,
        TeamInvite.organization_id == current_user.organization_id
    ).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if invite.is_accepted:
        raise HTTPException(status_code=400, detail="Invite already accepted")
    
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invite has expired")
    
    # Generate fresh invite link (still same token)
    invite_link = get_invite_link(invite.token)
    
    # Get organization name
    organization_name = current_user.organization.name if current_user.organization else "Web3 Intel"
    
    # Resend email in background
    background_tasks.add_task(
        send_invite_email,
        email=invite.email,
        invite_link=invite_link,
        role=invite.role,
        invited_by=current_user.full_name,
        organization_name=organization_name,
        expires_hours=int((invite.expires_at - datetime.utcnow()).total_seconds() / 3600)
    )
    
    create_audit_log(
        db=db,
        organization_id=current_user.organization_id,
        actor_user=current_user,
        action="invite.resend",
        target_type="team_invite",
        target_id=str(invite.id),
        message=f"Resent invite to {invite.email}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    
    logger.info(f"Resent invite to {invite.email}")
    
    return ApiMessage(message="Invite resent successfully")


@router.delete("/{invite_id}", response_model=ApiMessage)
def cancel_invite(
    invite_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    """
    Cancel a pending invite.
    """
    invite = db.query(TeamInvite).filter(
        TeamInvite.id == invite_id,
        TeamInvite.organization_id == current_user.organization_id
    ).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    if invite.is_accepted:
        raise HTTPException(status_code=400, detail="Cannot cancel an accepted invite")
    
    # Store email for audit log before deletion
    invited_email = invite.email
    
    db.delete(invite)
    db.commit()
    
    create_audit_log(
        db=db,
        organization_id=current_user.organization_id,
        actor_user=current_user,
        action="invite.cancelled",
        target_type="team_invite",
        target_id=str(invite_id),
        message=f"Cancelled invite for {invited_email}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    
    logger.info(f"Cancelled invite for {invited_email}")
    
    return ApiMessage(message="Invite cancelled successfully")


@router.get("/config/status")
def get_email_config_status(
    current_user: User = Depends(require_roles("owner", "admin")),
):
    """
    Get email configuration status (admin only).
    Returns whether email service is properly configured.
    """
    config_status = validate_email_config()
    provider_info = get_email_provider_info()
    
    return {
        "email_configured": config_status["configured"],
        "provider": provider_info["provider"],
        "from_email": provider_info["from_email"],
        "frontend_url": provider_info["frontend_url"],
        "missing_config": config_status.get("missing", []),
        "warnings": config_status.get("warnings", [])
    }


@router.get("/stats")
def get_invite_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    """
    Get invite statistics for the organization.
    """
    total_invites = db.query(TeamInvite).filter(
        TeamInvite.organization_id == current_user.organization_id
    ).count()
    
    pending_invites = db.query(TeamInvite).filter(
        TeamInvite.organization_id == current_user.organization_id,
        TeamInvite.is_accepted == False,
        TeamInvite.expires_at > datetime.utcnow()
    ).count()
    
    accepted_invites = db.query(TeamInvite).filter(
        TeamInvite.organization_id == current_user.organization_id,
        TeamInvite.is_accepted == True
    ).count()
    
    expired_invites = db.query(TeamInvite).filter(
        TeamInvite.organization_id == current_user.organization_id,
        TeamInvite.is_accepted == False,
        TeamInvite.expires_at <= datetime.utcnow()
    ).count()
    
    return {
        "total_invites": total_invites,
        "pending_invites": pending_invites,
        "accepted_invites": accepted_invites,
        "expired_invites": expired_invites
    }


# Import send_welcome_email at the top or define it here
from app.services.email import send_welcome_email