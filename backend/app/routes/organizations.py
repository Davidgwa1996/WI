from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import os
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import Organization, User
from app.schemas import OrganizationOut, ApiMessage, BulkDeleteRequest

router = APIRouter(prefix="/organizations", tags=["organizations"])

# Super admin emails (comma-separated from environment)
ADMIN_EMAILS = {email.strip().lower() for email in os.getenv("ADMIN_EMAILS", "").split(",") if email.strip()}

def is_super_admin(user: User) -> bool:
    """Check if user is a super admin (by email)."""
    return user.email.lower() in ADMIN_EMAILS


@router.get("/me", response_model=OrganizationOut)
def get_my_organization(current_user: User = Depends(get_current_user)):
    return current_user.organization


@router.get("/all", response_model=list[OrganizationOut])
def list_all_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Super admins can see all organizations; normal owners see only their own."""
    if is_super_admin(current_user):
        return db.query(Organization).order_by(Organization.created_at.desc()).all()
    else:
        if current_user.role != "owner":
            raise HTTPException(status_code=403, detail="Only owners can list organizations")
        return db.query(Organization).filter(Organization.id == current_user.organization_id).all()


@router.delete("/{org_id}", response_model=ApiMessage)
def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Super admin can delete any organization
    if not is_super_admin(current_user):
        if current_user.organization_id != org_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this organization")
        if current_user.role != "owner":
            raise HTTPException(status_code=403, detail="Only organization owners can delete")

    org_name = org.name
    db.delete(org)
    db.commit()
    return ApiMessage(message=f"Organization '{org_name}' deleted successfully")


@router.delete("/bulk-delete", response_model=ApiMessage)
def bulk_delete_organizations(
    payload: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_ids = payload.org_ids
    if not org_ids:
        raise HTTPException(status_code=400, detail="No organization IDs provided")

    orgs = db.query(Organization).filter(Organization.id.in_(org_ids)).all()
    if len(orgs) != len(org_ids):
        raise HTTPException(status_code=404, detail="One or more organizations not found")

    # Super admin can delete any set of orgs
    if not is_super_admin(current_user):
        for org in orgs:
            if current_user.organization_id != org.id:
                raise HTTPException(status_code=403, detail=f"Not authorized to delete organization '{org.name}'")
            if current_user.role != "owner":
                raise HTTPException(status_code=403, detail="Only organization owners can delete")

    for org in orgs:
        db.delete(org)
    db.commit()
    return ApiMessage(message=f"{len(orgs)} organization(s) deleted successfully")