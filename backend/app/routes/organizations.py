from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import Organization, User
from app.schemas import OrganizationOut, ApiMessage

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/me", response_model=OrganizationOut)
def get_my_organization(current_user: User = Depends(get_current_user)):
    """Get the current user's organization."""
    return current_user.organization


@router.get("/all", response_model=list[OrganizationOut])
def list_all_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all organizations in the system. Only accessible by users with role 'owner'.
    This allows you to see all test workspaces you've created (even with different emails)
    and delete them from the frontend.
    """
    if current_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owners can list all organizations"
        )
    return db.query(Organization).order_by(Organization.created_at.desc()).all()


@router.delete("/{org_id}", response_model=ApiMessage)
def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete an organization. Only owners can delete their own organization.
    This will cascade delete all users, projects, invites, watchlists, etc.
    """
    # Verify the organization exists
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Ensure the current user is the owner of this organization
    if current_user.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this organization")

    # Additional safety: only users with role 'owner' can delete (already enforced by organization match)
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Only organization owners can delete the organization")

    org_name = org.name
    db.delete(org)
    db.commit()

    return ApiMessage(message=f"Organization '{org_name}' deleted successfully")


@router.delete("/bulk-delete", response_model=ApiMessage)
def bulk_delete_organizations(
    org_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete multiple organizations at once. Only owners can delete organizations they own.
    """
    if not org_ids:
        raise HTTPException(status_code=400, detail="No organization IDs provided")

    # Fetch all organizations
    orgs = db.query(Organization).filter(Organization.id.in_(org_ids)).all()
    if len(orgs) != len(org_ids):
        raise HTTPException(status_code=404, detail="One or more organizations not found")

    # Verify the current user owns all selected organizations
    for org in orgs:
        if current_user.organization_id != org.id:
            raise HTTPException(
                status_code=403,
                detail=f"Not authorized to delete organization '{org.name}'"
            )
        if current_user.role != "owner":
            raise HTTPException(status_code=403, detail="Only organization owners can delete organizations")

    # Delete all
    for org in orgs:
        db.delete(org)
    db.commit()

    return ApiMessage(message=f"{len(orgs)} organization(s) deleted successfully")