import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getOptInReport = (page_num: number, filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/opt-in-report/get-opt-in-report?page_num=${page_num}`
    return axios.post(url, filter)
}

export const getAllOptInCountReport = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/opt-in-report/get-all-opt-in-count`
    return axios.get(url)
}
