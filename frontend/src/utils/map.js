import L from "leaflet"
import api from "../api/axios"
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "./constants"

export { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM }

export function fixLeafletIcons() {
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
    })
}

export const driverIcon = new L.DivIcon({
    className: "",
    html: `<div style="width:42px;height:42px;background:#facc15;border-radius:999px;display:flex;align-items:center;justify-content:center;border:3px solid white;font-size:20px;box-shadow:0 6px 18px rgba(0,0,0,0.45);">🚕</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21]
})

export const pickupIcon = new L.DivIcon({
    className: "",
    html: `<div style="width:20px;height:20px;background:#22c55e;border-radius:999px;border:4px solid white;box-shadow:0 0 15px rgba(34,197,94,0.5);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
})

export const dropIcon = new L.DivIcon({
    className: "",
    html: `<div style="width:20px;height:20px;background:#f59e0b;border-radius:999px;border:4px solid white;box-shadow:0 0 15px rgba(245,158,11,0.5);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
})

export function toLatLng(position) {
    if (!position) return null
    return [position.lat, position.lng]
}

export function collectMapPoints(...positions) {
    return positions
        .filter(Boolean)
        .map((p) => [p.lat, p.lng])
}

export function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function estimateFare(distanceKm, rideType = "standard") {
    const base = rideType === "delivery" ? 40 : 30
    const perKm = rideType === "delivery" ? 12 : 15
    return Math.round(base + distanceKm * perKm)
}

export function formatCurrency(amount) {
    return `₨${amount}`
}

export async function geocodeAddress(query, near = null) {
    if (!query?.trim()) return null

    try {
        const payload = { query: query.trim() }
        if (near?.lat != null && near?.lng != null) {
            payload.near_lat = near.lat
            payload.near_lng = near.lng
        }

        const res = await api.post("/rides/geocode", payload)
        return {
            lat: res.data.lat,
            lng: res.data.lng,
            displayName: res.data.display_name
        }
    } catch {
        return null
    }
}

export async function fetchRoutePolyline(start, end) {
    if (!start || !end) return null

    try {
        const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`

        const res = await fetch(url)
        const data = await res.json()

        if (data.code !== "Ok" || !data.routes?.[0]) return null

        return data.routes[0].geometry.coordinates.map(
            ([lng, lat]) => [lat, lng]
        )
    } catch {
        return null
    }
}
