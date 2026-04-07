from __future__ import annotations

import httpx

from app.config import settings


async def google_search(query: str, num: int = 5):
    api_key = getattr(settings, "GOOGLE_SEARCH_API_KEY", None)
    engine_id = getattr(settings, "GOOGLE_SEARCH_ENGINE_ID", None)

    if not api_key or not engine_id:
        return []

    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": api_key,
        "cx": engine_id,
        "q": query,
        "num": min(max(num, 1), 10),
    }

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    items = data.get("items", [])
    return [
        {
            "title": item.get("title"),
            "link": item.get("link"),
            "snippet": item.get("snippet"),
        }
        for item in items
    ]