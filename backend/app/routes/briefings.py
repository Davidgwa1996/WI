from __future__ import annotations

import smtplib
from email.mime.text import MIMEText

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.config import settings
from app.database import get_db
from app.models import Briefing, User

router = APIRouter(prefix="/briefings", tags=["briefings"])


@router.get("/")
def list_briefings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    briefings = (
        db.query(Briefing)
        .filter(
            Briefing.organization_id == current_user.organization_id,
            Briefing.is_published.is_(True),
        )
        .order_by(Briefing.created_at.desc())
        .all()
    )
    return briefings


@router.post("/send")
def send_latest_briefing_email(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin", "analyst")),
):
    briefing = (
        db.query(Briefing)
        .filter(
            Briefing.organization_id == current_user.organization_id,
            Briefing.is_published.is_(True),
        )
        .order_by(Briefing.created_at.desc())
        .first()
    )
    if not briefing:
        raise HTTPException(status_code=404, detail="No published briefing found.")

    smtp_host = getattr(settings, "SMTP_HOST", None)
    smtp_port = int(getattr(settings, "SMTP_PORT", 587))
    smtp_user = getattr(settings, "SMTP_USER", None)
    smtp_password = getattr(settings, "SMTP_PASSWORD", None)
    smtp_from = getattr(settings, "SMTP_FROM_EMAIL", None) or smtp_user

    if not smtp_host or not smtp_user or not smtp_password or not smtp_from:
        raise HTTPException(status_code=500, detail="SMTP is not configured.")

    body_lines = [briefing.summary, "", "Key points:"]
    for point in briefing.points or []:
        body_lines.append(f"- {point}")

    body = "\n".join(body_lines)
    msg = MIMEText(body)
    msg["Subject"] = briefing.title
    msg["From"] = smtp_from
    msg["To"] = current_user.email

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, [current_user.email], msg.as_string())

    return {"message": f"Briefing sent to {current_user.email}"}