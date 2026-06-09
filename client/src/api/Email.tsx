import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getEmailStatistics = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/get-email-statistics`
    return axios.post(url)
}

export default { getEmailStatistics }
