import { servicesApiRequest } from "../utils/axiosClient.js"

export const createUserSession = async (reqData) => {
    try {
        const response = await servicesApiRequest({
            method: 'post',
            endpoint: '/ff-sso/create-user-session',
            data: reqData,
        })
        return response.data
    } catch (error) {
        throw new Error('Error occurred while authenticating. Please try again')
    }
}


export const createTempToken = async (reqData) => {
    try {
        const response = await servicesApiRequest({
            method: 'post',
            endpoint: '/ff-sso/generate-temp-token',
            data: reqData,
        })
        return response.data
    } catch (error) {
        throw new Error('Error occurred while generating temp token. Please try again')
    }
}

export const createAccessToken = async (reqData) => {
    try {
        const response = await servicesApiRequest({
            method: 'post',
            endpoint: '/ff-sso/generate-access-token',
            data: reqData,
        })
        return response.data
    } catch (error) {
        throw new Error('Error occurred while generating temp token. Please try again')
    }
}

export const logoutUserSession = async (reqData) => {
    try {
        const response = await servicesApiRequest({
            method: 'post',
            endpoint: '/ff-sso/logout-user-session',
            data: reqData,
        })
        return response.data
    } catch (error) {
        throw new Error('Error occurred while logging out. Please try again')
    }
}