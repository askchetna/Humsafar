import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import useAuthStore from "../store/authStore"
import toast from "react-hot-toast"

export default function Login() {
    const [form, setForm] = useState({ phone: "", password: "" })
    const [loading, setLoading] = useState(false)
    const { login } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.phone || !form.password) {
            toast.error("Fill in all fields")
            return
        }
        setLoading(true)
        try {
            const user = await login(form.phone, form.password)
            toast.success("Welcome back!")
            navigate(user.role === "driver" ? "/driver" : "/rider")
        } catch (err) {
            toast.error(err.response?.data?.detail || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-amber-400 text-4xl font-black tracking-tight">HUMSAFAR</h1>
                    <p className="text-neutral-500 text-sm mt-1">AI-Powered Ride Platform</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <h2 className="text-white font-bold text-xl mb-5">Sign In</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-neutral-400 text-xs mb-1.5 block">Phone Number</label>
                            <input
                                type="tel"
                                placeholder="03xx-xxxxxxx"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-600 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-400 transition text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-neutral-400 text-xs mb-1.5 block">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-600 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-400 transition text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition text-sm mt-2"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <p className="text-neutral-500 text-sm text-center mt-4">
                        No account?{" "}
                        <Link to="/register" className="text-amber-400 hover:text-amber-300 transition">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
