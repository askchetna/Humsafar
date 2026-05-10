from app.modules.matching.geo_search import get_nearby_drivers
from app.modules.matching.scoring import calculate_driver_score
from app.utils.distance import calculate_distance

def find_best_driver(db, pickup_lat, pickup_lng):

    drivers = get_nearby_drivers(db)

    best_driver = None
    best_score = -999

    for driver in drivers:

        distance = calculate_distance(
            pickup_lat,
            pickup_lng,
            driver.current_lat,
            driver.current_lng
        )

        score = calculate_driver_score(distance)

        if score > best_score:
            best_score = score
            best_driver = driver

    return best_driver
