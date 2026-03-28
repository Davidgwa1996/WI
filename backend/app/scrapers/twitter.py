import tweepy
import asyncio
from app.config import settings
from app.websocket_manager import manager   # <-- updated

def update_twitter_metrics_sync(project, db_session):
    if not project.twitter_handle:
        return
    try:
        client = tweepy.Client(bearer_token=settings.TWITTER_BEARER_TOKEN)
        user = client.get_user(username=project.twitter_handle, user_fields=["public_metrics"])
        if user.data:
            metrics = user.data.public_metrics
            new_followers = metrics.get("followers_count", 0)
            old_followers = project.twitter_followers
            project.twitter_followers = new_followers
            if old_followers:
                project.twitter_follower_growth_30d = ((new_followers - old_followers) / old_followers) * 100
            db_session.commit()
            asyncio.create_task(manager.broadcast({
                "type": "twitter_update",
                "project_id": project.id,
                "twitter_followers": new_followers,
                "growth": project.twitter_follower_growth_30d
            }))
    except Exception as e:
        print(f"Twitter error for {project.twitter_handle}: {e}")

def update_twitter_metrics(project, db_session):
    import threading
    thread = threading.Thread(target=update_twitter_metrics_sync, args=(project, db_session))
    thread.start()