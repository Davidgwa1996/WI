import requests
from tenacity import retry, stop_after_attempt, wait_exponential

BASE_URL = "https://api.llama.fi"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def get_protocol(protocol_slug: str) -> dict | None:
    if not protocol_slug:
        return None

    url = f"{BASE_URL}/protocol/{protocol_slug}"
    response = requests.get(url, timeout=20)
    response.raise_for_status()
    return response.json()


def update_defillama_tvl(project, db) -> None:
    if not project.website:
        return

    # Best practice: store DefiLlama slug in extra_data if available.
    protocol_slug = None
    if isinstance(project.extra_data, dict):
        protocol_slug = project.extra_data.get("defillama_slug")

    if not protocol_slug:
        return

    protocol = get_protocol(protocol_slug)
    if not protocol:
        return

    project.tvl = float(protocol.get("tvl") or 0.0)

    project.extra_data = project.extra_data or {}
    project.extra_data["defillama"] = {
        "id": protocol.get("id"),
        "name": protocol.get("name"),
        "category": protocol.get("category"),
        "chain": protocol.get("chain"),
        "chains": protocol.get("chains", []),
        "tvl": protocol.get("tvl"),
        "change_1d": protocol.get("change_1d"),
        "change_7d": protocol.get("change_7d"),
        "change_1m": protocol.get("change_1m"),
        "mcap": protocol.get("mcap"),
    }

    db.add(project)