import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.modules.rides.models import Ride
from app.modules.drivers.models import DriverProfile
from app.dependencies.auth import authenticate_websocket
from app.websocket.connection_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/drivers/{driver_id}")
async def driver_socket(
    websocket: WebSocket,
    driver_id: str,
    token: str = Query(default=None)
):

    payload = await authenticate_websocket(websocket, token)
    if not payload:
        return

    db: Session = SessionLocal()

    try:
        profile = db.query(DriverProfile).filter(
            DriverProfile.id == driver_id
        ).first()

        if not profile or profile.user_id != payload["user_id"]:
            await websocket.close(code=4003, reason="Unauthorized driver")
            return

        await manager.register_driver(driver_id, websocket)
        logger.info("Driver connected: %s", driver_id)

        while True:
            data = await websocket.receive_text()
            parsed_data = json.loads(data)
            event_type = parsed_data.get("type")

            if event_type == "location_update":
                ride = db.query(Ride).filter(
                    Ride.driver_id == driver_id,
                    Ride.status.in_([
                        "assigned",
                        "accepted",
                        "arrived",
                        "started"
                    ])
                ).first()

                if ride:
                    await manager.send_to_rider(
                        str(ride.rider_id),
                        {
                            "type": "driver_location",
                            "driver_id": driver_id,
                            "lat": parsed_data["lat"],
                            "lng": parsed_data["lng"],
                            "status": parsed_data.get("status")
                        }
                    )

            elif event_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect_driver(driver_id)
        logger.info("Driver disconnected: %s", driver_id)

    finally:
        db.close()
