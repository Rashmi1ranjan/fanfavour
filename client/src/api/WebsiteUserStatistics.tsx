import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const BASE_URL = getAppBaseUrl()

export const getWebsiteUserStatisticsLog = (filter?: object): Promise<AxiosResponse> => {
    const url = `${BASE_URL}/api/get-website-user-statistics`
    return axios.post(url, filter)
}

export const exportCSVFile = (): Promise<AxiosResponse> => {
    const url = `${BASE_URL}/api/export-website-user-statistics`
    return axios.post(url)
}

export const downloadCsv = (data: object): Promise<AxiosResponse> => {
    const url = `${BASE_URL}/api/download-website-user-statistics-csv`
    return axios.post(url, data)
}
