import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const addOrUpdateWebsiteReferral = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/website-referral/add-or-update`
    return axios.post(url, data)
}

export const getWebsiteReferralList = (page_num: number): Promise<AxiosResponse> => {
    const url = `${baseURL}/website-referral/get-list?page_num=${page_num}`
    return axios.get(url)
}

export const getWebsiteReferralDataById = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/website-referral/get-by-id?_id=${_id}`
    return axios.get(url)
}

export const getWebsiteReferralDataByReferral = (filter: object, currentPage: number): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/earning_report/get-earning-report-for-referral?page_num=${currentPage}`
    return axios.post(url, filter)
}

export const getCSVOfReferralEarning = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/earning_report/get-earning-report-csv-for-referral`
    return axios.post(url, filter)
}

export const getAllReferralOption = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/website-referral/get-all`
    return axios.get(url)
}

export const getAllLinkReferralOption = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/website-referral/get-all-link-referral`
    return axios.get(url)
}
export default { addOrUpdateWebsiteReferral, getWebsiteReferralList, getWebsiteReferralDataById }
