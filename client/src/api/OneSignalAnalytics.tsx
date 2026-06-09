import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getOneSignalAnalyticData = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/one-signal-analytics/get`
    return axios.get(url, { params: filter })
}
