import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix default leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
})

const driverIcon = new L.DivIcon({
    className: "",
    html: `<div style="
        width:40px;height:40px;
        background:#fbbf24;
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:20px;
        border:3px solid #fff;
        box-shadow:0 2px 10px rgba(0,0,0,0.4);
    ">🚗</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
})

const pickupIcon = new L.DivIcon({
    className: "",
    html: `<div style="
        width:14px;height:14px;
        background:#22c55e;
        border-radius:50%;
        border:3px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
})

function PanTo({ position }) {
    const map = useMap()
    const prev = useRef(null)
    useEffect(() => {
        if (!position) return
        const key = `${position[0]},${position[1]}`
        if (key !== prev.current) {
            map.panTo(position, { animate: true })
            prev.current = key
        }
    }, [position, map])
    return null
}

export default function MapView({ driverPosition, pickupPosition, center }) {
    const defaultCenter = center || [33.6844, 73.0479] // Islamabad

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {driverPosition && (
                <>
                    <PanTo position={[driverPosition.lat, driverPosition.lng]} />
                    <Marker
                        position={[driverPosition.lat, driverPosition.lng]}
                        icon={driverIcon}
                    >
                        <Popup>Driver Location</Popup>
                    </Marker>
                </>
            )}

            {pickupPosition && (
                <Marker
                    position={[pickupPosition.lat, pickupPosition.lng]}
                    icon={pickupIcon}
                >
                    <Popup>Pickup Point</Popup>
                </Marker>
            )}
        </MapContainer>
    )
}
