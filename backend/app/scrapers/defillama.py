import aiohttp
import asyncio
from app.websocket_manager import manager   # <-- updated

async def fetch_tvl(protocol_slug):
    url = f"https://api.llama.fi/protocol/{protocol_slug}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                return data.get("tvl", 0)
    return 0

async def update_defillama_tvl_async(project, db_session):
    slug = project.extra_data.get("defillama_slug")
    if not slug:
        return
    tvl = await fetch_tvl(slug)
    if tvl is not None:
        project.tvl = tvl
        db_session.commit()
        await manager.broadcast({
            "type": "defillama_update",
            "project_id": project.id,
            "tvl": tvl
        })

def update_defillama_tvl(project, db_session):
    asyncio.run(update_defillama_tvl_async(project, db_session))