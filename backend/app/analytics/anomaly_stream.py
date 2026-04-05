import asyncio
from datetime import datetime

from app.config import settings
from app.database import SessionLocal
from app.models import Project

try:
    from app.analytics.anomaly_detection import detect_growth_spike
except Exception as e:
    print(f"Warning: anomaly detection module not available: {e}")
    detect_growth_spike = None

try:
    from app.utils.pubsub import publish_event
except Exception as e:
    print(f"Warning: pubsub module not available: {e}")
    publish_event = None


def _safe_dict(value):
    return value if isinstance(value, dict) else {}


async def detect_anomalies(interval_seconds: int = 30):
    """
    Background task that periodically scans projects for anomaly signals
    and publishes realtime anomaly events through Redis pub/sub.

    Notes:
    - Designed to be started from FastAPI startup using:
        asyncio.create_task(detect_anomalies())
    - Uses detect_growth_spike() from anomaly_detection.py
    - Publishes events only if Redis publishing is enabled
    """
    while True:
        db = None

        try:
            if SessionLocal is None:
                await asyncio.sleep(interval_seconds)
                continue

            db = SessionLocal()
            projects = db.query(Project).all()

            for project in projects:
                try:
                    if not detect_growth_spike:
                        continue

                    project.extra_data = _safe_dict(project.extra_data)

                    twitter_anomaly = detect_growth_spike(
                        project,
                        metric="twitter_follower_growth_30d",
                        threshold=2.0
                    )

                    github_anomaly = detect_growth_spike(
                        project,
                        metric="github_star_growth_30d",
                        threshold=2.0
                    )

                    discord_anomaly = detect_growth_spike(
                        project,
                        metric="discord_growth_30d",
                        threshold=2.0
                    )

                    anomaly_detected = twitter_anomaly or github_anomaly or discord_anomaly

                    project.extra_data["last_anomaly_scan_at"] = datetime.utcnow().isoformat()
                    project.extra_data["twitter_anomaly"] = twitter_anomaly
                    project.extra_data["github_anomaly"] = github_anomaly
                    project.extra_data["discord_anomaly"] = discord_anomaly

                    if hasattr(project, "anomaly_score"):
                        project.anomaly_score = 1.0 if anomaly_detected else 0.0

                    db.add(project)
                    db.commit()
                    db.refresh(project)

                    if anomaly_detected and publish_event and settings.ENABLE_REDIS:
                        triggered_metrics = []
                        if twitter_anomaly:
                            triggered_metrics.append("twitter_follower_growth_30d")
                        if github_anomaly:
                            triggered_metrics.append("github_star_growth_30d")
                        if discord_anomaly:
                            triggered_metrics.append("discord_growth_30d")

                        await publish_event({
                            "type": "anomaly",
                            "message": f"Anomaly detected for project {project.name}",
                            "data": {
                                "project_id": project.id,
                                "name": project.name,
                                "sector": project.sector,
                                "stage": project.stage,
                                "triggered_metrics": triggered_metrics,
                                "overall_score": project.overall_score,
                                "twitter_followers": project.twitter_followers,
                                "twitter_follower_growth_30d": project.twitter_follower_growth_30d,
                                "github_stars": project.github_stars,
                                "github_star_growth_30d": project.github_star_growth_30d,
                                "discord_members": project.discord_members,
                                "discord_growth_30d": project.discord_growth_30d,
                                "market_cap": project.market_cap,
                                "tvl": project.tvl,
                                "updated_at": datetime.utcnow().isoformat()
                            }
                        })

                except Exception as e:
                    if db:
                        db.rollback()
                    print(f"Warning: anomaly scan failed for project {getattr(project, 'id', 'unknown')}: {e}")

        except Exception as e:
            print(f"Warning: anomaly stream loop failed: {e}")

        finally:
            if db:
                db.close()

        await asyncio.sleep(interval_seconds)