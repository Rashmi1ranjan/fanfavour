import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getWebsiteEarnings = (filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/earning/get-earning`
    return axios.post(url, filter)
}

export const getWebsiteEarningReport = (filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/earning/get-earning-reports`
    return axios.post(url, filter)
}

export const getWebsiteLastTransactionReportDate = (filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/earning/get-last-date-for-report`
    return axios.post(url, filter)
}
