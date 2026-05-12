from fastapi import APIRouter
from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from app.websocket.connection_manager import (
    manager
)

router = APIRouter()


@router.websocket("/ws/rides")
async def ride_socket(
    websocket: WebSocket
):

    await manager.connect(websocket)

    try:

        while True:

            data = await websocket.receive_text()

            print("RIDE EVENT:", data)

            await manager.broadcast(
                f"Ride update: {data}"
            )

    except WebSocketDisconnect:

        manager.disconnect(websocket)

        print("Ride disconnected")
