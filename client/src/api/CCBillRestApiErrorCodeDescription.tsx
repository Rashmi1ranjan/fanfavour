import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const addCCBillRestApiErrorCodeDescription = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/ccbill-rest-api-error-code/add-error-code`
    return axios.post(url, data)
}

export const editCCBillRestApiErrorCodeDescription = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/ccbill-rest-api-error-code/edit-error-code`
    return axios.post(url, data)
}

export const getCCBillRestApiErrorCodeDescriptionList = (page_num: number): Promise<AxiosResponse> => {
    const url = `${baseURL}/ccbill-rest-api-error-code/get-error-code-list?page_num=${page_num}`
    return axios.get(url)
}

export const getCCBillRestApiErrorCodeDescriptionById = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/ccbill-rest-api-error-code/get-error-code-by-id?_id=${_id}`
    return axios.get(url)
}

export const getCCBillRestApiErrorCodeDescriptionOptions = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/ccbill-rest-api-error-code/get-all-error-code-option`
    return axios.get(url)
}

export default {
    getCCBillRestApiErrorCodeDescriptionOptions,
    addCCBillRestApiErrorCodeDescription,
    editCCBillRestApiErrorCodeDescription,
    getCCBillRestApiErrorCodeDescriptionList,
    getCCBillRestApiErrorCodeDescriptionById
}
