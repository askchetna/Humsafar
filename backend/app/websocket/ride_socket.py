import json

from fastapi import APIRouter
from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from app.websocket.connection_manager import (
    manager
)

router = APIRouter()


@router.websocket("/ws/rides/{rider_id}")
async def rider_socket(
    websocket: WebSocket,
    rider_id: str
):

    # CONNECT RIDER

    await manager.register_rider(
        rider_id,
        websocket
    )

    print(f"RIDER CONNECTED: {rider_id}")

    try:

        while True:

            # RECEIVE MESSAGE
            data = await websocket.receive_text()

            print("RIDER EVENT:", data)

            # PARSE JSON
            parsed_data = json.loads(data)

            # SEND TO ALL RIDERS
            for rider_ws in manager.rider_connections.values():

                await rider_ws.send_text(
                    json.dumps(parsed_data)
                )

    except WebSocketDisconnect:

        manager.rider_connections.pop(
            rider_id,
            None
        )

        print("RIDER DISCONNECTED")