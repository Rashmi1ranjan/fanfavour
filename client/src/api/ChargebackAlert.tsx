import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getChargebackAlerts = async (page_num: number, filter?: object): Promise<AxiosResponse> => {
    const data = { page: page_num, filter }
    const url = `${baseURL}/chargeback-alert/get-log`
    return await axios.post(url, data)
}

export const markAllChargeBackAlertAsProcessed = async (filter?: object): Promise<AxiosResponse> => {
    const data = { filter }
    const url = `${baseURL}/chargeback-alert/mark-all-as-processed`
    return await axios.post(url, data)
}

export const markChargebackAlertAsProcessed = async (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/chargeback-alert/mark-as-processed`
    return await axios.post(url, data)
}
