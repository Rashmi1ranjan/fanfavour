import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getUniversalLoginEventLogs = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/universal-login-logger/get-event-logs`
    return axios.post(url, filter)
}
