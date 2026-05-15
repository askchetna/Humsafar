import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"

import Login from "./pages/Login"
import Register from "./pages/Register"
import RiderDashboard from "./pages/RiderDashboard"
import DriverDashboard from "./pages/DriverDashboard"
import ProtectedRoute from "./components/ProtectedRoute"
import useAuthStore from "./store/authStore"

function RootRedirect() {
    const { token, user } = useAuthStore()
    if (!token) return <Navigate to="/login" replace />
    if (user?.role === "driver") return <Navigate to="/driver" replace />
    return <Navigate to="/rider" replace />
}

export default function App() {
    return (
        <BrowserRouter>
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: "#1a1a1a",
                        color: "#fff",
                        border: "1px solid #333",
                        borderRadius: "12px",
                        fontSize: "14px"
                    },
                    success: { iconTheme: { primary: "#fbbf24", secondary: "#000" } }
                }}
            />

            <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                    path="/rider"
                    element={
                        <ProtectedRoute role="rider">
                            <RiderDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/driver"
                    element={
                        <ProtectedRoute role="driver">
                            <DriverDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
