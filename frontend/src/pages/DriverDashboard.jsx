import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import MapView from "../components/MapView"
import StatusBadge from "../components/StatusBadge"
import useDriverStore from "../store/driverStore"
import useAuthStore from "../store/authStore"
import useLocation from "../hooks/useLocation"
import socketService from "../services/socketService"
import api from "../api/axios"
import { RIDE_STATUS_COLORS, DEFAULT_MAP_CENTER } from "../utils/constants"
import toast from "react-hot-toast"

export default function DriverDashboard() {
    const { user } = useAuthStore()
    const {
        profile, isOnline, currentRide, incomingRide,
        fetchProfile, goOnline, goOffline,
        acceptRide, markArrived, startRide, completeRide,
        setIncomingRide, clearIncomingRide, updateLocation
    } = useDriverStore()

    const { location: myLocation, error: locationError } = useLocation({
        watch: true,
        enableHighAccuracy: true,
        maximumAge: 5000,
        fallback: { lat: DEFAULT_MAP_CENTER[0], lng: DEFAULT_MAP_CENTER[1] }
    })

    const [setupDone, setSetupDone] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [showProfileSetup, setShowProfileSetup] = useState(false)
    const [history, setHistory] = useState([])
    const [actionLoading, setActionLoading] = useState(false)
    const [profileForm, setProfileForm] = useState({
        license_number: "",
        vehicle_type: "economy",
        vehicle_number: ""
    })

    useEffect(() => {
        fetchProfile().then((p) => {
            if (!p) setShowProfileSetup(true)
        })
        document.title = "Humsafar — Driver"
    }, [])

    useEffect(() => {
        if (!profile?.id || setupDone) return

        setSetupDone(true)
        socketService.connectAsDriver(profile.id)

        socketService.on("new_ride", (d) => {
            setIncomingRide(d)
            toast("🚗 New ride request!", { duration: 8000 })
        })

        socketService.on("ride_cancelled", (d) => {
            if (
                currentRide?.ride_id === d.ride_id ||
                currentRide?.id === d.ride_id
            ) {
                useDriverStore.setState({ currentRide: null })
                toast("Ride was cancelled by rider")
            }
            clearIncomingRide()
        })

        return () => {
            socketService.off("new_ride")
            socketService.off("ride_cancelled")
            socketService.disconnect()
        }
    }, [profile?.id, setupDone])

    useEffect(() => {
        if (!myLocation || !profile?.id) return
        if (!isOnline && !currentRide) return

        updateLocation(myLocation.lat, myLocation.lng)

        const interval = setInterval(() => {
            updateLocation(myLocation.lat, myLocation.lng)

            if (currentRide && socketService.isConnected()) {
                socketService.send({
                    type: "location_update",
                    lat: myLocation.lat,
                    lng: myLocation.lng,
                    status: currentRide.status
                })
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [myLocation, isOnline, currentRide, profile?.id])

    const handleToggleOnline = async () => {
        if (!myLocation) {
            toast.error("Location unavailable")
            return
        }
        if (isOnline) {
            await goOffline()
        } else {
            await goOnline(myLocation.lat, myLocation.lng)
        }
    }

    const handleCreateProfile = async (e) => {
        e.preventDefault()
        if (!profileForm.license_number.trim()) {
            toast.error("License number required")
            return
        }
        try {
            await api.post("/drivers/create-profile", profileForm)
            toast.success("Profile created!")
            setShowProfileSetup(false)
            await fetchProfile()
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to create profile")
        }
    }

    const handleAccept = async () => {
        if (!incomingRide?.ride_id) return
        setActionLoading(true)
        try {
            await acceptRide(incomingRide.ride_id)
            toast.success("Ride accepted!")
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to accept")
        } finally {
            setActionLoading(false)
        }
    }

    const handleDecline = () => {
        clearIncomingRide()
        toast("Ride declined")
    }

    const handleArrived = async () => {
        const rideId = currentRide?.ride_id || currentRide?.id
        if (!rideId) return
        setActionLoading(true)
        try {
            await markArrived(rideId)
            toast.success("Marked as arrived")
        } catch (err) {
            toast.error(err.response?.data?.detail || "Error")
        } finally {
            setActionLoading(false)
        }
    }

    const handleStart = async () => {
        const rideId = currentRide?.ride_id || currentRide?.id
        if (!rideId) return
        setActionLoading(true)
        try {
            await startRide(rideId)
            toast.success("Ride started!")
        } catch (err) {
            toast.error(err.response?.data?.detail || "Error")
        } finally {
            setActionLoading(false)
        }
    }

    const handleComplete = async () => {
        const rideId = currentRide?.ride_id || currentRide?.id
        if (!rideId) return
        setActionLoading(true)
        try {
            await completeRide(rideId)
        } catch (err) {
            toast.error(err.response?.data?.detail || "Error")
        } finally {
            setActionLoading(false)
        }
    }

    const handleViewHistory = async () => {
        setShowHistory(true)
        try {
            const res = await api.get("/rides/driver-rides/list")
            setHistory(res.data)
        } catch {
            toast.error("Could not load history")
        }
    }

    return (
        <div className="h-screen w-screen bg-neutral-950 flex flex-col overflow-hidden">
            <Navbar />

            {showProfileSetup && (
                <div className="absolute inset-0 z-[2000] bg-neutral-950/95 flex items-center justify-center p-4">
                    <form
                        onSubmit={handleCreateProfile}
                        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
                    >
                        <h2 className="text-white font-bold text-xl mb-4">Driver Setup</h2>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="License number"
                                value={profileForm.license_number}
                                onChange={(e) =>
                                    setProfileForm({ ...profileForm, license_number: e.target.value })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm"
                            />
                            <input
                                type="text"
                                placeholder="Vehicle number"
                                value={profileForm.vehicle_number}
                                onChange={(e) =>
                                    setProfileForm({ ...profileForm, vehicle_number: e.target.value })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm"
                            />
                            <select
                                value={profileForm.vehicle_type}
                                onChange={(e) =>
                                    setProfileForm({ ...profileForm, vehicle_type: e.target.value })
                                }
                                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl px-4 py-3 text-sm"
                            >
                                <option value="economy">Economy</option>
                                <option value="comfort">Comfort</option>
                                <option value="premium">Premium</option>
                                <option value="bike">Bike</option>
                                <option value="delivery">Delivery</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="w-full mt-4 bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 rounded-xl text-sm"
                        >
                            Create Profile
                        </button>
                    </form>
                </div>
            )}

            {showHistory && (
                <div className="absolute inset-0 z-[2000] bg-neutral-950/95 flex flex-col">
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
                        {history.length === 0 && (
                            <div className="text-center text-neutral-500 py-10">No rides yet</div>
                        )}
                        {history.map((ride) => (
                            <div
                                key={ride.id}
                                className="bg-neutral-900 border border-neutral-800 rounded-xl p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-white text-sm font-medium truncate">
                                            {ride.pickup_location}
                                        </p>
                                        <p className="text-neutral-500 text-xs mt-0.5 truncate">
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
                                            <p className="text-neutral-400 text-xs mt-0.5">₨{ride.fare}</p>
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
                    center={myLocation ? [myLocation.lat, myLocation.lng] : DEFAULT_MAP_CENTER}
                    pickupPosition={currentRide ? {
                        lat: currentRide.pickup_lat || myLocation?.lat,
                        lng: currentRide.pickup_lng || myLocation?.lng
                    } : myLocation}
                />

                <div className="absolute top-3 left-3 z-[999] flex flex-col gap-2">
                    <button
                        onClick={handleToggleOnline}
                        disabled={!profile}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition border shadow-lg backdrop-blur disabled:opacity-50 ${
                            isOnline
                                ? "bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30"
                                : "bg-neutral-900/90 border-neutral-700 text-neutral-300 hover:border-neutral-500"
                        }`}
                    >
                        {isOnline ? "🟢 Online" : "⚫ Go Online"}
                    </button>

                    {!currentRide && !incomingRide && (
                        <button
                            onClick={handleViewHistory}
                            className="px-4 py-2 rounded-xl text-xs border bg-neutral-900/90 border-neutral-700 text-neutral-400 hover:text-white transition backdrop-blur"
                        >
                            My Rides
                        </button>
                    )}
                </div>

                {locationError && (
                    <div className="absolute top-3 right-3 z-[999] bg-red-950/90 border border-red-800 rounded-xl px-3 py-2 text-xs text-red-300">
                        GPS unavailable — using default location
                    </div>
                )}

                {isOnline && !incomingRide && !currentRide && (
                    <div className="absolute top-3 right-3 z-[999]">
                        <div className="bg-neutral-900/90 border border-neutral-700 backdrop-blur rounded-xl px-3 py-2 text-xs text-neutral-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Waiting for rides
                        </div>
                    </div>
                )}

                {incomingRide && (
                    <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 border-t border-amber-500/40 p-5 rounded-t-2xl z-[1000] shadow-2xl">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <h3 className="text-amber-400 font-bold">New Ride Request</h3>
                        </div>
                        <div className="space-y-2 mb-4 text-sm">
                            <div className="flex items-center gap-2 text-neutral-300">
                                <span className="text-green-400">📍</span>
                                <span className="truncate">{incomingRide.pickup || "Pickup location"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-300">
                                <span className="text-amber-400">🎯</span>
                                <span className="truncate">{incomingRide.drop || "Drop location"}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleDecline}
                                className="py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold transition"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAccept}
                                disabled={actionLoading}
                                className="py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black text-sm font-bold transition"
                            >
                                {actionLoading ? "Accepting..." : "Accept"}
                            </button>
                        </div>
                    </div>
                )}

                {currentRide && !incomingRide && (
                    <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-5 rounded-t-2xl z-[1000] shadow-2xl">
                        <div className="flex items-center justify-between mb-3">
                            <StatusBadge status={currentRide.status} />
                        </div>

                        <div className="space-y-1.5 mb-4 text-sm">
                            <div className="flex items-center gap-2 text-neutral-300">
                                <span className="text-green-400">📍</span>
                                <span className="truncate">
                                    {currentRide.pickup || currentRide.pickup_location || "Pickup"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-300">
                                <span className="text-amber-400">🎯</span>
                                <span className="truncate">
                                    {currentRide.drop || currentRide.drop_location || "Destination"}
                                </span>
                            </div>
                        </div>

                        {currentRide.status === "accepted" && (
                            <button
                                onClick={handleArrived}
                                disabled={actionLoading}
                                className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition text-sm"
                            >
                                {actionLoading ? "..." : "I've Arrived"}
                            </button>
                        )}

                        {currentRide.status === "arrived" && (
                            <button
                                onClick={handleStart}
                                disabled={actionLoading}
                                className="w-full bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition text-sm"
                            >
                                {actionLoading ? "..." : "Start Ride"}
                            </button>
                        )}

                        {currentRide.status === "started" && (
                            <button
                                onClick={handleComplete}
                                disabled={actionLoading}
                                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition text-sm"
                            >
                                {actionLoading ? "..." : "Complete Ride"}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
