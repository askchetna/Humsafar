import logging
from typing import Optional

import httpx

from app.config.settings import settings

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = f"{settings.APP_NAME}/1.0"


async def geocode_address(
    query: str,
    near_lat: Optional[float] = None,
    near_lng: Optional[float] = None
) -> Optional[dict]:

    params = {
        "q": query.strip(),
        "format": "json",
        "limit": 1,
        "addressdetails": 0
    }

    if near_lat is not None and near_lng is not None:
        delta = 0.5
        params["viewbox"] = (
            f"{near_lng - delta},{near_lat + delta},"
            f"{near_lng + delta},{near_lat - delta}"
        )
        params["bounded"] = 1

    headers = {"User-Agent": USER_AGENT}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                NOMINATIM_URL,
                params=params,
                headers=headers
            )
            response.raise_for_status()
            results = response.json()

        if not results:
            return None

        hit = results[0]
        return {
            "lat": float(hit["lat"]),
            "lng": float(hit["lon"]),
            "display_name": hit.get("display_name", query)
        }

    except Exception as exc:
        logger.warning("Geocoding failed for %r: %s", query, exc)
        return None
