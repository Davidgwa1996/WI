# backend/app/api/routes_projects.py
from fastapi import APIRouter, Query
from app.schemas import ProjectOut

router = APIRouter(tags=["projects"])

DEMO_PROJECTS = [
    {"id": 1, "name": "Project Atlas", "sector": "DeFi", "stage": "Seed", "score": 84},
    {"id": 2, "name": "Nova Chain", "sector": "Infrastructure", "stage": "Series A", "score": 91},
    {"id": 3, "name": "Signal Labs", "sector": "AI", "stage": "Pre-Seed", "score": 78},
]

@router.get("/projects", response_model=list[ProjectOut])
def get_projects(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    stage: str | None = None,
    sector: str | None = None,
):
    results = DEMO_PROJECTS

    if stage:
        results = [p for p in results if p["stage"] == stage]

    if sector:
        results = [p for p in results if p["sector"] == sector]

    return results[skip:skip + limit]

@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: int):
    for project in DEMO_PROJECTS:
        if project["id"] == project_id:
            return project
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Project not found")