from __future__ import annotations

from datetime import datetime

from app.tasks.celery_app import celery
from app.database import SessionLocal
from app.models import Project


def _ensure_dict(value):
    return value if isinstance(value, dict) else {}


@celery.task(name="app.tasks.change_detection_tasks.detect_project_changes")
def detect_project_changes():
    if SessionLocal is None:
        return {"status": "failed", "reason": "Database session unavailable"}

    db = SessionLocal()

    try:
        projects = db.query(Project).all()
        changed = 0

        for project in projects:
          extra = _ensure_dict(project.extra_data)
          snapshot = _ensure_dict(extra.get("last_snapshot", {}))

          current = {
              "overall_score": float(project.overall_score or 0),
              "market_cap": float(project.market_cap or 0),
              "tvl": float(project.tvl or 0),
              "twitter_followers": int(project.twitter_followers or 0),
              "github_stars": int(project.github_stars or 0),
              "discord_members": int(project.discord_members or 0),
          }

          deltas = {}
          for key, value in current.items():
              previous = snapshot.get(key)
              if previous is not None and previous != value:
                  deltas[key] = {
                      "previous": previous,
                      "current": value,
                  }

          if deltas:
              extra["change_deltas"] = deltas
              extra["last_change_detected_at"] = datetime.utcnow().isoformat()
              changed += 1

          extra["last_snapshot"] = current
          project.extra_data = extra
          db.add(project)

        db.commit()
        return {"status": "success", "changed_projects": changed}

    except Exception as e:
        db.rollback()
        return {"status": "failed", "reason": str(e)}
    finally:
        db.close()