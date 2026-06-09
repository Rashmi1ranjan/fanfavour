import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getHybridTransactionCount = (filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/payment/get-log-counts`
    return axios.post(url, filter)
}

export const getHybridTransactionLogs = (page: number, filter?: object): Promise<AxiosResponse> => {
    const postData = { filter, page }
    const url = `${baseURL}/payment/get-log-list`
    return axios.post(url, postData)
}

export const getHybridTransactionSummary = (filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/payment/get-log-summary`
    return axios.post(url, filter)
}
