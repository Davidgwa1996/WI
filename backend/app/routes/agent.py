from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.jwt_handler import decode_access_token
from app.config import settings
from app.database import get_db
from app.models import Briefing, Project, SavedReport, User, Watchlist

try:
    from openai import OpenAI
except Exception:
    OpenAI = None

router = APIRouter(prefix="/agent", tags=["agent"])

optional_bearer = HTTPBearer(auto_error=False)


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if not credentials or not credentials.credentials or db is None:
        return None

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        return None

    user = db.query(User).filter(User.email == payload["sub"]).first()
    if not user or not user.is_active:
        return None

    return user


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


def _local_agent_answer(message: str, projects: list[Project], public_mode: bool = False) -> str:
    text = message.lower().strip()

    if not projects:
        if public_mode:
            return (
                "This is the public AI Agent preview. Sign in to access workspace-specific "
                "project intelligence, watchlists, reports, and deeper recommendations."
            )
        return "No projects are currently available in your workspace."

    if "top" in text or "best" in text or "strongest" in text:
        ranked = sorted(projects, key=lambda p: float(p.overall_score or 0), reverse=True)[:5]
        lines = []
        for idx, p in enumerate(ranked, start=1):
            lines.append(
                f"{idx}. {p.name} — score {round(float(p.overall_score or 0), 1)}, "
                f"sector {p.sector or 'Unknown'}, stage {p.stage or 'Unknown'}."
            )
        prefix = "Top public preview projects right now:\n" if public_mode else "Top projects right now:\n"
        return prefix + "\n".join(lines)

    if "risk" in text or "caution" in text:
        weakest = sorted(projects, key=lambda p: float(p.overall_score or 0))[:5]
        lines = []
        for p in weakest:
            lines.append(
                f"- {p.name}: lower score {round(float(p.overall_score or 0), 1)} with "
                f"momentum {round(float(p.momentum_score or 0), 1)} and sentiment {round(float(p.sentiment_score or 0), 1)}."
            )
        prefix = "Public preview projects needing caution:\n" if public_mode else "Projects needing caution:\n"
        return prefix + "\n".join(lines)

    if "defi" in text:
        defi = [p for p in projects if (p.sector or "").lower() == "defi"]
        if not defi:
            return "No DeFi projects were found in the current dataset."
        defi = sorted(defi, key=lambda p: float(p.overall_score or 0), reverse=True)[:5]
        return "Top DeFi projects:\n" + "\n".join(
            f"- {p.name}: score {round(float(p.overall_score or 0), 1)}" for p in defi
        )

    if "infrastructure" in text or "infra" in text:
        infra = [p for p in projects if "infra" in (p.sector or "").lower()]
        if not infra:
            return "No infrastructure projects were found in the current dataset."
        infra = sorted(infra, key=lambda p: float(p.overall_score or 0), reverse=True)[:5]
        return "Top infrastructure projects:\n" + "\n".join(
            f"- {p.name}: score {round(float(p.overall_score or 0), 1)}" for p in infra
        )

    avg_score = round(sum(float(p.overall_score or 0) for p in projects) / len(projects), 2)

    if public_mode:
        return (
            f"This public AI Agent preview currently sees {len(projects)} public projects "
            f"with an average overall score of {avg_score}. "
            f"Ask for strongest projects, risky projects, or sector-specific projects. "
            f"Sign in for workspace-specific answers."
        )

    return (
        f"You currently have {len(projects)} tracked projects with an average overall score of {avg_score}. "
        f"Ask for strongest projects, risky projects, sector-specific projects, or watchlist suggestions."
    )


def _generate_openai_answer(message: str, projects: list[Project], public_mode: bool) -> str | None:
    if not settings.OPENAI_API_KEY or OpenAI is None:
        return None

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        project_context = [_project_to_context(p) for p in projects[:20]]

        system_prompt = (
            "You are an enterprise Web3 intelligence assistant. "
            "Answer only from the provided project context. "
            "Be concise, structured, and decision-oriented."
        )

        mode_note = (
            "This is public preview mode. Do not imply private workspace access."
            if public_mode
            else "This is authenticated workspace mode."
        )

        user_prompt = {
            "mode": "public_preview" if public_mode else "workspace",
            "mode_note": mode_note,
            "user_question": message,
            "projects": project_context,
        }

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": str(user_prompt)},
            ],
        )

        return response.choices[0].message.content or None
    except Exception:
        return None


@router.post("/chat")
def agent_chat(
    payload: dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    message = str(payload.get("message", "")).strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required.")

    if db is None:
        raise HTTPException(status_code=503, detail="Database not available.")

    public_mode = current_user is None

    if current_user:
        projects = (
            db.query(Project)
            .filter(Project.organization_id == current_user.organization_id)
            .order_by(Project.overall_score.desc())
            .limit(50)
            .all()
        )
    else:
        projects = (
            db.query(Project)
            .order_by(Project.overall_score.desc())
            .limit(25)
            .all()
        )

    answer = _generate_openai_answer(message, projects, public_mode)
    if answer:
        return {
            "message": message,
            "answer": answer,
            "source": "openai",
            "mode": "public_preview" if public_mode else "workspace",
        }

    answer = _local_agent_answer(message, projects, public_mode=public_mode)
    return {
        "message": message,
        "answer": answer,
        "source": "local",
        "mode": "public_preview" if public_mode else "workspace",
    }


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


@router.get("/analyze/{project_id}")
def analyze_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    return {
        "project_id": project.id,
        "name": project.name,
        "sector": project.sector,
        "stage": project.stage,
        "analysis": {
            "overall_score": float(project.overall_score or 0),
            "momentum_score": float(project.momentum_score or 0),
            "sentiment_score": float(project.sentiment_score or 0),
            "funding_prediction": float(project.funding_prediction or 0),
            "summary": (
                f"{project.name} currently sits at overall score "
                f"{round(float(project.overall_score or 0), 1)} with "
                f"momentum {round(float(project.momentum_score or 0), 1)} and "
                f"sentiment {round(float(project.sentiment_score or 0), 1)}."
            ),
        },
    }


@router.get("/recommendations")
def recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = (
        db.query(Project)
        .filter(Project.organization_id == current_user.organization_id)
        .order_by(Project.overall_score.desc())
        .limit(5)
        .all()
    )

    return {
        "recommendations": [
            {
                "project_id": p.id,
                "name": p.name,
                "overall_score": float(p.overall_score or 0),
                "reason": (
                    f"Strong score profile with sector {p.sector or 'Unknown'} "
                    f"and stage {p.stage or 'Unknown'}."
                ),
            }
            for p in projects
        ]
    }