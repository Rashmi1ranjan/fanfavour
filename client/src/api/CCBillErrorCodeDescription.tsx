import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const addCCBillErrorCodeDescription = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/ccbill_error_description/add_ccbill_error_code_description`
    return axios.post(url, data)
}

export const editCCBillErrorCodeDescription = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/ccbill_error_description/edit_ccbill_error_code_description`
    return axios.post(url, data)
}

export const getCCBillErrorCodeDescriptionList = (page_num: number): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/ccbill_error_description/get_ccbill_error_code_description_list?page_num=${page_num}`
    return axios.get(url)
}

export const getCCBillErrorCodeDescriptionById = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/ccbill_error_description/get_ccbill_error_code_description_by_id?_id=${_id}`
    return axios.get(url)
}

export const getCCBillErrorCodeDescriptionOptions = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/ccbill_error_description/get_all_ccbill_error_code_description_options`
    return axios.get(url)
}

export default { getCCBillErrorCodeDescriptionOptions, addCCBillErrorCodeDescription, editCCBillErrorCodeDescription, getCCBillErrorCodeDescriptionList, getCCBillErrorCodeDescriptionById }
