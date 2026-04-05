import requests
from tenacity import retry, stop_after_attempt, wait_exponential
from app.config import settings

BASE_URL = "https://api.x.com/2"


def _headers():
    if not settings.TWITTER_BEARER_TOKEN:
        return {}
    return {
        "Authorization": f"Bearer {settings.TWITTER_BEARER_TOKEN}",
        "Content-Type": "application/json",
    }


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def get_user_by_username(username: str) -> dict | None:
    if not username:
        return None

    username = username.replace("@", "").strip()
    url = f"{BASE_URL}/users/by/username/{username}"
    params = {
        "user.fields": "public_metrics,created_at,description,url,verified"
    }

    response = requests.get(url, headers=_headers(), params=params, timeout=20)
    response.raise_for_status()
    payload = response.json()
    return payload.get("data")


def update_twitter_metrics(project, db) -> None:
    if not project.twitter_handle or not settings.TWITTER_BEARER_TOKEN:
        return

    user = get_user_by_username(project.twitter_handle)
    if not user:
        return

    metrics = user.get("public_metrics", {})
    followers = int(metrics.get("followers_count", 0))

    previous_followers = int(project.twitter_followers or 0)
    project.twitter_followers = followers

    if previous_followers > 0:
        growth = ((followers - previous_followers) / previous_followers) * 100
        project.twitter_follower_growth_30d = round(growth, 4)

    project.extra_data = project.extra_data or {}
    project.extra_data["twitter"] = {
        "id": user.get("id"),
        "username": user.get("username"),
        "name": user.get("name"),
        "verified": user.get("verified"),
        "description": user.get("description"),
        "url": user.get("url"),
        "created_at": user.get("created_at"),
        "public_metrics": metrics,
    }

    db.add(project)