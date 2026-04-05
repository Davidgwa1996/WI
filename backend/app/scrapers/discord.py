import requests
from tenacity import retry, stop_after_attempt, wait_exponential
from app.config import settings

BASE_URL = "https://discord.com/api/v10"


def _headers():
    if not settings.DISCORD_BOT_TOKEN:
        return {}
    return {
        "Authorization": f"Bot {settings.DISCORD_BOT_TOKEN}",
        "Content-Type": "application/json",
    }


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def get_guild(guild_id: str) -> dict:
    url = f"{BASE_URL}/guilds/{guild_id}"
    params = {"with_counts": "true"}
    response = requests.get(url, headers=_headers(), params=params, timeout=20)
    response.raise_for_status()
    return response.json()


def update_discord_metrics(project, db) -> None:
    if not project.discord_guild_id or not settings.DISCORD_BOT_TOKEN:
        return

    guild = get_guild(project.discord_guild_id)
    members = int(guild.get("approximate_member_count", 0))
    previous_members = int(project.discord_members or 0)

    project.discord_members = members

    if previous_members > 0:
        growth = ((members - previous_members) / previous_members) * 100
        project.discord_growth_30d = round(growth, 4)

    project.extra_data = project.extra_data or {}
    project.extra_data["discord"] = {
        "id": guild.get("id"),
        "name": guild.get("name"),
        "description": guild.get("description"),
        "approximate_member_count": guild.get("approximate_member_count"),
        "approximate_presence_count": guild.get("approximate_presence_count"),
        "premium_tier": guild.get("premium_tier"),
        "features": guild.get("features", []),
    }

    db.add(project)