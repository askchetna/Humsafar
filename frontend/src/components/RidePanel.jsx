import { useState } from "react"
import useRideStore from "../store/rideStore"
import useAuthStore from "../store/authStore"
import StatusBadge from "./StatusBadge"
import DriverCard from "./DriverCard"
import socketService from "../services/socket"
import toast from "react-hot-toast"

const STEPS = ["searching", "assigned", "accepted", "arrived", "started", "completed"]

function RideTimeline({ status }) {
    const labels = {
        searching: "Searching",
        assigned: "Assigned",
        accepted: "Accepted",
        arrived: "Arrived",
        started: "Started",
        completed: "Done"
    }
    const currentIdx = STEPS.indexOf(status)
    return (
        <div className="flex items-center gap-1 w-full mb-4">
            {STEPS.map((step, i) => (
                <div key={step} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i <= currentIdx ? "bg-amber-400" : "bg-neutral-700"
                    }`} />
                    <span className={`text-[10px] hidden sm:block ${
                        i <= currentIdx ? "text-amber-400" : "text-neutral-600"
                    }`}>{labels[step]}</span>
                    {i < STEPS.length - 1 && (
                        <div className={`absolute left-1/2 top-[5px] w-full h-0.5 ${
                            i < currentIdx ? "bg-amber-400" : "bg-neutral-700"
                        }`} style={{ display: "none" }} />
                    )}
                </div>
            ))}
        </div>
    )
}

export default function RidePanel() {
    const { user } = useAuthStore()
    const {
        pickup, destination, setPickup, setDestination,
        currentRide, eta, requestRide, cancelRide, setRide,
        setDriverLocation, setEta, clearRide
    } = useRideStore()

    const [loading, setLoading] = useState(false)

    const handleRequest = async () => {
        if (!pickup.trim() || !destination.trim()) {
            toast.error("Enter pickup and destination")
            return
        }
        setLoading(true)
        try {
            const data = {
                pickup_location: pickup,
                drop_location: destination,
                pickup_lat: 33.6844,
                pickup_lng: 73.0479,
                drop_lat: 33.7215,
                drop_lng: 73.0433
            }
            const result = await requestRide(data)
            toast.success("Ride requested!")

            // Connect WebSocket for real-time updates
            if (user?.user_id) {
                socketService.connectAsRider(user.user_id)

                socketService.on("driver_assigned", async (d) => {
                    setEta(d.eta)
                    toast.success("Driver assigned!")
                    // Fetch full ride data with driver info
                    try { await fetchRide(d.ride_id) } catch {}
                })
                socketService.on("driver_reassigned", async (d) => {
                    toast("Driver reassigned")
                    try { await fetchRide(d.ride_id) } catch {}
                })
                socketService.on("driver_location", (d) => {
                    setDriverLocation(d.lat, d.lng)
                })
                socketService.on("ride_accepted", async (d) => {
                    toast.success("Driver is on the way!")
                    try { await fetchRide(d.ride_id) } catch {
                        setRide((prev) => prev ? { ...prev, status: "accepted" } : prev)
                    }
                })
                socketService.on("driver_arrived", (d) => {
                    setRide((prev) => prev ? { ...prev, status: "arrived" } : prev)
                    toast.success("Your driver has arrived!")
                })
                socketService.on("ride_started", () => {
                    setRide((prev) => prev ? { ...prev, status: "started" } : prev)
                    toast("Trip started! Enjoy your ride.")
                })
                socketService.on("ride_completed", (d) => {
                    setRide((prev) => prev ? { ...prev, status: "completed", fare: d.fare } : prev)
                    toast.success(`Trip completed! Fare: ₨${d.fare}`)
                    socketService.disconnect()
                })
                socketService.on("no_drivers_available", () => {
                    clearRide()
                    toast.error("No drivers available. Please try again.")
                    socketService.disconnect()
                })
                socketService.on("ride_cancelled", () => {
                    clearRide()
                    socketService.disconnect()
                })
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to request ride")
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = async () => {
        if (!currentRide?.ride_id && !currentRide?.id) return
        try {
            await cancelRide(currentRide.ride_id || currentRide.id)
            socketService.disconnect()
        } catch {
            toast.error("Could not cancel ride")
        }
    }

    // No active ride — show request form
    if (!currentRide) {
        return (
            <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-5 rounded-t-2xl z-[1000] shadow-2xl">
                <h2 className="text-white font-bold text-lg mb-4">Where to?</h2>

                <div className="space-y-3 mb-4">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-green-400" />
                        <input
                            type="text"
                            placeholder="Pickup location"
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-xl py-3 pl-8 pr-4 focus:outline-none focus:border-amber-400 transition text-sm"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <input
                            type="text"
                            placeholder="Destination"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-xl py-3 pl-8 pr-4 focus:outline-none focus:border-amber-400 transition text-sm"
                        />
                    </div>
                </div>

                <button
                    onClick={handleRequest}
                    disabled={loading}
                    className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition text-sm"
                >
                    {loading ? "Finding Driver..." : "Request Ride"}
                </button>
            </div>
        )
    }

    const status = currentRide.status || "searching"

    // Completed
    if (status === "completed") {
        return (
            <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-5 rounded-t-2xl z-[1000] shadow-2xl">
                <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🎉</div>
                    <h2 className="text-white font-bold text-xl">Trip Completed</h2>
                    {currentRide.fare && (
                        <p className="text-amber-400 text-2xl font-black mt-1">₨{currentRide.fare}</p>
                    )}
                </div>
                <button
                    onClick={() => { clearRide(); socketService.disconnect() }}
                    className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-3.5 rounded-xl transition text-sm"
                >
                    Done
                </button>
            </div>
        )
    }

    // Cancelled
    if (status === "cancelled") {
        return (
            <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-5 rounded-t-2xl z-[1000] shadow-2xl">
                <div className="text-center mb-4">
                    <p className="text-red-400 font-semibold">Ride Cancelled</p>
                </div>
                <button
                    onClick={() => clearRide()}
                    className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3.5 rounded-xl transition text-sm"
                >
                    Back to Home
                </button>
            </div>
        )
    }

    // Active ride
    return (
        <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-5 rounded-t-2xl z-[1000] shadow-2xl">
            <div className="flex items-center justify-between mb-3">
                <StatusBadge status={status} />
                {["searching", "assigned"].includes(status) && (
                    <button
                        onClick={handleCancel}
                        className="text-red-400 text-xs hover:text-red-300 transition"
                    >
                        Cancel
                    </button>
                )}
            </div>

            <RideTimeline status={status} />

            {status === "searching" && (
                <div className="flex items-center gap-3 py-2">
                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <p className="text-neutral-400 text-sm">Finding the best driver nearby...</p>
                </div>
            )}

            {currentRide.driver && (
                <DriverCard driver={currentRide.driver} eta={eta} />
            )}

            <div className="mt-3 flex gap-2 text-xs text-neutral-500">
                <span className="truncate">📍 {pickup}</span>
                <span>→</span>
                <span className="truncate">{destination}</span>
            </div>
        </div>
    )
}
