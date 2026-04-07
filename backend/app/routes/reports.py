from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models import SavedReport, Project, User
from app.schemas import SavedReportCreate, SavedReportOut

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/", response_model=list[SavedReportOut])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(SavedReport)
        .filter(SavedReport.organization_id == current_user.organization_id)
        .order_by(SavedReport.created_at.desc())
        .all()
    )


@router.post("/", response_model=SavedReportOut)
def create_report(
    payload: SavedReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin", "analyst")),
):
    projects = []
    if payload.project_ids:
        projects = (
            db.query(Project)
            .filter(
                Project.organization_id == current_user.organization_id,
                Project.id.in_(payload.project_ids),
            )
            .all()
        )

    report = SavedReport(
        organization_id=current_user.organization_id,
        title=payload.title,
        summary=payload.summary,
        type=payload.type,
        audience=payload.audience,
        projects_count=len(projects),
        report_data={
            "project_ids": payload.project_ids,
            "project_names": [p.name for p in projects],
        },
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/{report_id}", response_model=SavedReportOut)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = (
        db.query(SavedReport)
        .filter(
            SavedReport.id == report_id,
            SavedReport.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report