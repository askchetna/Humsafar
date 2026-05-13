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

    await manager.connect_rider(
        rider_id,
        websocket
    )

    print(f"RIDER CONNECTED: {rider_id}")

    try:

        while True:

            data = await websocket.receive_text()

            print("RIDER EVENT:", data)

    except WebSocketDisconnect:

        manager.disconnect_rider(
            rider_id
        )

        print("RIDER DISCONNECTED")