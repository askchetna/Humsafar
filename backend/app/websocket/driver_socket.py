from fastapi import APIRouter
from fastapi import WebSocket
from fastapi import WebSocketDisconnect

import json

from sqlalchemy.orm import Session

from app.database.session import SessionLocal

from app.modules.rides.models import Ride

from app.websocket.connection_manager import (
    manager
)

router = APIRouter()


@router.websocket("/ws/drivers/{driver_id}")
async def driver_socket(
    websocket: WebSocket,
    driver_id: str
):

    await manager.register_driver(
        driver_id,
        websocket
    )

    print(f"DRIVER CONNECTED: {driver_id}")

    db: Session = SessionLocal()

    try:

        while True:

            data = await websocket.receive_text()

            parsed_data = json.loads(data)

            print("DRIVER DATA:", parsed_data)

            event_type = parsed_data.get("type")

            # ====================================
            # ACCEPT RIDE EVENT
            # ====================================
            if event_type == "accept_ride":

                await manager.send_to_rider(

                    parsed_data["rider_id"],

                    json.dumps({
                        "type": "ride_accepted",
                        "driver_id": driver_id
                    })
                )

            # ====================================
            # DRIVER LOCATION UPDATE
            # ====================================
            elif event_type == "location_update":

                # FIND ACTIVE RIDE
                ride = db.query(
                    Ride
                ).filter(
                    Ride.driver_id == driver_id,
                    Ride.status.in_([
                        "assigned",
                        "accepted",
                        "started"
                    ])
                ).first()

                # SEND ONLY TO RIDER
                if ride:

                    await manager.send_to_rider(

                        str(ride.rider_id),

                        json.dumps({

                            "type": "driver_location",

                            "driver_id": driver_id,

                            "lat": parsed_data["lat"],

                            "lng": parsed_data["lng"],

                            "status": parsed_data["status"]
                        })
                    )

    except WebSocketDisconnect:

        manager.disconnect(websocket)

        print("Driver disconnected")

    finally:

        db.close()