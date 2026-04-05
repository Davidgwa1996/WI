from datetime import datetime
import asyncio

from app.tasks.celery_app import celery
from app.config import settings
from app.database import SessionLocal
from app.models import Project

# ------------------------------------------------------------
# Optional imports with safe fallback
# ------------------------------------------------------------
twitter = github = discord = coingecko = defillama = None
momentum = funding_predictor = ensemble = None
detect_growth_spike = None
publish_event = None

try:
    from app.scrapers import twitter, github, discord, coingecko, defillama
except Exception as e:
    print(f"Warning: scraper modules not available: {e}")

try:
    from app.ai import momentum, funding_predictor, ensemble
except Exception as e:
    print(f"Warning: AI modules not available: {e}")

try:
    from app.analytics import detect_growth_spike
except Exception as e:
    print(f"Warning: analytics modules not available: {e}")

try:
    from app.utils.pubsub import publish_event
except Exception as e:
    print(f"Warning: pubsub module not available: {e}")


# ------------------------------------------------------------
# Safe helpers
# ------------------------------------------------------------
def _safe_call(func, default=None, *args, **kwargs):
    try:
        return func(*args, **kwargs)
    except Exception as e:
        print(f"Warning: {getattr(func, '__name__', 'call')} failed: {e}")
        return default


def _ensure_dict(value):
    return value if isinstance(value, dict) else {}


def _project_text(project: Project) -> str:
    return " ".join(
        [
            str(project.name or ""),
            str(project.description or ""),
            str(project.sector or ""),
            str(project.stage or ""),
            str(project.token_symbol or ""),
        ]
    ).strip()


# ------------------------------------------------------------
# Main Celery task
# ------------------------------------------------------------
@celery.task(name="app.tasks.scraper_tasks.update_all_projects")
def update_all_projects():
    if SessionLocal is None:
        return {
            "status": "failed",
            "reason": "Database session is not available",
        }

    db = SessionLocal()

    try:
        projects = db.query(Project).all()
        updated_count = 0

        for project in projects:
            try:
                # ------------------------------------------------------------
                # Update scraped metrics from supported sources only
                # ------------------------------------------------------------
                if twitter and hasattr(twitter, "update_twitter_metrics"):
                    _safe_call(twitter.update_twitter_metrics, None, project, db)

                if github and hasattr(github, "update_github_metrics"):
                    _safe_call(github.update_github_metrics, None, project, db)

                if discord and hasattr(discord, "update_discord_metrics"):
                    _safe_call(discord.update_discord_metrics, None, project, db)

                if coingecko and hasattr(coingecko, "update_market_data"):
                    _safe_call(coingecko.update_market_data, None, project, db)

                if defillama and hasattr(defillama, "update_defillama_tvl"):
                    _safe_call(defillama.update_defillama_tvl, None, project, db)

                # ------------------------------------------------------------
                # AI scores
                # Heavy AI libraries are loaded lazily inside worker-side modules
                # ------------------------------------------------------------
                try:
                    from app.ai import llm_analyzer, sentiment
                except Exception as e:
                    print(f"Warning: advanced AI modules not available: {e}")
                    llm_analyzer = None
                    sentiment = None

                project_text = _project_text(project)

                if llm_analyzer and hasattr(llm_analyzer, "llm_early_stage_score"):
                    project.llm_score = _safe_call(
                        llm_analyzer.llm_early_stage_score,
                        project.llm_score,
                        project,
                    )

                if sentiment and hasattr(sentiment, "get_sentiment_score"):
                    project.sentiment_score = _safe_call(
                        sentiment.get_sentiment_score,
                        project.sentiment_score,
                        project.id,
                        text=project_text,
                    )

                if momentum and hasattr(momentum, "calculate_momentum_score"):
                    project.momentum_score = _safe_call(
                        momentum.calculate_momentum_score,
                        project.momentum_score,
                        project,
                    )

                if funding_predictor and hasattr(funding_predictor, "predict_funding"):
                    project.funding_prediction = _safe_call(
                        funding_predictor.predict_funding,
                        project.funding_prediction,
                        project,
                    )

                if ensemble and hasattr(ensemble, "overall_score"):
                    project.overall_score = _safe_call(
                        ensemble.overall_score,
                        project.overall_score,
                        project,
                    )

                # ------------------------------------------------------------
                # Advanced analytics
                # ------------------------------------------------------------
                anomaly_detected = None

                if detect_growth_spike:
                    anomaly_detected = _safe_call(
                        detect_growth_spike,
                        None,
                        project,
                    )

                # ------------------------------------------------------------
                # Store analytics safely
                # ------------------------------------------------------------
                project.extra_data = _ensure_dict(project.extra_data)
                project.extra_data["anomaly_detected"] = anomaly_detected
                project.extra_data["last_project_text"] = project_text

                if hasattr(project, "anomaly_score") and anomaly_detected is not None:
                    project.anomaly_score = 1.0 if anomaly_detected else 0.0

                if hasattr(project, "last_scraped_at"):
                    project.last_scraped_at = datetime.utcnow()

                if hasattr(project, "last_ai_scored_at"):
                    project.last_ai_scored_at = datetime.utcnow()

                project.updated_at = datetime.utcnow()

                db.add(project)
                db.commit()
                db.refresh(project)

                updated_count += 1

                # ------------------------------------------------------------
                # Publish realtime event through Redis pub/sub
                # ------------------------------------------------------------
                if publish_event and settings.ENABLE_REDIS:
                    try:
                        asyncio.run(
                            publish_event(
                                {
                                    "type": "full_update",
                                    "message": f"Project {project.name} updated",
                                    "data": {
                                        "project_id": project.id,
                                        "name": project.name,
                                        "description": project.description,
                                        "website": project.website,
                                        "twitter_handle": project.twitter_handle,
                                        "token_symbol": project.token_symbol,
                                        "sector": project.sector,
                                        "stage": project.stage,
                                        "overall_score": project.overall_score,
                                        "llm_score": project.llm_score,
                                        "sentiment_score": project.sentiment_score,
                                        "funding_prediction": project.funding_prediction,
                                        "momentum_score": project.momentum_score,
                                        "twitter_followers": project.twitter_followers,
                                        "twitter_follower_growth_30d": project.twitter_follower_growth_30d,
                                        "github_stars": project.github_stars,
                                        "github_star_growth_30d": project.github_star_growth_30d,
                                        "discord_members": project.discord_members,
                                        "discord_growth_30d": project.discord_growth_30d,
                                        "market_cap": project.market_cap,
                                        "total_volume": project.total_volume,
                                        "tvl": project.tvl,
                                        "anomaly_detected": anomaly_detected,
                                        "updated_at": project.updated_at.isoformat(),
                                    },
                                }
                            )
                        )
                    except Exception as e:
                        print(
                            f"Warning: realtime publish failed for project {project.id}: {e}"
                        )

            except Exception as e:
                db.rollback()
                print(f"Error updating project {getattr(project, 'id', 'unknown')}: {e}")

        return {
            "status": "success",
            "updated_count": updated_count,
        }

    except Exception as e:
        db.rollback()
        print(f"Error running update_all_projects: {e}")
        return {
            "status": "failed",
            "reason": str(e),
        }

    finally:
        db.close()