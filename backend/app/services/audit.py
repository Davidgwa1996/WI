from sqlalchemy.orm import Session
from app.models import AuditLog, User


def create_audit_log(
    db: Session,
    organization_id: int,
    action: str,
    target_type: str,
    message: str,
    actor_user: User | None = None,
    target_id: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    metadata_json: dict | None = None,
) -> AuditLog:
    log = AuditLog(
        organization_id=organization_id,
        actor_user_id=actor_user.id if actor_user else None,
        action=action,
        target_type=target_type,
        target_id=target_id,
        message=message,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata_json=metadata_json or {},
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log