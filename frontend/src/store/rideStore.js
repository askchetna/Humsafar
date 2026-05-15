import { create } from "zustand"
import api from "../api/axios"
import toast from "react-hot-toast"

const useRideStore = create((set, get) => ({
    // Form inputs
    pickup: "",
    destination: "",
    pickupCoords: null,
    dropCoords: null,

    // Active ride
    currentRide: null,
    driverLocation: null,
    eta: null,

    // Ride history
    rideHistory: [],

    setPickup: (pickup) => set({ pickup }),
    setDestination: (destination) => set({ destination }),
    setPickupCoords: (coords) => set({ pickupCoords: coords }),
    setDropCoords: (coords) => set({ dropCoords: coords }),

    setDriverLocation: (lat, lng) => set({ driverLocation: { lat, lng } }),

    setEta: (eta) => set({ eta }),

    updateRideStatus: (status) => {
        const ride = get().currentRide
        if (ride) set({ currentRide: { ...ride, status } })
    },

    setRide: (rideOrFn) => set((state) => ({
        currentRide: typeof rideOrFn === "function"
            ? rideOrFn(state.currentRide)
            : rideOrFn
    })),

    clearRide: () => set({
        currentRide: null,
        driverLocation: null,
        eta: null,
        pickup: "",
        destination: "",
        pickupCoords: null,
        dropCoords: null
    }),

    requestRide: async (data) => {
        const res = await api.post("/rides/request", data)
        set({ currentRide: { ...res.data, status: res.data.status || "searching" } })
        return res.data
    },

    cancelRide: async (rideId) => {
        await api.post(`/rides/cancel/${rideId}`)
        set({ currentRide: null, driverLocation: null })
        toast("Ride cancelled")
    },

    fetchRide: async (rideId) => {
        const res = await api.get(`/rides/${rideId}`)
        set({ currentRide: res.data })
        return res.data
    },

    fetchHistory: async () => {
        const res = await api.get("/rides/my-rides/list")
        set({ rideHistory: res.data })
    }
}))

export default useRideStore
