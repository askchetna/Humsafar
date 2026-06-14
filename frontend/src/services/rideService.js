import api from "../api/axios"
import { API } from "../utils/constants"

const rideService = {
    requestRide: async (payload) => {
        const response = await api.post(API.RIDES.REQUEST, payload)
        return response.data
    },

    estimateFare: async (payload) => {
        const response = await api.post(API.RIDES.ESTIMATE, payload)
        return response.data
    },

    getHistory: async () => {
        const response = await api.get(API.RIDES.LIST)
        return response.data
    },

    getDriverHistory: async () => {
        const response = await api.get(API.RIDES.DRIVER_LIST)
        return response.data
    }
}

export default rideService
