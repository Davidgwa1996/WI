from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.auth.jwt_handler import create_access_token
from app.database import get_db
from app.models import TeamInvite, User
from app.schemas import ApiMessage, InviteAccept, InviteCreate, TokenResponse
from app.services.audit import create_audit_log
from app.services.email import (
    get_email_provider_info,
    send_invite_email,
    send_welcome_email,
    validate_email_config,
)
from app.services.invites import (
    accept_team_invite,
    create_team_invite,
    get_invite_by_token,
    get_invite_link,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/invites", tags=["invites"])


def _ensure_db(db: Session):
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )


# ============================================
# HEALTH
# ============================================
@router.get("/health")
async def invites_health():
    return {"status": "invites router is alive"}


# ============================================
# CORS PREFLIGHT
# ============================================
@router.options("/{path:path}")
async def preflight_handler() -> dict:
    return {}


# ============================================
# LIST INVITES
# ============================================
@router.get("")
@router.get("/")
def list_invites(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    """
    List all invites for the current user's organization.
    """
    _ensure_db(db)

    invites = (
        db.query(TeamInvite)
        .filter(TeamInvite.organization_id == current_user.organization_id)
        .order_by(TeamInvite.created_at.desc())
        .all()
    )

    results = []
    for invite in invites:
        results.append(
            {
                "id": invite.id,
                "organization_id": invite.organization_id,
                "email": invite.email,
                "role": invite.role,
                "token": invite.token,
                "is_accepted": invite.is_accepted,
                "expires_at": invite.expires_at,
                "created_at": invite.created_at,
                "updated_at": invite.updated_at,
                "invite_link": get_invite_link(invite.token),
            }
        )

    return results


# ============================================
# CHECK INVITE TOKEN
# ============================================
@router.get("/check/{token}")
def check_invite(
    token: str,
    db: Session = Depends(get_db),
):
    """
    Check whether an invite token is valid before account creation.
    """
    _ensure_db(db)

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
        "is_valid": True,
        "invite_link": get_invite_link(invite.token),
    }


# ============================================
# CREATE INVITE
# ============================================
@router.post("")
@router.post("/")
def create_invite(
    payload: InviteCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    """
    Create a new invite for analyst/admin/viewer/owner based on current permissions.
    This is the approved-access path for non-owner users after workspace creation.
    """
    _ensure_db(db)

    requested_role = (payload.role or "viewer").strip().lower()

    valid_roles = {"owner", "admin", "analyst", "viewer"}
    if requested_role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Allowed roles: owner, admin, analyst, viewer.",
        )

    # Admins should not be able to invite owners
    if current_user.role == "admin" and requested_role == "owner":
        raise HTTPException(
            status_code=403,
            detail="Only owners can invite another owner.",
        )

    invite, invite_link = create_team_invite(
        db=db,
        organization_id=current_user.organization_id,
        invited_by_user_id=current_user.id,
        email=payload.email,
        role=requested_role,
    )

    organization_name = (
        current_user.organization.name
        if getattr(current_user, "organization", None)
        else "Web3 Intel"
    )

    background_tasks.add_task(
        send_invite_email,
        email=payload.email,
        invite_link=invite_link,
        role=requested_role,
        invited_by=current_user.full_name,
        organization_name=organization_name,
        expires_hours=72,
    )

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

    logger.info(
        "Created invite for %s with role %s in org %s",
        payload.email,
        requested_role,
        current_user.organization_id,
    )

    return {
        "id": invite.id,
        "organization_id": invite.organization_id,
        "email": invite.email,
        "role": invite.role,
        "token": invite.token,
        "is_accepted": invite.is_accepted,
        "expires_at": invite.expires_at,
        "created_at": invite.created_at,
        "updated_at": invite.updated_at,
        "invite_link": invite_link,
    }


# ============================================
# ACCEPT INVITE
# ============================================
@router.post("/accept", response_model=TokenResponse)
def accept_invite(
    payload: InviteAccept,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Accept an approved invite and create/activate the invited user.
    Returns an access token for immediate sign-in.
    """
    _ensure_db(db)

    invite = get_invite_by_token(db, payload.token)
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid invite token")

    if invite.is_accepted:
        raise HTTPException(status_code=400, detail="Invite already accepted")

    if invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invite has expired")

    user = accept_team_invite(
        db=db,
        token=payload.token,
        full_name=payload.full_name,
        password=payload.password,
    )

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired invite")

    if user.is_active:
        organization_name = (
            user.organization.name if getattr(user, "organization", None) else "Web3 Intel"
        )
        background_tasks.add_task(
            send_welcome_email,
            email=user.email,
            user_name=user.full_name,
            organization_name=organization_name,
        )

    token = create_access_token(subject=user.email)

    logger.info(
        "User %s accepted invite and joined organization %s as %s",
        user.email,
        user.organization_id,
        user.role,
    )

    return TokenResponse(access_token=token)


# ============================================
# RESEND INVITE
# ============================================
@router.post("/{invite_id}/resend", response_model=ApiMessage)
def resend_invite(
    invite_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    """
    Resend an existing pending invite.
    """
    _ensure_db(db)

    invite = (
        db.query(TeamInvite)
        .filter(
            TeamInvite.id == invite_id,
            TeamInvite.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    if invite.is_accepted:
        raise HTTPException(status_code=400, detail="Invite already accepted")

    if invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invite has expired")

    invite_link = get_invite_link(invite.token)

    organization_name = (
        current_user.organization.name
        if getattr(current_user, "organization", None)
        else "Web3 Intel"
    )

    remaining_seconds = (invite.expires_at - datetime.utcnow()).total_seconds()
    expires_hours = max(1, int(remaining_seconds / 3600))

    background_tasks.add_task(
        send_invite_email,
        email=invite.email,
        invite_link=invite_link,
        role=invite.role,
        invited_by=current_user.full_name,
        organization_name=organization_name,
        expires_hours=expires_hours,
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

    logger.info("Resent invite %s to %s", invite.id, invite.email)

    return ApiMessage(message="Invite resent successfully")


# ============================================
# CANCEL INVITE
# ============================================
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
    _ensure_db(db)

    invite = (
        db.query(TeamInvite)
        .filter(
            TeamInvite.id == invite_id,
            TeamInvite.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    if invite.is_accepted:
        raise HTTPException(status_code=400, detail="Cannot cancel an accepted invite")

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

    logger.info("Cancelled invite %s for %s", invite_id, invited_email)

    return ApiMessage(message="Invite cancelled successfully")


# ============================================
# EMAIL CONFIG STATUS
# ============================================
@router.get("/config/status")
def get_email_config_status(
    current_user: User = Depends(require_roles("owner", "admin")),
):
    """
    Return current email configuration status.
    """
    config_status = validate_email_config()
    provider_info = get_email_provider_info()

    return {
        "email_configured": config_status["configured"],
        "provider": provider_info["provider"],
        "from_email": provider_info["from_email"],
        "frontend_url": provider_info["frontend_url"],
        "missing_config": config_status.get("missing", []),
        "warnings": config_status.get("warnings", []),
    }


# ============================================
# INVITE STATS
# ============================================
@router.get("/stats")
def get_invite_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    """
    Invite statistics for the current organization.
    """
    _ensure_db(db)

    total_invites = (
        db.query(TeamInvite)
        .filter(TeamInvite.organization_id == current_user.organization_id)
        .count()
    )

    pending_invites = (
        db.query(TeamInvite)
        .filter(
            TeamInvite.organization_id == current_user.organization_id,
            TeamInvite.is_accepted.is_(False),
            TeamInvite.expires_at > datetime.utcnow(),
        )
        .count()
    )

    accepted_invites = (
        db.query(TeamInvite)
        .filter(
            TeamInvite.organization_id == current_user.organization_id,
            TeamInvite.is_accepted.is_(True),
        )
        .count()
    )

    expired_invites = (
        db.query(TeamInvite)
        .filter(
            TeamInvite.organization_id == current_user.organization_id,
            TeamInvite.is_accepted.is_(False),
            TeamInvite.expires_at <= datetime.utcnow(),
        )
        .count()
    )

    return {
        "total_invites": total_invites,
        "pending_invites": pending_invites,
        "accepted_invites": accepted_invites,
        "expired_invites": expired_invites,
    }


# ============================================
# SPECIFIC OPTIONS HANDLERS
# ============================================
@router.options("/")
@router.options("/check/{token}")
@router.options("/accept")
@router.options("/{invite_id}/resend")
@router.options("/{invite_id}")
@router.options("/config/status")
@router.options("/stats")
async def options_handler() -> dict:
    return {}