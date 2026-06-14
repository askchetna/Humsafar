// API paths
export const API = {
    AUTH: {
        LOGIN: "/auth/login",
        REGISTER: "/auth/register",
        ME: "/auth/me"
    },
    RIDES: {
        REQUEST: "/rides/request",
        LIST: "/rides/my-rides/list",
        DRIVER_LIST: "/rides/driver-rides/list",
        ESTIMATE: "/rides/estimate",
        GEOCODE: "/rides/geocode"
    },
    DRIVERS: {
        ME: "/drivers/me",
        CREATE_PROFILE: "/drivers/create-profile"
    }
}

// Ride statuses
export const RIDE_STATUS = {
    SEARCHING: "searching",
    ASSIGNED: "assigned",
    ACCEPTED: "accepted",
    ARRIVED: "arrived",
    STARTED: "started",
    COMPLETED: "completed",
    CANCELLED: "cancelled"
}

export const RIDE_STATUS_LABELS = {
    searching: "Searching",
    assigned: "Assigned",
    accepted: "Accepted",
    arrived: "Arrived",
    started: "Started",
    completed: "Done",
    cancelled: "Cancelled"
}

export const RIDE_STATUS_COLORS = {
    completed: "text-green-400",
    cancelled: "text-red-400",
    searching: "text-blue-400",
    assigned: "text-amber-400",
    accepted: "text-amber-400",
    arrived: "text-green-400",
    started: "text-purple-400"
}

// WebSocket event types
export const WS_EVENTS = {
    NEW_RIDE: "new_ride",
    DRIVER_ASSIGNED: "driver_assigned",
    DRIVER_REASSIGNED: "driver_reassigned",
    RIDE_ACCEPTED: "ride_accepted",
    DRIVER_ARRIVED: "driver_arrived",
    RIDE_STARTED: "ride_started",
    RIDE_COMPLETED: "ride_completed",
    RIDE_CANCELLED: "ride_cancelled",
    NO_DRIVERS: "no_drivers_available",
    DRIVER_LOCATION: "driver_location"
}

// Map defaults (Pune, India)
export const DEFAULT_MAP_CENTER = [18.5204, 73.8567]
export const DEFAULT_MAP_ZOOM = 13

// Roles
export const ROLES = {
    RIDER: "rider",
    DRIVER: "driver",
    ADMIN: "admin"
}

// Vehicle types
export const VEHICLE_TYPES = [
    { id: "economy", label: "Economy", icon: "🚗" },
    { id: "comfort", label: "Comfort", icon: "🚙" },
    { id: "premium", label: "Premium", icon: "✨" },
    { id: "bike", label: "Bike", icon: "🏍️" },
    { id: "delivery", label: "Delivery", icon: "📦" }
]

// Ride types
export const RIDE_TYPES = {
    STANDARD: "standard",
    DELIVERY: "delivery"
}
