from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles, get_current_user
from app.database import get_db
from app.models import APIKey, User
from app.schemas import APIKeyCreate, APIKeyCreateResponse, APIKeyOut
from app.services.api_keys import create_api_key
from app.services.audit import create_audit_log

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


@router.get("/", response_model=list[APIKeyOut])
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(APIKey)
        .filter(APIKey.organization_id == current_user.organization_id)
        .all()
    )


@router.post("/", response_model=APIKeyCreateResponse)
def create_new_api_key(
    payload: APIKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
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
        api_key=raw_key,
        key_prefix=api_key.key_prefix,
        message="Store this key securely. It will not be shown again.",
    )