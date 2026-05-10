from app.modules.matching.engine import find_best_driver

def assign_driver_to_ride(db, ride):

    driver = find_best_driver(
    db,
    ride.pickup_lat,
    ride.pickup_lng
)

    if driver:
     ride.driver_id = driver.id
    ride.status = "assigned"
    
    return ride