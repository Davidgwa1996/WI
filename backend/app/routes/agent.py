from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import Project, User, Watchlist, WatchlistItem, SavedReport, Briefing

try:
    from openai import OpenAI
except Exception:
    OpenAI = None

from app.config import settings

router = APIRouter(prefix="/agent", tags=["agent"])


class AgentChatRequest(dict):
    pass


def _project_to_context(project: Project) -> dict[str, Any]:
    return {
        "id": project.id,
        "name": project.name,
        "sector": project.sector,
        "stage": project.stage,
        "description": project.description,
        "overall_score": float(project.overall_score or 0),
        "llm_score": float(project.llm_score or 0),
        "sentiment_score": float(project.sentiment_score or 0),
        "momentum_score": float(project.momentum_score or 0),
        "funding_prediction": float(project.funding_prediction or 0),
        "market_cap": float(project.market_cap or 0),
        "tvl": float(project.tvl or 0),
        "twitter_followers": int(project.twitter_followers or 0),
        "github_stars": int(project.github_stars or 0),
        "discord_members": int(project.discord_members or 0),
    }


def _local_agent_answer(message: str, projects: list[Project]) -> str:
    text = message.lower().strip()

    if not projects:
        return "No projects are currently available in your workspace."

    if "top" in text or "best" in text or "strongest" in text:
        ranked = sorted(projects, key=lambda p: float(p.overall_score or 0), reverse=True)[:5]
        lines = []
        for idx, p in enumerate(ranked, start=1):
            lines.append(
                f"{idx}. {p.name} — score {round(float(p.overall_score or 0), 1)}, "
                f"sector {p.sector or 'Unknown'}, stage {p.stage or 'Unknown'}."
            )
        return "Top projects right now:\n" + "\n".join(lines)

    if "risk" in text or "caution" in text:
        weakest = sorted(projects, key=lambda p: float(p.overall_score or 0))[:5]
        lines = []
        for p in weakest:
            lines.append(
                f"- {p.name}: lower score {round(float(p.overall_score or 0), 1)} with "
                f"momentum {round(float(p.momentum_score or 0), 1)} and sentiment {round(float(p.sentiment_score or 0), 1)}."
            )
        return "Projects needing caution:\n" + "\n".join(lines)

    if "defi" in text:
        defi = [p for p in projects if (p.sector or "").lower() == "defi"]
        if not defi:
            return "No DeFi projects were found in your workspace."
        defi = sorted(defi, key=lambda p: float(p.overall_score or 0), reverse=True)[:5]
        return "Top DeFi projects:\n" + "\n".join(
            f"- {p.name}: score {round(float(p.overall_score or 0), 1)}" for p in defi
        )

    if "infrastructure" in text:
        infra = [p for p in projects if "infra" in (p.sector or "").lower()]
        if not infra:
            return "No infrastructure projects were found in your workspace."
        infra = sorted(infra, key=lambda p: float(p.overall_score or 0), reverse=True)[:5]
        return "Top infrastructure projects:\n" + "\n".join(
            f"- {p.name}: score {round(float(p.overall_score or 0), 1)}" for p in infra
        )

    avg_score = round(sum(float(p.overall_score or 0) for p in projects) / len(projects), 2)
    return (
        f"You currently have {len(projects)} tracked projects with an average overall score of {avg_score}. "
        f"Ask for strongest projects, risky projects, sector-specific projects, or watchlist suggestions."
    )


@router.post("/chat")
def agent_chat(
    payload: dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = str(payload.get("message", "")).strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required.")

    projects = (
        db.query(Project)
        .filter(Project.organization_id == current_user.organization_id)
        .order_by(Project.overall_score.desc())
        .limit(50)
        .all()
    )

    if settings.OPENAI_API_KEY and OpenAI is not None:
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            project_context = [_project_to_context(p) for p in projects[:20]]

            system_prompt = (
                "You are an enterprise Web3 intelligence assistant. "
                "Answer only from the provided workspace project context. "
                "Be concise, structured, and decision-oriented."
            )

            user_prompt = {
                "user_question": message,
                "workspace_projects": project_context,
            }

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0.2,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": str(user_prompt)},
                ],
            )
            answer = response.choices[0].message.content or ""
            return {"message": message, "answer": answer, "source": "openai"}
        except Exception:
            pass

    answer = _local_agent_answer(message, projects)
    return {"message": message, "answer": answer, "source": "local"}


@router.get("/workspace-summary")
def workspace_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project_count = (
        db.query(Project)
        .filter(Project.organization_id == current_user.organization_id)
        .count()
    )
    watchlist_count = (
        db.query(Watchlist)
        .filter(Watchlist.organization_id == current_user.organization_id)
        .count()
    )
    report_count = (
        db.query(SavedReport)
        .filter(SavedReport.organization_id == current_user.organization_id)
        .count()
    )
    briefing_count = (
        db.query(Briefing)
        .filter(Briefing.organization_id == current_user.organization_id)
        .count()
    )

    return {
        "projects": project_count,
        "watchlists": watchlist_count,
        "reports": report_count,
        "briefings": briefing_count,
    }