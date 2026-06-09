import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getPWAInfo = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/pwa/get-pwa-info`
    return axios.post(url, filter)
}

export default { getPWAInfo }
