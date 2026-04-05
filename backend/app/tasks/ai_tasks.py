from app.tasks.celery_app import celery
from app.database import SessionLocal
from app.models import Project
from app.ai import llm_analyzer, sentiment


@celery.task(name="app.tasks.ai_tasks.score_project_ai")
def score_project_ai(project_id: int):
    if SessionLocal is None:
        return {"status": "failed", "reason": "Database not available"}

    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return {"status": "failed", "reason": "Project not found"}

        text = " ".join(
            [
                str(project.name or ""),
                str(project.description or ""),
                str(project.sector or ""),
                str(project.stage or ""),
            ]
        ).strip()

        project.llm_score = llm_analyzer.llm_early_stage_score(project)
        project.sentiment_score = sentiment.get_sentiment_score(project.id, text=text)

        db.add(project)
        db.commit()
        db.refresh(project)

        return {
            "status": "success",
            "project_id": project.id,
            "llm_score": project.llm_score,
            "sentiment_score": project.sentiment_score,
        }

    except Exception as e:
        db.rollback()
        return {"status": "failed", "reason": str(e)}
    finally:
        db.close()