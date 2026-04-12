from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import User, Organization, TeamInvite
from app.schemas import UserOut, ApiMessage
from app.routes.organizations import is_super_admin

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users", response_model=List[UserOut])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Super admin required")
    return db.query(User).all()

@router.delete("/users/{user_id}", response_model=ApiMessage)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Super admin required")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Use account deletion endpoint to delete yourself")
    db.delete(user)
    db.commit()
    return ApiMessage(message=f"User {user.email} deleted")

@router.delete("/invites/{invite_id}", response_model=ApiMessage)
def delete_invite(
    invite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Super admin required")
    invite = db.query(TeamInvite).filter(TeamInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    db.delete(invite)
    db.commit()
    return ApiMessage(message="Invite deleted")

@router.delete("/my-account", response_model=ApiMessage)
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allow any user to delete their own account and associated organization."""
    org_id = current_user.organization_id
    # Delete user (cascade will delete organization if last user? Actually we need to delete organization explicitly)
    db.delete(current_user)
    if org_id:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if org:
            db.delete(org)
    db.commit()
    return ApiMessage(message="Your account and workspace have been permanently deleted")