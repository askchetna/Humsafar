import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import MapView from "../components/MapView"
import RidePanel from "../components/RidePanel"
import useRideStore from "../store/rideStore"
import useAuthStore from "../store/authStore"
import api from "../api/axios"
import toast from "react-hot-toast"

export default function RiderDashboard() {
    const { user } = useAuthStore()
    const { currentRide, driverLocation, rideHistory, fetchHistory } = useRideStore()
    const [showHistory, setShowHistory] = useState(false)
    const [loadingHistory, setLoadingHistory] = useState(false)

    useEffect(() => {
        // Set up page title
        document.title = "Humsafar — Rider"
    }, [])

    const handleViewHistory = async () => {
        setShowHistory(true)
        setLoadingHistory(true)
        try {
            await fetchHistory()
        } catch {
            toast.error("Could not load history")
        } finally {
            setLoadingHistory(false)
        }
    }

    const STATUS_COLOR = {
        completed: "text-green-400",
        cancelled: "text-red-400",
        searching: "text-blue-400",
        assigned: "text-amber-400",
        accepted: "text-amber-400",
        arrived: "text-green-400",
        started: "text-purple-400"
    }

    return (
        <div className="h-screen w-screen bg-neutral-950 flex flex-col overflow-hidden">
            <Navbar />

            {/* History Modal */}
            {showHistory && (
                <div className="absolute inset-0 z-[2000] bg-neutral-950/95 flex flex-col">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
                        <h2 className="text-white font-bold text-lg">Ride History</h2>
                        <button
                            onClick={() => setShowHistory(false)}
                            className="text-neutral-400 hover:text-white text-2xl transition"
                        >×</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        {loadingHistory && (
                            <div className="text-center text-neutral-500 py-10">Loading...</div>
                        )}
                        {!loadingHistory && rideHistory.length === 0 && (
                            <div className="text-center text-neutral-500 py-10">No rides yet</div>
                        )}
                        {rideHistory.map((ride) => (
                            <div key={ride.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{ride.pickup_location}</p>
                                        <p className="text-neutral-500 text-xs mt-0.5 truncate">→ {ride.drop_location}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-sm font-semibold capitalize ${STATUS_COLOR[ride.status] || "text-neutral-400"}`}>
                                            {ride.status}
                                        </p>
                                        {ride.fare && (
                                            <p className="text-neutral-400 text-xs mt-0.5">₨{ride.fare}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Map + Panel */}
            <div className="relative flex-1 overflow-hidden">
                <MapView
                    driverPosition={driverLocation}
                    pickupPosition={
                        currentRide ? { lat: 33.6844, lng: 73.0479 } : null
                    }
                />

                {/* History button */}
                {!currentRide && (
                    <button
                        onClick={handleViewHistory}
                        className="absolute top-3 right-3 z-[999] bg-neutral-900/90 border border-neutral-700 text-neutral-300 text-xs px-3 py-2 rounded-lg hover:border-neutral-500 hover:text-white transition backdrop-blur"
                    >
                        My Rides
                    </button>
                )}

                <RidePanel />
            </div>
        </div>
    )
}
