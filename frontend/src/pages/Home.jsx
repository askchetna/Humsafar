import { Link } from "react-router-dom"
import useAuthStore from "../store/authStore"

const FEATURES = [
    { icon: "🗺️", title: "Live Map Tracking", desc: "Real-time driver location on every trip" },
    { icon: "⚡", title: "Smart Dispatch", desc: "AI-powered driver matching for fastest pickup" },
    { icon: "💰", title: "Fair Pricing", desc: "Transparent fare estimates before you ride" },
    { icon: "📦", title: "Delivery Support", desc: "Send packages across the city" },
    { icon: "🔒", title: "Secure Rides", desc: "Verified drivers and encrypted communication" },
    { icon: "📊", title: "Analytics", desc: "Fleet management and ride insights" }
]

export default function Home() {
    const { token, user } = useAuthStore()

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <nav className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                <span className="text-amber-400 text-2xl font-black tracking-tight">HUMSAFAR</span>
                <div className="flex items-center gap-3">
                    {token ? (
                        <Link
                            to={
                                user?.role === "admin" ? "/admin"
                                    : user?.role === "driver" ? "/driver"
                                    : "/rider"
                            }
                            className="bg-amber-400 text-black font-bold px-5 py-2 rounded-xl text-sm hover:bg-amber-300 transition"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-neutral-400 hover:text-white text-sm px-4 py-2 transition"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="bg-amber-400 text-black font-bold px-5 py-2 rounded-xl text-sm hover:bg-amber-300 transition"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            <section className="px-6 py-20 text-center max-w-4xl mx-auto">
                <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4">
                    Your AI-Powered
                    <span className="text-amber-400 block mt-1">Ride Platform</span>
                </h1>
                <p className="text-neutral-400 text-lg max-w-2xl mx-auto mb-8">
                    Book rides, track drivers in real-time, and get fair fares — all in one platform built for riders, drivers, and fleet operators.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to="/register"
                        className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-8 py-4 rounded-2xl text-lg transition"
                    >
                        Request a Ride
                    </Link>
                    <Link
                        to="/register"
                        className="border border-neutral-700 hover:border-amber-400 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition"
                    >
                        Become a Driver
                    </Link>
                </div>
            </section>

            <section className="px-6 py-16 border-t border-neutral-900">
                <h2 className="text-center text-2xl font-bold mb-10">Platform Features</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                    {FEATURES.map((f) => (
                        <div
                            key={f.title}
                            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-amber-400/30 transition"
                        >
                            <div className="text-3xl mb-3">{f.icon}</div>
                            <h3 className="font-bold text-lg mb-1">{f.title}</h3>
                            <p className="text-neutral-400 text-sm">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="px-6 py-8 border-t border-neutral-900 text-center text-neutral-600 text-sm">
                © 2026 Humsafar — AI Ride Platform
            </footer>
        </div>
    )
}
