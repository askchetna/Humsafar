from fastapi import WebSocket
from fastapi.websockets import WebSocketState


class ConnectionManager:

    def __init__(self):

        # DRIVER SOCKETS
        self.driver_connections = {}

        # RIDER SOCKETS
        self.rider_connections = {}

    # =====================================
    # REGISTER DRIVER
    # =====================================

    async def register_driver(
        self,
        driver_id,
        websocket: WebSocket
    ):

        await websocket.accept()

        self.driver_connections[
            driver_id
        ] = websocket

        print(
            f"DRIVER CONNECTED: {driver_id}"
        )

    # =====================================
    # REGISTER RIDER
    # =====================================

    async def register_rider(
        self,
        rider_id,
        websocket: WebSocket
    ):

        await websocket.accept()

        self.rider_connections[
            rider_id
        ] = websocket

        print(
            f"RIDER CONNECTED: {rider_id}"
        )

    # =====================================
    # DISCONNECT DRIVER
    # =====================================

    def disconnect_driver(
        self,
        driver_id
    ):

        if driver_id in self.driver_connections:

            del self.driver_connections[
                driver_id
            ]

        print(
            f"DRIVER DISCONNECTED: {driver_id}"
        )

    # =====================================
    # DISCONNECT RIDER
    # =====================================

    def disconnect_rider(
        self,
        rider_id
    ):

        if rider_id in self.rider_connections:

            del self.rider_connections[
                rider_id
            ]

        print(
            f"RIDER DISCONNECTED: {rider_id}"
        )

    # =====================================
    # SAFE SEND TO RIDER
    # =====================================

    async def send_to_rider(
        self,
        rider_id,
        message: dict
    ):

        websocket = self.rider_connections.get(
            rider_id
        )

        if not websocket:
            return

        try:

            if websocket.client_state == WebSocketState.CONNECTED:

                await websocket.send_json(
                    message
                )

        except Exception as e:

            print(
                "RIDER SEND ERROR:",
                e
            )

            self.disconnect_rider(
                rider_id
            )

    # =====================================
    # SAFE SEND TO DRIVER
    # =====================================

    async def send_to_driver(
        self,
        driver_id,
        message: dict
    ):

        websocket = self.driver_connections.get(
            driver_id
        )

        if not websocket:
            return

        try:

            if websocket.client_state == WebSocketState.CONNECTED:

                await websocket.send_json(
                    message
                )

        except Exception as e:

            print(
                "DRIVER SEND ERROR:",
                e
            )

            self.disconnect_driver(
                driver_id
            )

    # =====================================
    # BROADCAST TO DRIVERS
    # =====================================

    async def broadcast_to_drivers(
        self,
        message: dict
    ):

        disconnected = []

        for driver_id, websocket in self.driver_connections.items():

            try:

                if websocket.client_state == WebSocketState.CONNECTED:

                    await websocket.send_json(
                        message
                    )

            except Exception as e:

                print(
                    "BROADCAST ERROR:",
                    e
                )

                disconnected.append(
                    driver_id
                )

        # CLEAN DEAD SOCKETS

        for driver_id in disconnected:

            self.disconnect_driver(
                driver_id
            )


manager = ConnectionManager()