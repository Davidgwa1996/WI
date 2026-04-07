from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models import User
from app.schemas import UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(User)
        .filter(User.organization_id == current_user.organization_id)
        .order_by(User.created_at.desc())
        .all()
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    role = str(payload.get("role", "")).strip().lower()
    valid_roles = {"owner", "admin", "analyst", "viewer"}

    if role not in valid_roles:
        raise HTTPException(status_code=400, detail="Invalid role.")

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

    user.role = role
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": f"Role updated to {role}", "user_id": user.id, "role": user.role}