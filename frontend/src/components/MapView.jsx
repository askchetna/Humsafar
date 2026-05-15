import DriverMarker from "./DriverMarker"
import {
    MapContainer,
    TileLayer,
    
    useMap
} from "react-leaflet"

import "leaflet/dist/leaflet.css"

import { useEffect, useState } from "react"

import socket from "../services/socket"


function MoveMap({ position }) {

    const map = useMap()

    useEffect(() => {

        map.panTo(position)

    }, [position])

    return null
}


export default function MapView() {

    const [position, setPosition] = useState(
        [18.5204, 73.8567]
    )

    useEffect(() => {

        let interval
    
        socket.onopen = () => {
    
            console.log("SOCKET CONNECTED")
    
            let lat = 18.5204
            let lng = 73.8567
    
            interval = setInterval(() => {
    
                lat += 0.001
                lng += 0.001
    
                socket.send(
                    JSON.stringify({
                        type: "driver_location",
                        lat,
                        lng
                    })
                )
    
            }, 3000)
        }
    
        socket.onmessage = (event) => {
    
            const data = JSON.parse(
                event.data
            )
    
            console.log(data)
    
            if (data.type === "driver_location") {
    
                setPosition([
                    data.lat,
                    data.lng
                ])
            }
        }
    
        return () => {
    
            clearInterval(interval)
    
        }
    
    }, [])

    return (

        <MapContainer
            center={position}
            zoom={13}
            style={{
                height: "100vh",
                width: "100%"
            }}
        >

            <TileLayer
                attribution="Humsafar"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


<DriverMarker
    position={position}
/>

        </MapContainer>
    )
}