import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getCcbillErrorDetails = (page_num: number, filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/log_ccbill_error/get_log_details?page_num=${page_num}`
    return axios.post(url, filter)
}

export const getCcbillErrorDetailById = (id:string): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/log_ccbill_error/get_log_detail_by_id?id=${id}`
    return axios.get(url)
}
export default { getCcbillErrorDetails }
