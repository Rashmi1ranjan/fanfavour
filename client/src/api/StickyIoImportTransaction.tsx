import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const uploadTransactionCSV = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/sticky-io-transaction/import-csv`
    return axios.post(url, data)
}

export const getUploadCsvLogs = (page: number): Promise<AxiosResponse> => {
    const url = `${baseURL}/sticky-io-transaction/import-csv-log?page=${page}`
    return axios.post(url)
}

export const calculateEarnings = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/sticky-io-transaction/calculate-earning`
    return axios.post(url, data)
}

