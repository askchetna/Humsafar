import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import MapView from "../components/MapView"
import RidePanel from "../components/RidePanel"
import useSocket from "../hooks/useSocket"
import { useLocationToast } from "../hooks/useLocation"
import socketService from "../services/socketService"
import useRideStore from "../store/rideStore"
import useAuthStore from "../store/authStore"
import { RIDE_STATUS_COLORS } from "../utils/constants"
import toast from "react-hot-toast"

export default function RiderDashboard() {
    const user = useAuthStore((s) => s.user)

    const {
        currentRide,
        driverLocation,
        rideHistory,
        fetchHistory,
        fetchRide,
        setDriverLocation,
        setEta,
        setRide,
        clearRide,
        updateRideStatus
    } = useRideStore()

    const [showHistory, setShowHistory] = useState(false)
    const [loadingHistory, setLoadingHistory] = useState(false)

    const { location: currentLocation, loading: locationLoading } = useLocationToast({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    })

    useEffect(() => {
        document.title = "Humsafar — Rider"
    }, [])

    useEffect(() => {
        if (!user?.user_id) return

        socketService.connectAsRider(user.user_id)

        return () => socketService.disconnect()
    }, [user?.user_id])

    useSocket(socketService, {
        driver_assigned: async (data) => {
            setEta(data.eta)
            toast.success("Driver assigned!")
            try {
                await fetchRide(data.ride_id)
            } catch {
                updateRideStatus("assigned")
            }
        },

        driver_reassigned: async (data) => {
            toast("Driver reassigned")
            try {
                await fetchRide(data.ride_id)
            } catch {
                updateRideStatus("assigned")
            }
        },

        ride_accepted: async (data) => {
            toast.success("Driver is on the way!")
            try {
                await fetchRide(data.ride_id)
            } catch {
                updateRideStatus("accepted")
            }
        },

        driver_arrived: () => {
            updateRideStatus("arrived")
            toast.success("Your driver has arrived!")
        },

        ride_started: () => {
            updateRideStatus("started")
            toast("Trip started! Enjoy your ride.")
        },

        ride_completed: (data) => {
            setRide((prev) =>
                prev ? { ...prev, status: "completed", fare: data.fare } : prev
            )
            toast.success(`Trip completed! Fare: ₨${data.fare}`)
        },

        driver_location: (data) => {
            setDriverLocation(data.lat, data.lng)
        },

        no_drivers_available: () => {
            clearRide()
            toast.error("No drivers available. Please try again.")
        },

        ride_cancelled: () => {
            clearRide()
            toast("Ride was cancelled")
        }
    })

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

    return (
        <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
            <Navbar />

            {showHistory && (
                <div className="absolute inset-0 z-[2000] bg-black/95 backdrop-blur-lg flex flex-col">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
                        <h2 className="text-white font-bold text-lg">Ride History</h2>
                        <button
                            onClick={() => setShowHistory(false)}
                            className="text-neutral-400 hover:text-white text-2xl transition"
                        >
                            ×
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        {loadingHistory && (
                            <div className="text-center text-neutral-500 py-10">Loading...</div>
                        )}

                        {!loadingHistory && rideHistory.length === 0 && (
                            <div className="text-center text-neutral-500 py-10">No rides yet</div>
                        )}

                        {rideHistory.map((ride) => (
                            <div
                                key={ride.id}
                                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-white text-sm font-medium truncate">
                                            {ride.pickup_location}
                                        </p>
                                        <p className="text-neutral-500 text-xs mt-1 truncate">
                                            → {ride.drop_location}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p
                                            className={`text-sm font-semibold capitalize ${
                                                RIDE_STATUS_COLORS[ride.status] || "text-neutral-400"
                                            }`}
                                        >
                                            {ride.status}
                                        </p>
                                        {ride.fare && (
                                            <p className="text-neutral-400 text-xs mt-1">₨{ride.fare}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="relative flex-1 overflow-hidden">
                <MapView
                    driverPosition={driverLocation}
                    pickupPosition={currentLocation}
                    dropPosition={currentRide?.drop_lat ? {
                        lat: currentRide.drop_lat,
                        lng: currentRide.drop_lng
                    } : null}
                />

                {locationLoading && (
                    <div className="absolute inset-0 z-[1500] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-neutral-900 border border-neutral-700 px-6 py-4 rounded-2xl text-white">
                            Detecting location...
                        </div>
                    </div>
                )}

                {!currentRide && (
                    <button
                        onClick={handleViewHistory}
                        className="absolute top-4 right-4 z-[999] bg-neutral-900/90 border border-neutral-700 text-neutral-300 text-sm px-4 py-2 rounded-xl hover:border-yellow-400 hover:text-white transition backdrop-blur-lg"
                    >
                        My Rides
                    </button>
                )}

                <RidePanel currentLocation={currentLocation} />
            </div>
        </div>
    )
}
