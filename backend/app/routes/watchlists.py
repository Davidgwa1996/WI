from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models import Watchlist, WatchlistItem, Project, User
from app.schemas import WatchlistCreate, WatchlistOut, WatchlistItemCreate, ApiMessage
from app.services.audit import create_audit_log

router = APIRouter(prefix="/watchlists", tags=["watchlists"])


@router.get("/", response_model=list[WatchlistOut])
def list_watchlists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Watchlist)
        .filter(Watchlist.organization_id == current_user.organization_id)
        .order_by(Watchlist.created_at.desc())
        .all()
    )


@router.post("/", response_model=WatchlistOut)
def create_watchlist(
    payload: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin", "analyst")),
):
    watchlist = Watchlist(
        organization_id=current_user.organization_id,
        name=payload.name,
        description=payload.description,
        is_default=payload.is_default,
    )
    db.add(watchlist)
    db.commit()
    db.refresh(watchlist)

    create_audit_log(
        db=db,
        organization_id=current_user.organization_id,
        actor_user=current_user,
        action="watchlist.created",
        target_type="watchlist",
        target_id=str(watchlist.id),
        message=f"Created watchlist '{watchlist.name}'",
    )
    return watchlist


@router.post("/{watchlist_id}/items", response_model=ApiMessage)
def add_watchlist_item(
    watchlist_id: int,
    payload: WatchlistItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin", "analyst")),
):
    watchlist = (
        db.query(Watchlist)
        .filter(
            Watchlist.id == watchlist_id,
            Watchlist.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    project = (
        db.query(Project)
        .filter(
            Project.id == payload.project_id,
            Project.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    existing = (
        db.query(WatchlistItem)
        .filter(
            WatchlistItem.watchlist_id == watchlist.id,
            WatchlistItem.project_id == project.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Project already in watchlist")

    item = WatchlistItem(
        watchlist_id=watchlist.id,
        project_id=project.id,
        note=payload.note,
        tag=payload.tag,
    )
    db.add(item)
    db.commit()

    return ApiMessage(message="Project added to watchlist")


@router.delete("/{watchlist_id}/items/{project_id}", response_model=ApiMessage)
def remove_watchlist_item(
    watchlist_id: int,
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin", "analyst")),
):
    item = (
        db.query(WatchlistItem)
        .join(Watchlist, Watchlist.id == WatchlistItem.watchlist_id)
        .filter(
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.project_id == project_id,
            Watchlist.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")

    db.delete(item)
    db.commit()

    return ApiMessage(message="Project removed from watchlist")