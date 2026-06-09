import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getSubscriptionStatistics = async (filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/subscription-statistics`
    return await axios.post(url, filter)
}
