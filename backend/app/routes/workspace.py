from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models import WorkspaceSetting, User
from app.schemas import WorkspaceSettingOut, WorkspaceSettingUpdate
from app.services.audit import create_audit_log

router = APIRouter(prefix="/workspace", tags=["workspace"])


@router.get("/settings", response_model=WorkspaceSettingOut)
def get_workspace_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    settings_row = (
        db.query(WorkspaceSetting)
        .filter(WorkspaceSetting.organization_id == current_user.organization_id)
        .first()
    )

    if not settings_row:
        settings_row = WorkspaceSetting(organization_id=current_user.organization_id)
        db.add(settings_row)
        db.commit()
        db.refresh(settings_row)

    return settings_row


@router.put("/settings", response_model=WorkspaceSettingOut)
def update_workspace_settings(
    payload: WorkspaceSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    settings_row = (
        db.query(WorkspaceSetting)
        .filter(WorkspaceSetting.organization_id == current_user.organization_id)
        .first()
    )

    if not settings_row:
        settings_row = WorkspaceSetting(organization_id=current_user.organization_id)
        db.add(settings_row)
        db.flush()

    settings_row.default_alerts_enabled = payload.default_alerts_enabled
    settings_row.weekly_report_enabled = payload.weekly_report_enabled
    settings_row.branding_primary_color = payload.branding_primary_color
    settings_row.custom_domain = payload.custom_domain
    settings_row.report_logo_url = payload.report_logo_url

    db.add(settings_row)
    db.commit()
    db.refresh(settings_row)

    create_audit_log(
        db=db,
        organization_id=current_user.organization_id,
        actor_user=current_user,
        action="workspace.settings_updated",
        target_type="workspace_settings",
        target_id=str(settings_row.id),
        message="Workspace settings updated",
    )

    return settings_row