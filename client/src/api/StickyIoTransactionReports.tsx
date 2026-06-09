import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getStickyIoTransactionReports = (page_num: number, filter?: object): Promise<AxiosResponse> => {
    const data = {
        page: page_num,
        filter
    }
    const url = `${baseURL}/sticky-io/get_sticky_io_transaction_reports`
    return axios.post(url, data)
}

export const markChargebackOrder = async (data: any): Promise<AxiosResponse> => {
    const url = `${baseURL}/sticky-io/process-chargeback-transaction`
    return await axios.post(url, data)
}

