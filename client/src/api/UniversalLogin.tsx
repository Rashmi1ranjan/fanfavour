import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

/** calling API to get universal user details */
export const getUniversalLoginUsersList = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/universal-login/users`
    return axios.post(url, filter)
}

export const getAllWebsiteUsersList = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/universal-login/all-website-users`
    return axios.post(url, filter)
}

export const getUniversalLoginCards = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/universal-login/cards`
    return axios.post(url, filter)
}

export const addNewNote = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/universal-login/add-new-note`
    return axios.post(url, data)
}

export const getUserNote = (userId: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/universal-login/get-user-note`
    return axios.post(url, { userId })
}

export const getEventStatistics = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/universal-login/statistics`
    return axios.post(url, filter)
}
