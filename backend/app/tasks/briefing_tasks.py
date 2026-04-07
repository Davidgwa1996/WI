from app.tasks.celery_app import celery
from app.database import SessionLocal
from app.models import Organization, Project, Briefing


@celery.task(name="app.tasks.briefing_tasks.generate_daily_briefings")
def generate_daily_briefings():
    if SessionLocal is None:
        return {"status": "failed", "reason": "Database session unavailable"}

    db = SessionLocal()

    try:
        organizations = db.query(Organization).filter(Organization.is_active.is_(True)).all()
        created = 0

        for org in organizations:
            projects = (
                db.query(Project)
                .filter(Project.organization_id == org.id)
                .order_by(Project.overall_score.desc())
                .limit(10)
                .all()
            )

            if not projects:
                continue

            top_names = [p.name for p in projects[:3]]
            avg_score = round(sum(float(p.overall_score or 0) for p in projects) / len(projects), 2)

            briefing = Briefing(
                organization_id=org.id,
                title="Daily Intelligence Briefing",
                summary=(
                    f"Average tracked score is {avg_score}. "
                    f"Top monitored projects today include {', '.join(top_names)}."
                ),
                points=[
                    f"{top_names[0]} is currently the highest-scoring tracked project." if len(top_names) > 0 else "No lead project today.",
                    f"{len([p for p in projects if (p.overall_score or 0) >= 80])} projects are in high-conviction range.",
                    "Review watchlists and exports for operational follow-up.",
                ],
                kind="Daily",
                is_published=True,
            )
            db.add(briefing)
            created += 1

        db.commit()
        return {"status": "success", "created": created}

    except Exception as e:
        db.rollback()
        return {"status": "failed", "reason": str(e)}

    finally:
        db.close()