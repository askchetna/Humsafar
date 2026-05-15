import { create } from "zustand"
import api from "../api/axios"
import toast from "react-hot-toast"

const useDriverStore = create((set, get) => ({
    profile: null,
    isOnline: false,
    currentRide: null,
    incomingRide: null,
    rideHistory: [],

    fetchProfile: async () => {
        try {
            const res = await api.get("/drivers/me")
            set({ profile: res.data, isOnline: res.data.is_online })
            return res.data
        } catch {
            return null
        }
    },

    goOnline: async (lat, lng) => {
        const profile = get().profile
        if (!profile) return

        await api.post(`/drivers/go-online/${profile.id}`, { lat, lng })
        set({ isOnline: true })
        toast.success("You are now online")
    },

    goOffline: async () => {
        const profile = get().profile
        if (!profile) return

        await api.post(`/drivers/go-offline/${profile.id}`)
        set({ isOnline: false })
        toast("You are now offline")
    },

    updateLocation: async (lat, lng) => {
        await api.post("/drivers/update-location", { lat, lng })
    },

    setIncomingRide: (ride) => set({ incomingRide: ride }),

    clearIncomingRide: () => set({ incomingRide: null }),

    setCurrentRide: (ride) => set({ currentRide: ride }),

    clearCurrentRide: () => set({ currentRide: null }),

    acceptRide: async (rideId) => {
        const res = await api.post(`/rides/accept/${rideId}`)
        const incomingRide = get().incomingRide
        set({
            currentRide: { ...(incomingRide || {}), ...res.data },
            incomingRide: null
        })
        return res.data
    },

    markArrived: async (rideId) => {
        const res = await api.post(`/rides/arrived/${rideId}`)
        set((state) => ({
            currentRide: state.currentRide
                ? { ...state.currentRide, status: "arrived" }
                : null
        }))
        return res.data
    },

    startRide: async (rideId) => {
        const res = await api.post(`/rides/start/${rideId}`)
        set((state) => ({
            currentRide: state.currentRide
                ? { ...state.currentRide, status: "started" }
                : null
        }))
        return res.data
    },

    completeRide: async (rideId) => {
        const res = await api.post(`/rides/complete/${rideId}`)
        set({ currentRide: null })
        toast.success(`Ride completed! Fare: ₨${res.data.fare}`)
        return res.data
    },

    fetchRideHistory: async () => {
        const res = await api.get("/rides/driver-rides/list")
        set({ rideHistory: res.data })
    }
}))

export default useDriverStore
