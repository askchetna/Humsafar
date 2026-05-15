import { create } from "zustand"

const useRideStore = create((set) => ({

    pickup: "",

    destination: "",

    rideRequested: false,

    driverFound: false,

    tripStarted: false,

    setPickup: (pickup) =>
        set({ pickup }),

    setDestination: (destination) =>
        set({ destination }),

    requestRide: () =>
        set({
            rideRequested: true
        }),

    setDriverFound: () =>
        set({
            driverFound: true
        }),

    startTrip: () =>
        set({
            tripStarted: true
        })

}))

export default useRideStore