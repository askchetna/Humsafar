import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.dependencies.auth import authenticate_websocket
from app.websocket.connection_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/rides/{rider_id}")
async def rider_socket(
    websocket: WebSocket,
    rider_id: str,
    token: str = Query(default=None)
):

    payload = await authenticate_websocket(websocket, token)
    if not payload:
        return

    if payload["user_id"] != rider_id:
        await websocket.close(code=4003, reason="Unauthorized rider")
        return

    await manager.register_rider(rider_id, websocket)
    logger.info("Rider connected: %s", rider_id)

    try:
        while True:
            data = await websocket.receive_text()
            parsed_data = json.loads(data)

            if parsed_data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect_rider(rider_id)
        logger.info("Rider disconnected: %s", rider_id)
