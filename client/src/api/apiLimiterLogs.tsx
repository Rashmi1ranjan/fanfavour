import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getApiLimiterLogs = (page_num: number, data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api_limiter/get_api_limiter_logs?page_num=${page_num}`
    return axios.post(url, data)
}
