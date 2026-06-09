import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getAddCardLogList = (page:number, data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/ccbill-add-card-log/get-log?page_num=${page}`
    return axios.post(url, data)
}

export const getCountry = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/get_country_state_city/get_all_countries`
    return axios.get(url)
}

export const getCCBillRestApiReportingListByDomain = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/ccbill-add-card-log/get-log-by-domain`
    return axios.post(url, data)
}

export default { getAddCardLogList, getCountry, getCCBillRestApiReportingListByDomain }
