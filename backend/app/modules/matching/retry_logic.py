import asyncio
import json

from app.database.session import SessionLocal

from app.modules.rides.models import Ride

from app.modules.matching.engine import (
    find_best_driver
)

from app.websocket.connection_manager import (
    manager
)


async def retry_dispatch(
    ride_id: str
):

    print("DISPATCH TIMER STARTED")

    await asyncio.sleep(10)

    # NEW DATABASE SESSION
    db = SessionLocal()

    try:

        # GET FRESH RIDE
        ride = db.query(Ride).filter(
            Ride.id == ride_id
        ).first()

        if not ride:

            print("RIDE NOT FOUND")

            return

        # IF ACCEPTED
        if ride.status == "accepted":

            print("RIDE ACCEPTED")

            return

        print("DRIVER DID NOT ACCEPT")

        old_driver_id = ride.driver_id

        # RESET
        ride.driver_id = None

        ride.status = "searching"

        db.commit()

        db.refresh(ride)

        # FIND NEXT DRIVER
        # SAVE OLD DRIVER
        old_driver_id = str(ride.driver_id)

# ADD TO REJECTED LIST
        rejected = ride.rejected_drivers or []

        rejected.append(old_driver_id)

        ride.rejected_drivers = rejected

        db.commit()

# FIND NEW DRIVER
        next_driver = find_best_driver(
            db,
            ride.pickup_lat,
            ride.pickup_lng,
            excluded_drivers=rejected
        )

        # PREVENT SAME DRIVER
        if (
            next_driver
            and str(next_driver.id) == str(old_driver_id)
        ):

            print("SAME DRIVER FOUND AGAIN")

            return

        if next_driver:

            ride.driver_id = next_driver.id

            ride.status = "assigned"

            db.commit()

            db.refresh(ride)

            print("NEW DRIVER ASSIGNED")

            # SEND TO DRIVER
            await manager.send_to_driver(
                str(next_driver.id),

                json.dumps({
                    "type": "new_ride",
                    "ride_id": ride.id
                })
            )

            # SEND TO RIDER
            await manager.send_to_rider(
                str(ride.rider_id),

                json.dumps({
                    "type": "driver_reassigned",
                    "ride_id": ride.id,
                    "driver_id": next_driver.id
                })
            )

        else:

            print("NO DRIVERS AVAILABLE")

    finally:

        db.close()