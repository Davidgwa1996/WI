import requests
from tenacity import retry, stop_after_attempt, wait_exponential
from app.config import settings

BASE_URL = "https://api.coingecko.com/api/v3"


def _headers():
    headers = {"Accept": "application/json"}
    if settings.COINGECKO_API_KEY:
        headers["x-cg-pro-api-key"] = settings.COINGECKO_API_KEY
    return headers


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def get_coin_market_data(coin_id: str) -> dict | None:
    if not coin_id:
        return None

    url = f"{BASE_URL}/coins/markets"
    params = {
        "vs_currency": "usd",
        "ids": coin_id,
        "price_change_percentage": "24h,7d,30d",
    }

    response = requests.get(url, headers=_headers(), params=params, timeout=20)
    response.raise_for_status()
    payload = response.json()

    if not payload:
        return None
    return payload[0]


def update_market_data(project, db) -> None:
    if not project.token_symbol:
        return

    coin_id = str(project.token_symbol).strip().lower()
    market = get_coin_market_data(coin_id)
    if not market:
        return

    project.market_cap = float(market.get("market_cap") or 0.0)
    project.total_volume = float(market.get("total_volume") or 0.0)

    project.extra_data = project.extra_data or {}
    project.extra_data["coingecko"] = {
        "id": market.get("id"),
        "symbol": market.get("symbol"),
        "name": market.get("name"),
        "current_price": market.get("current_price"),
        "market_cap_rank": market.get("market_cap_rank"),
        "price_change_percentage_24h": market.get("price_change_percentage_24h"),
        "price_change_percentage_7d_in_currency": market.get("price_change_percentage_7d_in_currency"),
        "price_change_percentage_30d_in_currency": market.get("price_change_percentage_30d_in_currency"),
        "ath": market.get("ath"),
        "atl": market.get("atl"),
    }

    db.add(project)