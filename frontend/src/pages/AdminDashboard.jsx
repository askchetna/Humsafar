import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import api from "../api/axios"
import toast from "react-hot-toast"

export default function AdminDashboard() {
    const [stats, setStats] = useState(null)
    const [users, setUsers] = useState([])
    const [rides, setRides] = useState([])
    const [fleets, setFleets] = useState([])
    const [pendingDrivers, setPendingDrivers] = useState([])
    const [loading, setLoading] = useState(true)
    const [fleetName, setFleetName] = useState("")

    useEffect(() => {
        document.title = "Humsafar — Admin"
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [statsRes, usersRes, ridesRes, fleetsRes, pendingRes] = await Promise.all([
                api.get("/admin/stats"),
                api.get("/admin/users"),
                api.get("/admin/rides"),
                api.get("/fleet/list"),
                api.get("/admin/drivers/pending")
            ])
            setStats(statsRes.data)
            setUsers(usersRes.data)
            setRides(ridesRes.data)
            setFleets(fleetsRes.data)
            setPendingDrivers(pendingRes.data)
        } catch {
            toast.error("Failed to load admin data")
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (driverId) => {
        try {
            await api.post(`/admin/drivers/${driverId}/approve`)
            toast.success("Driver approved")
            loadData()
        } catch {
            toast.error("Failed to approve")
        }
    }

    const handleCreateFleet = async (e) => {
        e.preventDefault()
        if (!fleetName.trim()) return
        try {
            await api.post("/fleet/create", { name: fleetName })
            toast.success("Fleet created")
            setFleetName("")
            loadData()
        } catch {
            toast.error("Failed to create fleet")
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">
                Loading admin dashboard...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <Navbar />

            <div className="max-w-6xl mx-auto p-6 space-y-8">
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>

                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Users", value: stats.total_users },
                            { label: "Drivers", value: stats.total_drivers },
                            { label: "Online", value: stats.online_drivers },
                            { label: "Revenue", value: `₨${stats.total_revenue}` }
                        ].map((s) => (
                            <div
                                key={s.label}
                                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5"
                            >
                                <p className="text-neutral-500 text-xs uppercase">{s.label}</p>
                                <p className="text-2xl font-bold mt-1">{s.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {stats?.rides_by_status && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                        <h2 className="font-bold mb-3">Rides by Status</h2>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(stats.rides_by_status).map(([status, count]) => (
                                <span
                                    key={status}
                                    className="bg-neutral-800 px-3 py-1.5 rounded-lg text-sm capitalize"
                                >
                                    {status}: {count}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {pendingDrivers.length > 0 && (
                    <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-5">
                        <h2 className="font-bold mb-4 text-amber-400">Pending Driver Approvals</h2>
                        <div className="space-y-2">
                            {pendingDrivers.map((d) => (
                                <div
                                    key={d.id}
                                    className="flex items-center justify-between bg-neutral-800 rounded-xl px-4 py-3 text-sm"
                                >
                                    <div>
                                        <p className="font-medium">{d.name}</p>
                                        <p className="text-neutral-500 text-xs">
                                            {d.phone} · {d.vehicle_type}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleApprove(d.id)}
                                        className="bg-green-500 hover:bg-green-400 text-white font-bold px-4 py-1.5 rounded-lg text-xs"
                                    >
                                        Approve
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                        <h2 className="font-bold mb-4">Users</h2>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {users.map((u) => (
                                <div
                                    key={u.id}
                                    className="flex items-center justify-between bg-neutral-800 rounded-xl px-4 py-2 text-sm"
                                >
                                    <div>
                                        <p className="font-medium">{u.full_name || u.phone}</p>
                                        <p className="text-neutral-500 text-xs capitalize">{u.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                        <h2 className="font-bold mb-4">Recent Rides</h2>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {rides.slice(0, 20).map((r) => (
                                <div
                                    key={r.id}
                                    className="bg-neutral-800 rounded-xl px-4 py-2 text-sm"
                                >
                                    <p className="truncate">{r.pickup_location} → {r.drop_location}</p>
                                    <p className="text-neutral-500 text-xs capitalize mt-0.5">
                                        {r.status} · ₨{r.fare}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                    <h2 className="font-bold mb-4">Fleet Management</h2>
                    <form onSubmit={handleCreateFleet} className="flex gap-3 mb-4">
                        <input
                            type="text"
                            placeholder="Fleet name"
                            value={fleetName}
                            onChange={(e) => setFleetName(e.target.value)}
                            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm"
                        />
                        <button
                            type="submit"
                            className="bg-amber-400 text-black font-bold px-5 py-2 rounded-xl text-sm"
                        >
                            Create Fleet
                        </button>
                    </form>
                    <div className="space-y-2">
                        {fleets.map((f) => (
                            <div
                                key={f.id}
                                className="bg-neutral-800 rounded-xl px-4 py-2 text-sm"
                            >
                                {f.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
