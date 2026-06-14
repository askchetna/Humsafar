import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function useLocation(options = {}) {
    const {
        watch = false,
        enableHighAccuracy = true,
        timeout = 10000,
        maximumAge = 0,
        fallback = null,
        onSuccess,
        onError
    } = options

    const [location, setLocation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!navigator.geolocation) {
            const msg = "Geolocation not supported"
            setError(msg)
            setLoading(false)
            if (fallback) setLocation(fallback)
            onError?.(msg)
            return
        }

        const handleSuccess = (position) => {
            const coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }
            setLocation(coords)
            setLoading(false)
            setError(null)
            onSuccess?.(coords)
        }

        const handleError = (err) => {
            setError(err.message || "Location unavailable")
            setLoading(false)
            if (fallback) setLocation(fallback)
            onError?.(err)
        }

        const geoOptions = {
            enableHighAccuracy,
            timeout,
            maximumAge
        }

        if (watch) {
            const watchId = navigator.geolocation.watchPosition(
                handleSuccess,
                handleError,
                geoOptions
            )
            return () => navigator.geolocation.clearWatch(watchId)
        }

        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            geoOptions
        )
    }, [watch, enableHighAccuracy, timeout, maximumAge])

    return { location, loading, error }
}

export function useLocationToast(options = {}) {
    return useLocation({
        ...options,
        onSuccess: () => toast.success("Location detected"),
        onError: () => toast.error("Please allow location access")
    })
}
