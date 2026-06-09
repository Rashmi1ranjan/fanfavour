import axios, { AxiosResponse } from 'axios'

import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getRefundandChargebacksList = (page_num: number, filter?: object): Promise<AxiosResponse> => {
    const data = { page: page_num, filter }
    const url = `${baseURL}/refundAndChargeback/getRefundandChargeback?page_num=${page_num}`
    return axios.post(url, data)
}
