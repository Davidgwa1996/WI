import aiohttp
import asyncio
import numpy as np
from app.database import get_mongo_db

async def fetch_btc_price_history(days=30):
    """Fetch last 'days' of Bitcoin prices from CoinGecko."""
    url = f"https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days={days}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            data = await response.json()
            prices = data.get("prices", [])
            return [p[1] for p in prices]  # [price_usd, ...]

def calculate_correlation(project_metrics, btc_prices):
    """
    Compute Pearson correlation between a project's metric (e.g., twitter_followers)
    and BTC price over time.
    """
    if len(project_metrics) != len(btc_prices):
        return None
    return np.corrcoef(project_metrics, btc_prices)[0, 1]

# Example usage in Celery task:
# btc = asyncio.run(fetch_btc_price_history())
# followers_history = project.extra_data.get("twitter_followers_history", [])
# correlation = calculate_correlation(followers_history, btc)