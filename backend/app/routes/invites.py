from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.auth.jwt_handler import create_access_token
from app.database import get_db
from app.models import TeamInvite, User
from app.schemas import InviteCreate, InviteOut, InviteAccept, TokenResponse
from app.services.audit import create_audit_log
from app.services.invites import create_team_invite, accept_team_invite

router = APIRouter(prefix="/invites", tags=["invites"])


@router.get("/", response_model=list[InviteOut])
def list_invites(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    return (
        db.query(TeamInvite)
        .filter(TeamInvite.organization_id == current_user.organization_id)
        .order_by(TeamInvite.created_at.desc())
        .all()
    )


@router.post("/", response_model=InviteOut)
def create_invite(
    payload: InviteCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    invite = create_team_invite(
        db=db,
        organization_id=current_user.organization_id,
        invited_by_user_id=current_user.id,
        email=payload.email,
        role=payload.role,
    )

    create_audit_log(
        db=db,
        organization_id=current_user.organization_id,
        actor_user=current_user,
        action="invite.created",
        target_type="team_invite",
        target_id=str(invite.id),
        message=f"Invited {invite.email} as {invite.role}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return invite


@router.post("/accept", response_model=TokenResponse)
def accept_invite(
    payload: InviteAccept,
    db: Session = Depends(get_db),
):
    user = accept_team_invite(
        db=db,
        token=payload.token,
        full_name=payload.full_name,
        password=payload.password,
    )

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired invite")

    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token)