from app.modules.matching.geo_search import get_nearby_drivers

from app.modules.matching.scoring import (
    calculate_driver_score
)

from app.utils.distance import calculate_distance


def find_best_driver(
    db,
    pickup_lat,
    pickup_lng
):

    drivers = get_nearby_drivers(db)

    print("AVAILABLE DRIVERS:", drivers)

    best_driver = None

    best_score = -999999

    for driver in drivers:

        print("CHECKING DRIVER:", driver.id)

        print("LAT:", driver.current_lat)

        print("LNG:", driver.current_lng)

        # SKIP INVALID LOCATIONS
        if (
            driver.current_lat is None
            or driver.current_lng is None
        ):
            print("SKIPPED DRIVER")
            continue

        distance = calculate_distance(
            pickup_lat,
            pickup_lng,
            float(driver.current_lat),
            float(driver.current_lng)
        )

        print("DISTANCE:", distance)

        score = calculate_driver_score(distance)

        print("SCORE:", score)

        if score > best_score:

            print("NEW BEST DRIVER FOUND")

            best_score = score

            best_driver = driver

    print("FINAL BEST DRIVER:", best_driver)

    return best_driver