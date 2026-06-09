import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const addWebsiteReferralHistory = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/website_referral_history/add_website_referral`
    return axios.post(url, data)
}

export const editWebsiteReferralHistory = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/website_referral_history/edit_website_referral`
    return axios.post(url, data)
}

export const getWebsiteReferralHistoryList = (page_num: number, filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/website_referral_history/get_website_referral_history_list?page_num=${page_num}`
    return axios.post(url, filter)
}

export const getWebsiteReferralDataById = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/website_referral_history/get_website_referral_data_by_id?_id=${_id}`
    return axios.get(url)
}

export const getWebsiteReferralByDomain = (data: object) => {
    const url = `${baseURL}/users/website_referral_history/get_website_referral_history_by_domain`
    return axios.post(url, data)
}

export default { addWebsiteReferralHistory, editWebsiteReferralHistory, getWebsiteReferralHistoryList, getWebsiteReferralDataById }
