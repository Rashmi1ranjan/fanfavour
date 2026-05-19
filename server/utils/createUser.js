import { API_STATIC_AUTH_TOKEN } from '../constant.js'
import { servicesApiRequest } from './axiosClient.js'

const createUser = async (email, domain) => {
    try {
        const response = await servicesApiRequest({
            method: 'post',
            endpoint: '/api/universal-login/create-user',
            data: { email, domain },
            headers: { token: API_STATIC_AUTH_TOKEN },
            params: { token: null }, // No need to send token for this API as it's public API
        })
        return response.data
    } catch (error) {
        return error.response.data
    }
}

export default createUser
