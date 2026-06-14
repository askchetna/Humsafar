import { useState, useEffect } from "react"
import useRideStore from "../store/rideStore"
import StatusBadge from "./StatusBadge"
import DriverCard from "./DriverCard"
import api from "../api/axios"
import { haversineKm, estimateFare, geocodeAddress } from "../utils/map"
import { RIDE_TYPES } from "../utils/constants"
import toast from "react-hot-toast"

function CompletedPanel({ currentRide, onDone }) {
    const [paying, setPaying] = useState(false)
    const [paid, setPaid] = useState(false)

    const handlePay = async () => {
        const rideId = currentRide?.ride_id || currentRide?.id
        if (!rideId) return
        setPaying(true)
        try {
            const createRes = await api.post("/payments/create", {
                ride_id: rideId,
                method: "cash"
            })
            await api.post(`/payments/complete/${createRes.data.id}`, {})
            setPaid(true)
            toast.success("Payment completed!")
        } catch (err) {
            toast.error(err.response?.data?.detail || "Payment failed")
        } finally {
            setPaying(false)
        }
    }

    return (
        <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-5 rounded-t-2xl z-[1000] shadow-2xl">
            <div className="text-center mb-4">
                <div className="text-4xl mb-2">🎉</div>
                <h2 className="text-white font-bold text-xl">Trip Completed</h2>
                {currentRide.fare && (
                    <p className="text-amber-400 text-2xl font-black mt-1">₨{currentRide.fare}</p>
                )}
            </div>

            {!paid ? (
                <button
                    onClick={handlePay}
                    disabled={paying}
                    className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition text-sm mb-2"
                >
                    {paying ? "Processing..." : "Pay Now (Cash)"}
                </button>
            ) : (
                <p className="text-green-400 text-sm text-center mb-2">Payment successful ✓</p>
            )}

            <button
                onClick={onDone}
                className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-3.5 rounded-xl transition text-sm"
            >
                Done
            </button>
        </div>
    )
}

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
                </div>
            ))}
        </div>
    )
}

export default function RidePanel({ currentLocation }) {
    const {
        pickup, destination, setPickup, setDestination,
        currentRide, eta, requestRide, cancelRide, clearRide
    } = useRideStore()

    const [loading, setLoading] = useState(false)
    const [rideType, setRideType] = useState(RIDE_TYPES.STANDARD)
    const [estimatedFare, setEstimatedFare] = useState(null)
    const [estimating, setEstimating] = useState(false)
    const [packageDescription, setPackageDescription] = useState("")

    const [dropCoords, setDropCoords] = useState(null)

    useEffect(() => {
        if (!destination.trim() || !currentLocation) {
            setDropCoords(null)
            setEstimatedFare(null)
            return
        }

        const timer = setTimeout(async () => {
            setEstimating(true)
            try {
                const geo = await geocodeAddress(destination, currentLocation)
                const drop = geo
                    ? { lat: geo.lat, lng: geo.lng }
                    : {
                        lat: currentLocation.lat + 0.05,
                        lng: currentLocation.lng + 0.05
                    }
                setDropCoords(drop)

                const res = await api.post("/rides/estimate", {
                    pickup_lat: currentLocation.lat,
                    pickup_lng: currentLocation.lng,
                    drop_lat: drop.lat,
                    drop_lng: drop.lng,
                    ride_type: rideType
                })
                setEstimatedFare(res.data.fare)
            } catch {
                const fallback = {
                    lat: currentLocation.lat + 0.05,
                    lng: currentLocation.lng + 0.05
                }
                setDropCoords(fallback)
                const dist = haversineKm(
                    currentLocation.lat,
                    currentLocation.lng,
                    fallback.lat,
                    fallback.lng
                )
                setEstimatedFare(estimateFare(dist, rideType))
            } finally {
                setEstimating(false)
            }
        }, 600)

        return () => clearTimeout(timer)
    }, [destination, currentLocation, rideType])

    const handleRequest = async () => {
        if (!pickup.trim() || !destination.trim()) {
            toast.error("Enter pickup and destination")
            return
        }
        if (!currentLocation) {
            toast.error("Waiting for your location...")
            return
        }
        if (rideType === RIDE_TYPES.DELIVERY && !packageDescription.trim()) {
            toast.error("Describe the package for delivery")
            return
        }

        setLoading(true)
        try {
            let drop = dropCoords
            if (!drop) {
                const geo = await geocodeAddress(destination, currentLocation)
                drop = geo
                    ? { lat: geo.lat, lng: geo.lng }
                    : {
                        lat: currentLocation.lat + 0.05,
                        lng: currentLocation.lng + 0.05
                    }
            }

            const data = {
                pickup_location: pickup,
                drop_location: destination,
                pickup_lat: currentLocation.lat,
                pickup_lng: currentLocation.lng,
                drop_lat: drop.lat,
                drop_lng: drop.lng,
                ride_type: rideType,
                fare: estimatedFare,
                package_description: rideType === RIDE_TYPES.DELIVERY ? packageDescription : null
            }

            await requestRide(data)
            toast.success("Ride requested!")
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
        } catch {
            toast.error("Could not cancel ride")
        }
    }

    if (!currentRide) {
        return (
            <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-5 rounded-t-2xl z-[1000] shadow-2xl">
                <h2 className="text-white font-bold text-lg mb-4">Where to?</h2>

                <div className="flex gap-2 mb-3">
                    {[RIDE_TYPES.STANDARD, RIDE_TYPES.DELIVERY].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setRideType(type)}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize border transition ${
                                rideType === type
                                    ? "bg-amber-400 border-amber-400 text-black"
                                    : "bg-neutral-800 border-neutral-700 text-neutral-400"
                            }`}
                        >
                            {type === RIDE_TYPES.DELIVERY ? "📦 Delivery" : "🚗 Ride"}
                        </button>
                    ))}
                </div>

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

                {rideType === RIDE_TYPES.DELIVERY && (
                    <input
                        type="text"
                        placeholder="Package description (e.g. documents, food)"
                        value={packageDescription}
                        onChange={(e) => setPackageDescription(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-400 transition text-sm mb-3"
                    />
                )}

                {estimatedFare && (
                    <p className="text-amber-400 text-sm font-semibold mb-3 text-center">
                        {estimating ? "Calculating fare..." : `Estimated fare: ₨${estimatedFare}`}
                    </p>
                )}

                <button
                    onClick={handleRequest}
                    disabled={loading || !currentLocation}
                    className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition text-sm"
                >
                    {loading ? "Finding Driver..." : "Request Ride"}
                </button>
            </div>
        )
    }

    const status = currentRide.status || "searching"

    if (status === "completed") {
        return (
            <CompletedPanel
                currentRide={currentRide}
                onDone={() => clearRide()}
            />
        )
    }

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
