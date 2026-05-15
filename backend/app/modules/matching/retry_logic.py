import asyncio
import json

from app.database.session import SessionLocal
from app.modules.rides.models import Ride
from app.modules.matching.engine import find_best_driver
from app.websocket.connection_manager import manager


async def retry_dispatch(ride_id: str):

    print("DISPATCH TIMER STARTED")

    await asyncio.sleep(15)

    db = SessionLocal()

    try:

        ride = db.query(Ride).filter(Ride.id == ride_id).first()

        if not ride:
            print("RIDE NOT FOUND IN RETRY")
            return

        # Already accepted or further — do nothing
        if ride.status in ("accepted", "arrived", "started", "completed", "cancelled"):
            print(f"RIDE ALREADY IN STATUS: {ride.status}")
            return

        print("DRIVER DID NOT ACCEPT — RETRYING DISPATCH")

        # Capture old driver before reset
        old_driver_id = str(ride.driver_id) if ride.driver_id else None

        # Track rejected drivers
        rejected = list(ride.rejected_drivers or [])
        if old_driver_id and old_driver_id not in rejected:
            rejected.append(old_driver_id)

        # Reset ride
        ride.driver_id = None
        ride.status = "searching"
        ride.rejected_drivers = rejected
        db.commit()
        db.refresh(ride)

        # Find next available driver
        next_driver = find_best_driver(
            db,
            ride.pickup_lat,
            ride.pickup_lng,
            excluded_drivers=rejected
        )

        if next_driver:

            ride.driver_id = next_driver.id
            ride.status = "assigned"
            db.commit()
            db.refresh(ride)

            print(f"NEW DRIVER ASSIGNED: {next_driver.id}")

            await manager.send_to_driver(
                str(next_driver.id),
                json.dumps({
                    "type": "new_ride",
                    "ride_id": ride.id,
                    "pickup": ride.pickup_location,
                    "drop": ride.drop_location
                })
            )

            await manager.send_to_rider(
                str(ride.rider_id),
                json.dumps({
                    "type": "driver_reassigned",
                    "ride_id": ride.id,
                    "driver_id": next_driver.id
                })
            )

            # Schedule another retry
            asyncio.create_task(retry_dispatch(ride.id))

        else:

            print("NO DRIVERS AVAILABLE — CANCELLING RIDE")

            ride.status = "cancelled"
            db.commit()

            await manager.send_to_rider(
                str(ride.rider_id),
                json.dumps({
                    "type": "no_drivers_available",
                    "ride_id": ride.id
                })
            )

    finally:
        db.close()
