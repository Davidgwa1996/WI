import aiohttp
import asyncio
from app.websocket_manager import manager

async def fetch_coin_data(token_symbol):
    url = f"https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&symbols={token_symbol.lower()}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                if data:
                    return data[0].get("market_cap", 0), data[0].get("total_volume", 0)
    return 0, 0

async def update_market_data_async(project, db_session):
    if not project.token_symbol:
        return
    market_cap, volume = await fetch_coin_data(project.token_symbol)
    if market_cap:
        project.market_cap = market_cap
        project.total_volume = volume
        db_session.commit()
        await manager.broadcast({
            "type": "market_update",
            "project_id": project.id,
            "market_cap": market_cap,
            "total_volume": volume
        })

def update_market_data(project, db_session):
    asyncio.run(update_market_data_async(project, db_session))
