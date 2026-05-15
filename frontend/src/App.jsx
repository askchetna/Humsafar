import { useEffect } from "react"

import MapView from "./components/MapView"

import RidePanel from "./components/RidePanel"

import useRideStore from "./store/rideStore"


function App() {

    const {

        rideRequested,
        setDriverFound

    } = useRideStore()

    useEffect(() => {

        if (rideRequested) {

            setTimeout(() => {

                setDriverFound()

            }, 5000)
        }

    }, [rideRequested])

    return (

        <div className="relative h-screen w-screen">

            <MapView />

            <RidePanel />

        </div>
    )
}

export default App