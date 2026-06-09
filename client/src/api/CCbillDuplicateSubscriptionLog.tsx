import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getDuplicateSubscriptionLogList = (page:number, data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/ccbill-duplicate-subscription/all-log?page_num=${page}`
    return axios.post(url, data)
}

export const updateLogAsProcessed = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/ccbill-duplicate-subscription/mark-as-processed`
    return axios.post(url, data)
}

export default { getDuplicateSubscriptionLogList, updateLogAsProcessed }
