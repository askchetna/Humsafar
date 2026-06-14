from app.modules.drivers.models import DriverProfile
from app.utils.distance import calculate_distance
from app.config.settings import settings
from app.utils.redis_client import get_redis_nearby_driver_ids


def get_nearby_drivers(
    db,
    pickup_lat=None,
    pickup_lng=None,
    radius_km=None,
    ride_type="standard"
):

    max_radius = radius_km or settings.DRIVER_SEARCH_RADIUS_KM

    redis_ids = None
    if pickup_lat is not None and pickup_lng is not None:
        redis_ids = get_redis_nearby_driver_ids(
            pickup_lat, pickup_lng, max_radius
        )

    query = db.query(DriverProfile).filter(
        DriverProfile.is_online == True,
        DriverProfile.is_approved == True
    )

    if ride_type == "delivery":
        query = query.filter(
            DriverProfile.vehicle_type.in_(["delivery", "bike", "economy"])
        )

    if redis_ids:
        query = query.filter(DriverProfile.id.in_(redis_ids))

    drivers = query.all()

    if pickup_lat is None or pickup_lng is None:
        return drivers

    max_radius = radius_km or settings.DRIVER_SEARCH_RADIUS_KM

    nearby = []

    for driver in drivers:
        if driver.current_lat is None or driver.current_lng is None:
            continue

        distance = calculate_distance(
            pickup_lat,
            pickup_lng,
            float(driver.current_lat),
            float(driver.current_lng)
        )

        if distance <= max_radius:
            nearby.append(driver)

    return nearby
