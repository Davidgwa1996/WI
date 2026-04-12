from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.database import get_db
from app.models import AuditLog, User
from app.schemas import AuditLogOut

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


def _ensure_db(db: Session):
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )


@router.get("/", response_model=list[AuditLogOut])
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner")),
):
    _ensure_db(db)

    return (
        db.query(AuditLog)
        .filter(AuditLog.organization_id == current_user.organization_id)
        .order_by(AuditLog.created_at.desc())
        .limit(100)
        .all()
    )