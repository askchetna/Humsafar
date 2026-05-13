driver_connections = {}

rider_connections = {}
from fastapi import WebSocket


class ConnectionManager:

    def __init__(self):

        # ALL CONNECTIONS
        self.active_connections = []

        # DRIVER SOCKETS
        self.driver_connections = {}

        # RIDER SOCKETS
        self.rider_connections = {}

    # GENERIC CONNECT
    async def connect(
        self,
        websocket: WebSocket
    ):

        await websocket.accept()

        self.active_connections.append(websocket)

        print("CONNECTION OPEN")

    # DISCONNECT
    def disconnect(
        self,
        websocket: WebSocket
    ):

        if websocket in self.active_connections:

            self.active_connections.remove(websocket)

        print("CONNECTION CLOSED")

    # DRIVER REGISTER
    async def register_driver(
        self,
        driver_id,
        websocket: WebSocket
    ):

        await websocket.accept()

        self.driver_connections[driver_id] = websocket

        print(f"DRIVER CONNECTED: {driver_id}")

    # RIDER REGISTER
    async def register_rider(
        self,
        rider_id,
        websocket: WebSocket
    ):

        await websocket.accept()

        self.rider_connections[rider_id] = websocket

        print(f"RIDER CONNECTED: {rider_id}")

    # SEND TO DRIVER
    async def send_to_driver(
        self,
        driver_id,
        message
    ):

        websocket = self.driver_connections.get(driver_id)

        if websocket:

            await websocket.send_text(message)

    # SEND TO RIDER
    async def send_to_rider(
        self,
        rider_id,
        message
    ):

        websocket = self.rider_connections.get(rider_id)

        if websocket:

            await websocket.send_text(message)

    # BROADCAST
    async def broadcast(
        self,
        message
    ):

        for connection in self.active_connections:

            await connection.send_text(message)


manager = ConnectionManager()

async def connect_rider(
    self,
    rider_id,
    websocket
):

    await websocket.accept()

    rider_connections[rider_id] = websocket


def disconnect_rider(
    self,
    rider_id
):

    if rider_id in rider_connections:

        del rider_connections[rider_id]


async def send_to_rider(
    self,
    rider_id,
    message
):

    websocket = rider_connections.get(rider_id)

    if websocket:

        await websocket.send_text(message)