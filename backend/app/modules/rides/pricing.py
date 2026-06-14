from typing import Optional

from pydantic import BaseModel


def calculate_fare(
    pickup_lat: float,
    pickup_lng: float,
    drop_lat: float,
    drop_lng: float,
    ride_type: str = "standard"
) -> dict:

    from app.utils.distance import calculate_distance

    distance_km = calculate_distance(
        pickup_lat,
        pickup_lng,
        drop_lat,
        drop_lng
    )

    if ride_type == "delivery":
        base = 40
        per_km = 12
    else:
        base = 30
        per_km = 15

    fare = round(base + distance_km * per_km)

    return {
        "fare": fare,
        "distance_km": round(distance_km, 2),
        "ride_type": ride_type,
        "currency": "PKR"
    }
