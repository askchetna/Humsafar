from app.modules.matching.engine import (
    find_best_driver
)


def assign_driver_to_ride(db, ride):

    driver = find_best_driver(
        db,
        ride.pickup_lat,
        ride.pickup_lng
    )

    # DRIVER FOUND
    if driver:

        ride.driver_id = driver.id

        ride.status = "assigned"

    else:

        ride.status = "searching"

    db.commit()

    db.refresh(ride)

    return ride