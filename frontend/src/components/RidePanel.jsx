import useRideStore from "../store/rideStore"
import api from "../api/axios"
export default function RidePanel() {

    const {

        pickup,
        destination,

        setPickup,
        setDestination,

        rideRequested,

        requestRide,

        driverFound

    } = useRideStore()

    return (

        <div className="absolute bottom-0 left-0 right-0 bg-white p-5 rounded-t-3xl shadow-2xl z-[1000]">

            <h1 className="text-3xl font-bold">

                Humsafar

            </h1>

            <p className="text-gray-500 mb-4">

                AI Powered Ride Platform

            </p>

            <input
                type="text"
                placeholder="Pickup Location"
                value={pickup}
                onChange={(e) =>
                    setPickup(e.target.value)
                }
                className="w-full border p-4 rounded-2xl mb-3"
            />

            <input
                type="text"
                placeholder="Destination"
                value={destination}
                onChange={(e) =>
                    setDestination(e.target.value)
                }
                className="w-full border p-4 rounded-2xl"
            />

            {

                !rideRequested && (

                    <button

    onClick={async () => {

        requestRide()

        const response = await api.post(
            "/rides/request",
            {
                pickup,
                destination
            }
        )

        console.log(response.data)
    }}
                        className="w-full bg-black text-white py-4 rounded-2xl mt-4"
                    >

                        Find Driver

                    </button>
                )
            }

            {

                rideRequested && !driverFound && (

                    <div className="mt-4 text-center">

                        Searching Driver...

                    </div>
                )
            }

            {

                driverFound && (

                    <div className="mt-4 text-center text-green-600 font-bold">

                        Driver Found 🚖

                    </div>
                )
            }

        </div>
    )
}