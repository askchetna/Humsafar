import { Link, useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import useAuthStore from "../store/authStore"
import socketService from "../services/socketService"
import api from "../api/axios"

export default function Navbar() {
    const { user, logout, token } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()
    const [unread, setUnread] = useState(0)
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState([])

    useEffect(() => {
        const publicPaths = ["/login", "/register", "/home"]
        if (!token || !user || publicPaths.includes(location.pathname)) {
            setUnread(0)
            return
        }

        const fetchUnread = () => {
            api.get("/notifications/unread-count")
                .then((res) => setUnread(res.data.count))
                .catch(() => {})
        }

        fetchUnread()
        const interval = setInterval(fetchUnread, 30000)
        return () => clearInterval(interval)
    }, [token, user, location.pathname])

    const loadNotifications = async () => {
        try {
            const res = await api.get("/notifications/")
            setNotifications(res.data)
            setShowNotifications(true)
        } catch {
            setNotifications([])
        }
    }

    const markRead = async (id) => {
        try {
            await api.post(`/notifications/${id}/read`)
            setUnread((c) => Math.max(0, c - 1))
            setNotifications((list) =>
                list.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            )
        } catch {
            /* ignore */
        }
    }

    const handleLogout = () => {
        socketService.disconnect()
        logout()
        navigate("/login")
    }

    return (
        <nav className="flex items-center justify-between px-5 py-3 bg-neutral-900 border-b border-neutral-800 z-50 shrink-0 relative">
            <Link to="/home" className="flex items-center gap-2">
                <span className="text-amber-400 text-xl font-black tracking-tight">HUMSAFAR</span>
                <span className="text-neutral-500 text-xs hidden sm:block">AI Ride Platform</span>
            </Link>

            {user && (
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadNotifications}
                        className="relative text-neutral-400 hover:text-white transition p-1"
                        aria-label="Notifications"
                    >
                        🔔
                        {unread > 0 && (
                            <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {unread > 9 ? "9+" : unread}
                            </span>
                        )}
                    </button>

                    <div className="text-right hidden sm:block">
                        <p className="text-white text-sm font-medium">{user.phone}</p>
                        <p className="text-neutral-500 text-xs capitalize">{user.role}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-black font-bold text-sm">
                        {user.phone?.[0] || "U"}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-neutral-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition"
                    >
                        Logout
                    </button>
                </div>
            )}

            {showNotifications && (
                <div className="absolute top-full right-5 mt-1 w-80 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-[3000] max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                        <span className="font-bold text-sm">Notifications</span>
                        <button
                            onClick={() => setShowNotifications(false)}
                            className="text-neutral-500 hover:text-white"
                        >
                            ×
                        </button>
                    </div>
                    {notifications.length === 0 ? (
                        <p className="text-neutral-500 text-sm text-center py-6">No notifications</p>
                    ) : (
                        notifications.map((n) => (
                            <button
                                key={n.id}
                                onClick={() => !n.is_read && markRead(n.id)}
                                className={`w-full text-left px-4 py-3 border-b border-neutral-800/50 hover:bg-neutral-800 transition ${
                                    !n.is_read ? "bg-neutral-800/30" : ""
                                }`}
                            >
                                <p className="text-sm font-medium">{n.title}</p>
                                <p className="text-neutral-500 text-xs mt-0.5">{n.message}</p>
                            </button>
                        ))
                    )}
                </div>
            )}
        </nav>
    )
}
