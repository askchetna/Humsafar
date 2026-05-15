import { Marker, Popup } from "react-leaflet"

import L from "leaflet"

import driverIconImg from "../assets/hero.png"


const driverIcon = new L.Icon({

    iconUrl: driverIconImg,

    iconSize: [40, 40],

    iconAnchor: [20, 40],

})


export default function DriverMarker({

    position

}) {

    return (

        <Marker
            position={position}
            icon={driverIcon}
        >

            <Popup>

                Driver Live Location

            </Popup>

        </Marker>
    )
}