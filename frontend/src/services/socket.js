class SocketService {
    constructor() {
        this.socket = null
        this.handlers = {}
        this.reconnectTimer = null
        this.currentPath = null
        this.shouldReconnect = true
    }

    connect(path) {
        this.currentPath = path
        this.shouldReconnect = true
        this._open(path)
    }

    _open(path) {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
        const url = `${protocol}//${window.location.host}${path}`

        try {
            this.socket = new WebSocket(url)

            this.socket.onopen = () => {
                console.log(`[WS] Connected: ${path}`)
                clearTimeout(this.reconnectTimer)
                this._emit("connect")
            }

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    this._emit("message", data)
                    // Also emit by event type
                    if (data.type) {
                        this._emit(data.type, data)
                    }
                } catch {
                    console.warn("[WS] Failed to parse message:", event.data)
                }
            }

            this.socket.onclose = () => {
                console.log("[WS] Disconnected")
                this._emit("disconnect")
                if (this.shouldReconnect) {
                    this.reconnectTimer = setTimeout(() => {
                        console.log("[WS] Reconnecting...")
                        this._open(this.currentPath)
                    }, 3000)
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
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data))
        } else {
            console.warn("[WS] Socket not open — cannot send:", data)
        }
    }

    disconnect() {
        this.shouldReconnect = false
        clearTimeout(this.reconnectTimer)
        this.socket?.close()
        this.socket = null
        this.handlers = {}
    }

    isConnected() {
        return this.socket?.readyState === WebSocket.OPEN
    }
}

export const socketService = new SocketService()
export default socketService
