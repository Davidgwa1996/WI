from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import Project, User
from app.services.google_search import google_search

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/intel")
def search_intel(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = (
        db.query(Project)
        .filter(
            Project.organization_id == current_user.organization_id,
            or_(
                Project.name.ilike(f"%{q}%"),
                Project.description.ilike(f"%{q}%"),
                Project.sector.ilike(f"%{q}%"),
                Project.stage.ilike(f"%{q}%"),
            ),
        )
        .order_by(Project.overall_score.desc())
        .limit(20)
        .all()
    )

    local_results = [
        {
            "id": p.id,
            "title": p.name,
            "description": p.description,
            "sector": p.sector,
            "stage": p.stage,
            "overall_score": p.overall_score,
            "source": "workspace",
        }
        for p in projects
    ]

    return {"query": q, "results": local_results}


@router.get("/google")
async def search_google_endpoint(
    q: str = Query(..., min_length=2),
    current_user: User = Depends(get_current_user),
):
    results = await google_search(q)
    return {"query": q, "results": results}