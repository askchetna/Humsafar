import { Navigate } from "react-router-dom"
import useAuthStore from "../store/authStore"

export default function ProtectedRoute({ children, role }) {
    const { token, user } = useAuthStore()

    if (!token) {
        return <Navigate to="/login" replace />
    }

    if (role && user?.role !== role) {
        if (user?.role === "admin") return <Navigate to="/admin" replace />
        if (user?.role === "driver") return <Navigate to="/driver" replace />
        return <Navigate to="/rider" replace />
    }

    return children
}
