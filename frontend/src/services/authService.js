import api from "../api/axios"
import { API } from "../utils/constants"

const authService = {
    login: async (payload) => {
        const response = await api.post(API.AUTH.LOGIN, payload)
        return response.data
    },

    register: async (payload) => {
        const response = await api.post(API.AUTH.REGISTER, payload)
        return response.data
    },

    me: async () => {
        const response = await api.get(API.AUTH.ME)
        return response.data
    }
}

export default authService
