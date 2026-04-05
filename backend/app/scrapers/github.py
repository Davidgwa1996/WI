import requests
from tenacity import retry, stop_after_attempt, wait_exponential
from app.config import settings

BASE_URL = "https://api.github.com"


def _headers():
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
    return headers


def _split_repo(repo: str):
    if not repo or "/" not in repo:
        return None, None
    owner, name = repo.strip().split("/", 1)
    return owner.strip(), name.strip()


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def get_repo(owner: str, repo: str) -> dict:
    url = f"{BASE_URL}/repos/{owner}/{repo}"
    response = requests.get(url, headers=_headers(), timeout=20)
    response.raise_for_status()
    return response.json()


def update_github_metrics(project, db) -> None:
    if not project.github_repo:
        return

    owner, repo = _split_repo(project.github_repo)
    if not owner or not repo:
        return

    repo_data = get_repo(owner, repo)
    stars = int(repo_data.get("stargazers_count", 0))
    previous_stars = int(project.github_stars or 0)

    project.github_stars = stars

    if previous_stars > 0:
        growth = ((stars - previous_stars) / previous_stars) * 100
        project.github_star_growth_30d = round(growth, 4)

    project.extra_data = project.extra_data or {}
    project.extra_data["github"] = {
        "full_name": repo_data.get("full_name"),
        "description": repo_data.get("description"),
        "language": repo_data.get("language"),
        "forks_count": repo_data.get("forks_count"),
        "watchers_count": repo_data.get("watchers_count"),
        "open_issues_count": repo_data.get("open_issues_count"),
        "default_branch": repo_data.get("default_branch"),
        "html_url": repo_data.get("html_url"),
        "updated_at": repo_data.get("updated_at"),
    }

    db.add(project)