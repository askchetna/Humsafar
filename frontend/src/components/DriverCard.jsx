export default function DriverCard({ driver, eta }) {
    if (!driver) return null

    return (
        <div className="bg-neutral-800 rounded-2xl p-4 border border-neutral-700">
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-black font-bold text-lg shrink-0">
                    {driver.name?.[0]?.toUpperCase() || "D"}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{driver.name || "Driver"}</p>
                    <p className="text-neutral-400 text-sm">{driver.vehicle_type} · {driver.vehicle_number || "—"}</p>
                </div>

                {eta != null && (
                    <div className="text-right shrink-0">
                        <p className="text-amber-400 font-bold text-lg">{eta} min</p>
                        <p className="text-neutral-500 text-xs">ETA</p>
                    </div>
                )}
            </div>

            {driver.phone && (
                <a
                    href={`tel:${driver.phone}`}
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-neutral-700 hover:bg-neutral-600 transition text-white text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
                    </svg>
                    Call Driver
                </a>
            )}
        </div>
    )
}
