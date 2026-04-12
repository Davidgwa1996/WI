from __future__ import annotations

import os

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
from app.schemas import ApiMessage, BulkDeleteRequest, OrganizationOut

router = APIRouter(prefix="/organizations", tags=["organizations"])

# Super admin emails (comma-separated from environment)
ADMIN_EMAILS = {
    email.strip().lower()
    for email in os.getenv("ADMIN_EMAILS", "").split(",")
    if email.strip()
}


def _ensure_db(db: Session):
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )


def is_super_admin(user: User) -> bool:
    """Check if user is a super admin by email."""
    return bool(user and user.email and user.email.lower() in ADMIN_EMAILS)


def can_manage_org(current_user: User, org_id: int) -> bool:
    """Super admin can manage any org; owner can manage only their own."""
    if is_super_admin(current_user):
        return True
    return (
        current_user is not None
        and (current_user.role or "").lower() == "owner"
        and current_user.organization_id == org_id
    )


def _delete_organization_dependencies(db: Session, org_id: int) -> None:
    """
    Delete organization-related records in a safe order to avoid FK violations.
    """

    # Watchlist items first
    db.query(WatchlistItem).filter(
        WatchlistItem.watchlist_id.in_(
            db.query(Watchlist.id).filter(Watchlist.organization_id == org_id)
        )
    ).delete(synchronize_session=False)

    # Watchlists
    db.query(Watchlist).filter(
        Watchlist.organization_id == org_id
    ).delete(synchronize_session=False)

    # Projects
    db.query(Project).filter(
        Project.organization_id == org_id
    ).delete(synchronize_session=False)

    # API keys
    db.query(APIKey).filter(
        APIKey.organization_id == org_id
    ).delete(synchronize_session=False)

    # Audit logs
    db.query(AuditLog).filter(
        AuditLog.organization_id == org_id
    ).delete(synchronize_session=False)

    # Invites
    db.query(TeamInvite).filter(
        TeamInvite.organization_id == org_id
    ).delete(synchronize_session=False)

    # Briefings
    db.query(Briefing).filter(
        Briefing.organization_id == org_id
    ).delete(synchronize_session=False)

    # Saved reports
    db.query(SavedReport).filter(
        SavedReport.organization_id == org_id
    ).delete(synchronize_session=False)

    # Workspace settings
    db.query(WorkspaceSetting).filter(
        WorkspaceSetting.organization_id == org_id
    ).delete(synchronize_session=False)

    # Users last
    db.query(User).filter(
        User.organization_id == org_id
    ).delete(synchronize_session=False)


@router.get("/me", response_model=OrganizationOut)
def get_my_organization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_db(db)

    org = (
        db.query(Organization)
        .filter(Organization.id == current_user.organization_id)
        .first()
    )
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return org


@router.get("/all", response_model=list[OrganizationOut])
def list_all_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Super admins see every organization.
    Normal owners see only their own organization.
    """
    _ensure_db(db)

    if is_super_admin(current_user):
        return db.query(Organization).order_by(Organization.created_at.desc()).all()

    if (current_user.role or "").lower() != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners or super admins can list organizations",
        )

    return (
        db.query(Organization)
        .filter(Organization.id == current_user.organization_id)
        .order_by(Organization.created_at.desc())
        .all()
    )


@router.delete("/bulk-delete", response_model=ApiMessage)
def bulk_delete_organizations(
    payload: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete multiple organizations at once.
    Super admins can delete any organizations.
    Normal owners can only delete their own organization.
    """
    _ensure_db(db)

    org_ids = list(set(payload.org_ids))
    if not org_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No organization IDs provided",
        )

    orgs = db.query(Organization).filter(Organization.id.in_(org_ids)).all()
    if len(orgs) != len(org_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more organizations not found",
        )

    if not is_super_admin(current_user):
        if (current_user.role or "").lower() != "owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owners or super admins can delete organizations",
            )

        for org in orgs:
            if org.id != current_user.organization_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Not authorized to delete organization '{org.name}'",
                )

    try:
        deleted_count = len(orgs)

        for org in orgs:
            _delete_organization_dependencies(db, org.id)
            db.delete(org)

        db.commit()

        return ApiMessage(
            message=f"{deleted_count} organization(s) deleted successfully"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete organizations: {str(e)}",
        )


@router.delete("/{org_id}", response_model=ApiMessage)
def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete one organization.
    Super admins can delete any organization.
    Normal owners can only delete their own organization.
    """
    _ensure_db(db)

    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    if not can_manage_org(current_user, org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this organization",
        )

    try:
        org_name = org.name

        _delete_organization_dependencies(db, org.id)
        db.delete(org)
        db.commit()

        return ApiMessage(message=f"Organization '{org_name}' deleted successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete organization: {str(e)}",
        )