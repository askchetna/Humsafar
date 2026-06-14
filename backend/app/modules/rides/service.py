import asyncio

from app.modules.matching.engine import (
    find_best_driver
)
from app.modules.matching.eta import (
    calculate_eta
)
from app.modules.matching.retry_logic import (
    retry_dispatch
)

from app.websocket.connection_manager import (
    manager
)


async def assign_driver_to_ride(
    db,
    ride
):

    driver = find_best_driver(
        db,
        ride.pickup_lat,
        ride.pickup_lng,
        excluded_drivers=ride.rejected_drivers or [],
        ride_type=getattr(ride, "ride_type", "standard") or "standard"
    )

    if driver:

        # ASSIGN DRIVER
        ride.driver_id = driver.id
        eta = calculate_eta(

            driver.current_lat,
            driver.current_lng,

            ride.pickup_lat,
            ride.pickup_lng
)

        print("ETA:", eta)
        ride.status = "assigned"

        db.commit()

        db.refresh(ride)

        # SEND EVENT TO DRIVER
        await manager.send_to_driver(
            str(driver.id),
            {
                "type": "new_ride",
                "ride_id": ride.id,
                "pickup": ride.pickup_location,
                "drop": ride.drop_location
            }
        )

        await manager.send_to_rider(
            str(ride.rider_id),
            {
                "type": "driver_assigned",
                "ride_id": ride.id,
                "driver_id": driver.id,
                "eta": eta
            }
        )

        # START RETRY TIMER
        asyncio.create_task(

            retry_dispatch(
                
                ride.id
            )
        )

    return ride