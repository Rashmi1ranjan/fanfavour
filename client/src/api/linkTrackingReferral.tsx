import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const addOrUpdateLinkTrackingReferral = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/link-tracking-referral/add-or-update`
    return axios.post(url, data)
}

export const addReferralLinkUser = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/link-tracking-referral/add-referral-user`
    return axios.post(url, data)
}

export const updateReferralLinkUser = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/link-tracking-referral/edit-referral-user`
    return axios.post(url, data)
}

export const getLinkTrackingReferralList = (page_num: number): Promise<AxiosResponse> => {
    const url = `${baseURL}/link-tracking-referral/get-list?page_num=${page_num}`
    return axios.get(url)
}

export const getLinkTrackingReferralUserData = (page_num: number): Promise<AxiosResponse> => {
    const url = `${baseURL}/link-tracking-referral/get-user-data?page_num=${page_num}`
    return axios.get(url)
}

export const getLinkTrackingReferralDataById = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/link-tracking-referral/get-by-id?_id=${_id}`
    return axios.get(url)
}

// export const getWebsiteReferralDataByReferral = (filter: object, currentPage: number): Promise<AxiosResponse> => {
//     const url = `${baseURL}/users/earning_report/get-earning-report-for-referral?page_num=${currentPage}`
//     return axios.post(url, filter)
// }

// export const getCSVOfReferralEarning = (filter: object): Promise<AxiosResponse> => {
//     const url = `${baseURL}/users/earning_report/get-earning-report-csv-for-referral`
//     return axios.post(url, filter)
// }

export const getAllLinkTrackingReferralOption = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/link-tracking-referral/get-all`
    return axios.get(url)
}

export const getReferralLinkAnalyticsData = (filters: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/link-tracking-referral/get-referral-link-analytics`
    return axios.post(url, filters)
}

export const getLinkTrackingReferralUserDataForSingleUser = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/link-tracking-referral/get-user-by-id?_id=${_id}`
    return axios.get(url)
}

export const deleteLinkTrackingReferralUser = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/link-tracking-referral/delete-referral-user`
    return axios.post(url, { _id })
}

export const getReferralList = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/link-tracking-referral/get-referral-list`
    return axios.get(url)
}

export default { addOrUpdateLinkTrackingReferral, getLinkTrackingReferralList, getLinkTrackingReferralDataById, getAllLinkTrackingReferralOption, getLinkTrackingReferralUserDataForSingleUser, updateReferralLinkUser, deleteLinkTrackingReferralUser, getReferralList }
