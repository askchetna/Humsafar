import { create } from "zustand"
import api from "../api/axios"

const useAuthStore = create((set) => ({
    token: localStorage.getItem("token") || null,
    user: (() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null")
        } catch {
            return null
        }
    })(),

    login: async (phone, password) => {
        const res = await api.post("/auth/login", { phone, password })
        const { access_token } = res.data

        // Decode basic info from token payload
        const payload = JSON.parse(atob(access_token.split(".")[1]))
        const user = {
            user_id: payload.user_id,
            phone: payload.phone,
            role: payload.role
        }

        localStorage.setItem("token", access_token)
        localStorage.setItem("user", JSON.stringify(user))
        set({ token: access_token, user })
        return user
    },

    register: async (data) => {
        const res = await api.post("/auth/register", data)
        return res.data
    },

    logout: () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        set({ token: null, user: null })
    },

    isAuthenticated: () => !!localStorage.getItem("token")
}))

export default useAuthStore
