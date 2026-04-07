from __future__ import annotations

import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import Project, SavedReport, User

router = APIRouter(prefix="/exports", tags=["exports"])


@router.get("/projects.csv")
def export_projects_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = (
        db.query(Project)
        .filter(Project.organization_id == current_user.organization_id)
        .order_by(Project.overall_score.desc())
        .all()
    )

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "id",
            "name",
            "sector",
            "stage",
            "overall_score",
            "llm_score",
            "sentiment_score",
            "momentum_score",
            "funding_prediction",
            "market_cap",
            "tvl",
        ]
    )

    for p in projects:
        writer.writerow(
            [
                p.id,
                p.name,
                p.sector,
                p.stage,
                p.overall_score,
                p.llm_score,
                p.sentiment_score,
                p.momentum_score,
                p.funding_prediction,
                p.market_cap,
                p.tvl,
            ]
        )

    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=projects_export.csv"},
    )


@router.get("/report.pdf")
def export_report_pdf(
    report_id: int = Query(...),
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

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    y = height - 50
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(50, y, "Web3 Intel Platform Report")

    y -= 35
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, y, report.title)

    y -= 25
    pdf.setFont("Helvetica", 11)
    pdf.drawString(50, y, f"Type: {report.type}")
    y -= 18
    pdf.drawString(50, y, f"Audience: {report.audience}")
    y -= 18
    pdf.drawString(50, y, f"Created: {report.created_at.strftime('%Y-%m-%d %H:%M')}")
    y -= 30

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(50, y, "Summary")
    y -= 18

    pdf.setFont("Helvetica", 10)
    summary = report.summary or "No summary available."
    for line in summary.split("\n"):
        pdf.drawString(50, y, line[:100])
        y -= 14

    y -= 10
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(50, y, "Report Data")
    y -= 18

    pdf.setFont("Helvetica", 10)
    for key, value in (report.report_data or {}).items():
        text = f"{key}: {value}"
        pdf.drawString(50, y, text[:110])
        y -= 14
        if y < 60:
            pdf.showPage()
            y = height - 50
            pdf.setFont("Helvetica", 10)

    pdf.showPage()
    pdf.save()
    buffer.seek(0)

    filename = f"report_{report.id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )