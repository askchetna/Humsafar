class SocketService {

    constructor() {
        this.socket = null
        this.handlers = {}
        this.reconnectTimer = null
        this.currentPath = null
        this.shouldReconnect = true
        this.reconnectAttempts = 0
        this.maxReconnectDelay = 30000
    }

    connect(path) {
        if (this.socket) {
            this.disconnect()
        }

        this.currentPath = path
        this.shouldReconnect = true
        this.reconnectAttempts = 0
        this._open(path)
    }

    _open(path) {
        const protocol =
            window.location.protocol === "https:" ? "wss:" : "ws:"

        const token = localStorage.getItem("token") || ""
        const separator = path.includes("?") ? "&" : "?"
        const url =
            `${protocol}//${window.location.host}${path}${separator}token=${encodeURIComponent(token)}`

        try {
            this.socket = new WebSocket(url)

            this.socket.onopen = () => {
                console.log(`[WS] Connected: ${path}`)
                clearTimeout(this.reconnectTimer)
                this.reconnectAttempts = 0
                this._emit("connect")
            }

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    console.log("[WS MESSAGE]", data)
                    this._emit("message", data)
                    if (data.type) {
                        this._emit(data.type, data)
                    }
                } catch (err) {
                    console.warn("[WS] Failed to parse message:", event.data)
                }
            }

            this.socket.onclose = () => {
                console.log("[WS] Disconnected")
                this._emit("disconnect")

                if (this.shouldReconnect && this.currentPath) {
                    const delay = Math.min(
                        1000 * Math.pow(2, this.reconnectAttempts),
                        this.maxReconnectDelay
                    )
                    this.reconnectAttempts += 1

                    this.reconnectTimer = setTimeout(() => {
                        console.log("[WS] Reconnecting...")
                        this._open(this.currentPath)
                    }, delay)
                }
            }

            this.socket.onerror = (err) => {
                console.error("[WS] Error:", err)
                this._emit("error", err)
            }

        } catch (err) {
            console.error("[WS] Failed to open:", err)
        }
    }

    connectAsRider(userId) {
        this.connect(`/ws/rides/${userId}`)
    }

    connectAsDriver(driverId) {
        this.connect(`/ws/drivers/${driverId}`)
    }

    on(event, handler) {
        this.handlers[event] = handler
    }

    off(event) {
        delete this.handlers[event]
    }

    _emit(event, data) {
        if (this.handlers[event]) {
            this.handlers[event](data)
        }
    }

    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data))
        } else {
            console.warn("[WS] Socket not open:", data)
        }
    }

    disconnect() {
        this.shouldReconnect = false
        clearTimeout(this.reconnectTimer)

        if (this.socket) {
            this.socket.close()
        }

        this.socket = null
        this.handlers = {}
        this.currentPath = null
    }

    isConnected() {
        return (
            this.socket &&
            this.socket.readyState === WebSocket.OPEN
        )
    }
}

const socketService = new SocketService()

export default socketService
