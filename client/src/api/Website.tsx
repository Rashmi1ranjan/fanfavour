import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const addWebsite = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/website/add_website`
    return axios.post(url, data)
}

export const editWebsite = (data: object, previousData: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/website/edit_website`
    const websiteData = {
        data: data,
        previousData: previousData
    }
    return axios.post(url, websiteData)
}

export const getWebsiteList = (page_num: number, filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/website/get_website_list?page_num=${page_num}`
    return axios.post(url, filter)
}

export const getWebsiteDataById = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/website/get_website_data_by_id?_id=${_id}`
    return axios.get(url)
}

export const getWebsiteLists = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/website/get_website_lists?`
    return axios.get(url)
}

export const getWebsiteCommissionList = (page_num: number, filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/website/get_website_commission_list?page_num=${page_num}`
    return axios.post(url, filter)
}

export const getWebsiteOptions = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/website/get_all_website_options`
    return axios.get(url)
}

export const getWebsiteCommission = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/website/get_website_commission`
    return axios.post(url, filter)
}

export const addWebsiteTags = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/website/add_website_tags`
    return axios.post(url, data)
}


export const getReferralDomainOptions = (body: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/website-referral/get-referral-websites`
    return axios.post(url, body)
}

export default { addWebsite, editWebsite, getWebsiteList, getWebsiteLists, getWebsiteDataById, getWebsiteOptions, getWebsiteCommission }
