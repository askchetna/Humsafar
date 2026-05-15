import { Link, useNavigate } from "react-router-dom"
import useAuthStore from "../store/authStore"
import socketService from "../services/socket"

export default function Navbar() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        socketService.disconnect()
        logout()
        navigate("/login")
    }

    return (
        <nav className="flex items-center justify-between px-5 py-3 bg-neutral-900 border-b border-neutral-800 z-50 shrink-0">
            <Link to="/" className="flex items-center gap-2">
                <span className="text-amber-400 text-xl font-black tracking-tight">HUMSAFAR</span>
                <span className="text-neutral-500 text-xs hidden sm:block">AI Ride Platform</span>
            </Link>

            {user && (
                <div className="flex items-center gap-3">
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
        </nav>
    )
}
