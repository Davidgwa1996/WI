from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import (
    APIKey,
    AuditLog,
    Briefing,
    Organization,
    Project,
    SavedReport,
    TeamInvite,
    User,
    Watchlist,
    WatchlistItem,
    WorkspaceSetting,
)
from app.schemas import ApiMessage, UserOut
from app.routes.organizations import is_super_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=List[UserOut])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all users (super admin only)."""
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin required",
        )

    return db.query(User).order_by(User.created_at.desc()).all()


@router.delete("/users/{user_id}", response_model=ApiMessage)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete any user (super admin only)."""
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin required",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use the account deletion endpoint to delete yourself",
        )

    try:
        user_email = user.email

        # Clear references pointing to this user first
        db.query(TeamInvite).filter(
            TeamInvite.invited_by_user_id == user.id
        ).update({TeamInvite.invited_by_user_id: None}, synchronize_session=False)

        db.query(AuditLog).filter(
            AuditLog.actor_user_id == user.id
        ).update({AuditLog.actor_user_id: None}, synchronize_session=False)

        db.query(Watchlist).filter(
            Watchlist.created_by == user.id
        ).update({Watchlist.created_by: None}, synchronize_session=False)

        db.query(WatchlistItem).filter(
            WatchlistItem.added_by == user.id
        ).update({WatchlistItem.added_by: None}, synchronize_session=False)

        db.delete(user)
        db.commit()

        logger.info("Super admin %s deleted user %s", current_user.email, user_email)
        return ApiMessage(message=f"User {user_email} deleted successfully")

    except Exception as e:
        db.rollback()
        logger.error("Failed to delete user %s: %s", user_id, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user",
        )


@router.delete("/invites/{invite_id}", response_model=ApiMessage)
def delete_invite(
    invite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete any invite (super admin only)."""
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin required",
        )

    invite = db.query(TeamInvite).filter(TeamInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found",
        )

    try:
        db.delete(invite)
        db.commit()
        logger.info("Super admin %s deleted invite %s", current_user.email, invite_id)
        return ApiMessage(message="Invite deleted successfully")

    except Exception as e:
        db.rollback()
        logger.error("Failed to delete invite %s: %s", invite_id, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete invite",
        )


@router.delete("/my-account", response_model=ApiMessage)
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Permanently delete the current user's account.

    Final behavior:
    - If current user is owner: delete the full organization/workspace and all dependent data.
    - If current user is not owner: delete only that user account safely.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    user_id = current_user.id
    user_email = current_user.email
    org_id = current_user.organization_id
    user_role = (current_user.role or "").strip().lower()

    try:
        # Refresh current user from DB
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # OWNER: delete full organization and everything inside it
        if user_role == "owner":
            org = db.query(Organization).filter(Organization.id == org_id).first()
            if not org:
                # fallback: if org is missing, just delete the user safely
                db.query(TeamInvite).filter(
                    TeamInvite.invited_by_user_id == user.id
                ).update({TeamInvite.invited_by_user_id: None}, synchronize_session=False)

                db.query(AuditLog).filter(
                    AuditLog.actor_user_id == user.id
                ).update({AuditLog.actor_user_id: None}, synchronize_session=False)

                db.query(Watchlist).filter(
                    Watchlist.created_by == user.id
                ).update({Watchlist.created_by: None}, synchronize_session=False)

                db.query(WatchlistItem).filter(
                    WatchlistItem.added_by == user.id
                ).update({WatchlistItem.added_by: None}, synchronize_session=False)

                db.delete(user)
                db.commit()

                logger.info(
                    "Owner %s deleted their account (organization already missing)",
                    user_email,
                )
                return ApiMessage(message="Your account has been permanently deleted")

            # Delete in dependency-safe order to avoid FK violations
            db.query(WatchlistItem).filter(
                WatchlistItem.watchlist_id.in_(
                    db.query(Watchlist.id).filter(Watchlist.organization_id == org.id)
                )
            ).delete(synchronize_session=False)

            db.query(Watchlist).filter(
                Watchlist.organization_id == org.id
            ).delete(synchronize_session=False)

            db.query(Project).filter(
                Project.organization_id == org.id
            ).delete(synchronize_session=False)

            db.query(APIKey).filter(
                APIKey.organization_id == org.id
            ).delete(synchronize_session=False)

            db.query(AuditLog).filter(
                AuditLog.organization_id == org.id
            ).delete(synchronize_session=False)

            db.query(TeamInvite).filter(
                TeamInvite.organization_id == org.id
            ).delete(synchronize_session=False)

            db.query(Briefing).filter(
                Briefing.organization_id == org.id
            ).delete(synchronize_session=False)

            db.query(SavedReport).filter(
                SavedReport.organization_id == org.id
            ).delete(synchronize_session=False)

            db.query(WorkspaceSetting).filter(
                WorkspaceSetting.organization_id == org.id
            ).delete(synchronize_session=False)

            db.query(User).filter(
                User.organization_id == org.id
            ).delete(synchronize_session=False)

            db.delete(org)
            db.commit()

            logger.info(
                "Owner %s deleted full organization %s and all related data",
                user_email,
                org_id,
            )
            return ApiMessage(
                message="Your account and entire workspace have been permanently deleted"
            )

        # NON-OWNER: delete only own account safely
        db.query(TeamInvite).filter(
            TeamInvite.invited_by_user_id == user.id
        ).update({TeamInvite.invited_by_user_id: None}, synchronize_session=False)

        db.query(AuditLog).filter(
            AuditLog.actor_user_id == user.id
        ).update({AuditLog.actor_user_id: None}, synchronize_session=False)

        db.query(Watchlist).filter(
            Watchlist.created_by == user.id
        ).update({Watchlist.created_by: None}, synchronize_session=False)

        db.query(WatchlistItem).filter(
            WatchlistItem.added_by == user.id
        ).update({WatchlistItem.added_by: None}, synchronize_session=False)

        db.delete(user)
        db.commit()

        logger.info("User %s deleted their own account", user_email)
        return ApiMessage(message="Your account has been permanently deleted")

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        logger.error("Failed to delete account for %s: %s", user_email, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account",
        )