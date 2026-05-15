const STATUS_CONFIG = {
    searching: { label: "Searching for Driver", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    assigned: { label: "Driver Assigned", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    accepted: { label: "Driver Accepted", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    arrived: { label: "Driver Arrived", color: "bg-green-500/20 text-green-400 border-green-500/30" },
    started: { label: "Trip In Progress", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    completed: { label: "Completed", color: "bg-green-500/20 text-green-400 border-green-500/30" },
    cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-400 border-red-500/30" }
}

export default function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || { label: status, color: "bg-neutral-700 text-neutral-300" }
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
            {config.label}
        </span>
    )
}
