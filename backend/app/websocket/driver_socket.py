from fastapi import APIRouter
from fastapi import WebSocket
from fastapi import WebSocketDisconnect

import json

from app.websocket.connection_manager import manager


router = APIRouter()


@router.websocket("/ws/drivers")
async def driver_socket(
    websocket: WebSocket
):

    await manager.connect(websocket)

    try:

        while True:

            # RECEIVE DATA
            data = await websocket.receive_text()

            # CONVERT JSON STRING → PYTHON DICT
            parsed_data = json.loads(data)

            print("DRIVER DATA:", parsed_data)

            print("LAT:", parsed_data["lat"])

            print("LNG:", parsed_data["lng"])

            # BROADCAST TO ALL CLIENTS
            await manager.broadcast(
                json.dumps({
                    "type": "driver_location",
                    "driver_id": parsed_data["driver_id"],
                    "lat": parsed_data["lat"],
                    "lng": parsed_data["lng"],
                    "status": parsed_data["status"]
                })
            )

    except WebSocketDisconnect:

        manager.disconnect(websocket)

        print("Driver disconnected")