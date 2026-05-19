import { api } from './base-url'

export const sendMobileInfoToServices = (domain, data) => async () => {
    try {
        await api.post(`/v1/services/send-device-info`, { data, domain })
        return
    } catch (error) {
        console.log(error)
        return
    }
}