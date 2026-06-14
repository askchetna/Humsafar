import { useEffect, useState } from "react"
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMap
} from "react-leaflet"
import {
    fixLeafletIcons,
    driverIcon,
    pickupIcon,
    dropIcon,
    collectMapPoints,
    fetchRoutePolyline,
    DEFAULT_MAP_CENTER,
    DEFAULT_MAP_ZOOM
} from "../utils/map"
import "leaflet/dist/leaflet.css"

fixLeafletIcons()

function MapController({ driverPosition, pickupPosition, dropPosition }) {
    const map = useMap()

    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 300)
    }, [map])

    useEffect(() => {
        const points = collectMapPoints(
            driverPosition,
            pickupPosition,
            dropPosition
        )

        if (points.length > 1) {
            map.fitBounds(points, { padding: [80, 80] })
            return
        }

        if (points.length === 1) {
            map.setView(points[0], 14)
        }
    }, [driverPosition, pickupPosition, dropPosition, map])

    return null
}

function RouteLine({ pickupPosition, dropPosition }) {
    const [route, setRoute] = useState(null)

    useEffect(() => {
        if (!pickupPosition || !dropPosition) {
            setRoute(null)
            return
        }

        fetchRoutePolyline(pickupPosition, dropPosition).then(setRoute)
    }, [pickupPosition, dropPosition])

    if (!route) return null

    return (
        <Polyline
            positions={route}
            pathOptions={{ color: "#facc15", weight: 4, opacity: 0.8 }}
        />
    )
}

export default function MapView({
    driverPosition,
    pickupPosition,
    dropPosition,
    center
}) {
    const mapCenter = center || DEFAULT_MAP_CENTER

    return (
        <div className="h-full w-full">
            <MapContainer
                center={mapCenter}
                zoom={DEFAULT_MAP_ZOOM}
                zoomControl={true}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController
                    driverPosition={driverPosition}
                    pickupPosition={pickupPosition}
                    dropPosition={dropPosition}
                />

                <RouteLine
                    pickupPosition={pickupPosition}
                    dropPosition={dropPosition}
                />

                {driverPosition && (
                    <Marker
                        position={[driverPosition.lat, driverPosition.lng]}
                        icon={driverIcon}
                    >
                        <Popup>Driver Current Location</Popup>
                    </Marker>
                )}

                {pickupPosition && (
                    <Marker
                        position={[pickupPosition.lat, pickupPosition.lng]}
                        icon={pickupIcon}
                    >
                        <Popup>Pickup Location</Popup>
                    </Marker>
                )}

                {dropPosition && (
                    <Marker
                        position={[dropPosition.lat, dropPosition.lng]}
                        icon={dropIcon}
                    >
                        <Popup>Destination</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    )
}
