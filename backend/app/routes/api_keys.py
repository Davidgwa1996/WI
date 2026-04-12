from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.database import get_db
from app.models import APIKey, User
from app.schemas import APIKeyCreate, APIKeyCreateResponse, APIKeyOut
from app.services.api_keys import create_api_key, revoke_api_key as revoke_api_key_service
from app.services.audit import create_audit_log

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


def _ensure_db(db: Session):
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )


@router.get("/", response_model=list[APIKeyOut])
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    _ensure_db(db)

    return (
        db.query(APIKey)
        .filter(APIKey.organization_id == current_user.organization_id)
        .order_by(APIKey.created_at.desc())
        .all()
    )


@router.post("/", response_model=APIKeyCreateResponse)
def create_new_api_key(
    payload: APIKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    _ensure_db(db)

    api_key, raw_key = create_api_key(
        db=db,
        organization_id=current_user.organization_id,
        name=payload.name,
    )

    create_audit_log(
        db=db,
        organization_id=current_user.organization_id,
        actor_user=current_user,
        action="api_key.created",
        target_type="api_key",
        target_id=str(api_key.id),
        message=f"Created API key '{api_key.name}'",
    )

    return APIKeyCreateResponse(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        api_key=raw_key,
        created_at=api_key.created_at,
    )


@router.delete("/{api_key_id}")
def revoke_api_key(
    api_key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    _ensure_db(db)

    api_key = (
        db.query(APIKey)
        .filter(
            APIKey.id == api_key_id,
            APIKey.organization_id == current_user.organization_id,
        )
        .first()
    )

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found.",
        )

    if not api_key.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API key is already revoked.",
        )

    api_key_name = api_key.name
    api_key_id_str = str(api_key.id)

    success = revoke_api_key_service(
        db=db,
        api_key_id=api_key_id,
        organization_id=current_user.organization_id,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not revoke API key.",
        )

    create_audit_log(
        db=db,
        organization_id=current_user.organization_id,
        actor_user=current_user,
        action="api_key.revoked",
        target_type="api_key",
        target_id=api_key_id_str,
        message=f"Revoked API key '{api_key_name}'",
    )

    return {
        "success": True,
        "message": f"API key '{api_key_name}' revoked successfully.",
        "api_key_id": int(api_key_id_str),
    }