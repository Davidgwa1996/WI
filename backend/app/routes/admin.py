from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import User, Organization, TeamInvite
from app.schemas import UserOut, ApiMessage
from app.routes.organizations import is_super_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=List[UserOut])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all users (super admin only)."""
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin required"
        )
    return db.query(User).all()


@router.delete("/users/{user_id}", response_model=ApiMessage)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete any user (super admin only)."""
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin required"
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use account deletion endpoint to delete yourself"
        )
    db.delete(user)
    db.commit()
    logger.info(f"Super admin {current_user.email} deleted user {user.email}")
    return ApiMessage(message=f"User {user.email} deleted")


@router.delete("/invites/{invite_id}", response_model=ApiMessage)
def delete_invite(
    invite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete any invite (super admin only)."""
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin required"
        )
    invite = db.query(TeamInvite).filter(TeamInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found"
        )
    db.delete(invite)
    db.commit()
    logger.info(f"Super admin {current_user.email} deleted invite {invite_id}")
    return ApiMessage(message="Invite deleted")


@router.delete("/my-account", response_model=ApiMessage)
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Permanently delete the current user's account and their entire organization.
    This action is irreversible.
    """
    user_email = current_user.email
    org_id = current_user.organization_id

    try:
        # Delete the user (this may cascade if configured)
        db.delete(current_user)

        # Explicitly delete the associated organization (if any)
        if org_id:
            org = db.query(Organization).filter(Organization.id == org_id).first()
            if org:
                db.delete(org)

        db.commit()
        logger.info(f"User {user_email} permanently deleted their account (org {org_id})")
        return ApiMessage(
            message="Your account and workspace have been permanently deleted"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete account for {user_email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )