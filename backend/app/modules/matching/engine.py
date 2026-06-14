from app.modules.matching.geo_search import get_nearby_drivers
from app.modules.matching.scoring import calculate_driver_score
from app.utils.distance import calculate_distance


def find_best_driver(
    db,
    pickup_lat,
    pickup_lng,
    excluded_drivers=None,
    ride_type="standard"
):

    drivers = get_nearby_drivers(
        db,
        pickup_lat,
        pickup_lng,
        ride_type=ride_type
    )

    best_driver = None
    best_score = -999999

    for driver in drivers:
        if excluded_drivers and str(driver.id) in excluded_drivers:
            continue

        if driver.current_lat is None or driver.current_lng is None:
            continue

        distance = calculate_distance(
            pickup_lat,
            pickup_lng,
            float(driver.current_lat),
            float(driver.current_lng)
        )

        score = calculate_driver_score(
            distance,
            vehicle_type=driver.vehicle_type,
            ride_type=ride_type
        )

        if score > best_score:
            best_score = score
            best_driver = driver

    return best_driver
