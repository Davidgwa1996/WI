import aiohttp
import asyncio
from app.config import settings
from app.websocket_manager import manager   # <-- updated

async def fetch_github_stats(repo_name, session):
    url = f"https://api.github.com/repos/{repo_name}"
    headers = {"Authorization": f"token {settings.GITHUB_TOKEN}"}
    async with session.get(url, headers=headers) as response:
        if response.status == 200:
            data = await response.json()
            return data.get("stargazers_count", 0)
    return 0

async def update_github_metrics_async(project, db_session):
    if not project.github_repo:
        return
    async with aiohttp.ClientSession() as session:
        stars = await fetch_github_stats(project.github_repo, session)
        if stars is not None:
            old_stars = project.github_stars
            project.github_stars = stars
            if old_stars:
                project.github_star_growth_30d = ((stars - old_stars) / old_stars) * 100
            db_session.commit()
            await manager.broadcast({
                "type": "github_update",
                "project_id": project.id,
                "github_stars": stars,
                "growth": project.github_star_growth_30d
            })

def update_github_metrics(project, db_session):
    asyncio.run(update_github_metrics_async(project, db_session))