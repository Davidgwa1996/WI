from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models import (
    AuditLog,
    Organization,
    TeamInvite,
    User,
    Watchlist,
    WatchlistItem,
)
from app.schemas import UserOut

router = APIRouter(prefix="/users", tags=["users"])


def _ensure_db(db: Session):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")


def _owner_count(db: Session, organization_id: int) -> int:
    return (
        db.query(User)
        .filter(
            User.organization_id == organization_id,
            User.role == "owner",
        )
        .count()
    )


def _organization_user_count(db: Session, organization_id: int) -> int:
    return (
        db.query(User)
        .filter(User.organization_id == organization_id)
        .count()
    )


def _pick_new_owner(
    db: Session,
    organization_id: int,
    excluding_user_id: int | None = None,
) -> User | None:
    base_query = db.query(User).filter(User.organization_id == organization_id)

    if excluding_user_id is not None:
        base_query = base_query.filter(User.id != excluding_user_id)

    admin_user = (
        base_query.filter(User.role == "admin")
        .order_by(User.created_at.asc())
        .first()
    )
    if admin_user:
        return admin_user

    analyst_user = (
        db.query(User)
        .filter(
            User.organization_id == organization_id,
            User.role == "analyst",
            User.id != excluding_user_id if excluding_user_id is not None else True,
        )
        .order_by(User.created_at.asc())
        .first()
    )
    if analyst_user:
        return analyst_user

    viewer_user = (
        db.query(User)
        .filter(
            User.organization_id == organization_id,
            User.role == "viewer",
            User.id != excluding_user_id if excluding_user_id is not None else True,
        )
        .order_by(User.created_at.asc())
        .first()
    )
    if viewer_user:
        return viewer_user

    fallback_user = base_query.order_by(User.created_at.asc()).first()
    return fallback_user


def _clear_user_references(db: Session, user_id: int) -> None:
    """
    Clear nullable foreign key references to this user before deleting.
    This avoids FK violations when deleting users.
    """
    db.query(TeamInvite).filter(
        TeamInvite.invited_by_user_id == user_id
    ).update({TeamInvite.invited_by_user_id: None}, synchronize_session=False)

    db.query(AuditLog).filter(
        AuditLog.actor_user_id == user_id
    ).update({AuditLog.actor_user_id: None}, synchronize_session=False)

    db.query(Watchlist).filter(
        Watchlist.created_by == user_id
    ).update({Watchlist.created_by: None}, synchronize_session=False)

    db.query(WatchlistItem).filter(
        WatchlistItem.added_by == user_id
    ).update({WatchlistItem.added_by: None}, synchronize_session=False)


@router.get("/", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_db(db)

    return (
        db.query(User)
        .filter(User.organization_id == current_user.organization_id)
        .order_by(User.created_at.desc())
        .all()
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_db(db)

    full_name = payload.get("full_name")
    if full_name is not None:
        current_user.full_name = str(full_name).strip()

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    _ensure_db(db)

    role = str(payload.get("role", "")).strip().lower()
    valid_roles = {"owner", "admin", "analyst", "viewer"}

    if role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Allowed roles: owner, admin, analyst, viewer.",
        )

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if current_user.role == "admin" and role == "owner":
        raise HTTPException(
            status_code=403,
            detail="Only an owner can assign owner role.",
        )

    if user.role == "owner" and role != "owner":
        owner_count = _owner_count(db, current_user.organization_id)
        if owner_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot change the role of the last owner. Assign another owner first.",
            )

    user.role = role
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": f"Role updated to {role}",
        "user_id": user.id,
        "role": user.role,
    }


@router.delete("/me")
def delete_my_account(
    payload: dict | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete the current signed-in account.

    Final behavior:
    - If user is the only user in the org -> delete user and organization.
    - If user is last owner but org has others -> transfer ownership first.
    - Otherwise -> delete only the current user.
    """
    _ensure_db(db)

    payload = payload or {}
    confirm = str(payload.get("confirm", "")).strip().upper()

    if confirm != "DELETE":
        raise HTTPException(
            status_code=400,
            detail='Please send {"confirm": "DELETE"} to permanently delete this account.',
        )

    organization_id = current_user.organization_id
    email = current_user.email
    user_id = current_user.id
    user_role = (current_user.role or "").strip().lower()

    total_users = _organization_user_count(db, organization_id)
    owner_count = _owner_count(db, organization_id)

    try:
        if total_users == 1:
            org = db.query(Organization).filter(Organization.id == organization_id).first()

            _clear_user_references(db, current_user.id)
            db.delete(current_user)

            if org:
                db.delete(org)

            db.commit()

            return {
                "success": True,
                "message": "Account and organization deleted successfully.",
                "deleted_user_id": user_id,
                "deleted_email": email,
                "organization_deleted": True,
                "ownership_transferred": False,
            }

        promoted_user = None

        if user_role == "owner" and owner_count <= 1:
            promoted_user = _pick_new_owner(
                db=db,
                organization_id=organization_id,
                excluding_user_id=user_id,
            )

            if not promoted_user:
                raise HTTPException(
                    status_code=400,
                    detail="Could not find another user to transfer ownership to.",
                )

            promoted_user.role = "owner"
            db.add(promoted_user)

        _clear_user_references(db, current_user.id)
        db.delete(current_user)
        db.commit()

        return {
            "success": True,
            "message": "Account deleted successfully.",
            "deleted_user_id": user_id,
            "deleted_email": email,
            "organization_deleted": False,
            "ownership_transferred": promoted_user is not None,
            "new_owner_user_id": promoted_user.id if promoted_user else None,
            "new_owner_email": promoted_user.email if promoted_user else None,
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete account: {str(e)}",
        )


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    _ensure_db(db)

    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Use DELETE /users/me to delete your own account.",
        )

    if current_user.role == "admin" and user.role == "owner":
        raise HTTPException(
            status_code=403,
            detail="Admins cannot delete owners.",
        )

    if user.role == "owner":
        owner_count = _owner_count(db, current_user.organization_id)
        if owner_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the last owner from this endpoint. Reassign ownership first, or the owner can delete their own account.",
            )

    deleted_email = user.email
    deleted_user_id = user.id

    try:
        _clear_user_references(db, user.id)
        db.delete(user)
        db.commit()

        return {
            "success": True,
            "message": "User deleted successfully.",
            "deleted_user_id": deleted_user_id,
            "deleted_email": deleted_email,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete user: {str(e)}",
        )