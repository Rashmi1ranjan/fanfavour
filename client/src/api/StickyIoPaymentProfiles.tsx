import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getStickyIoPaymentProfile = (page_num: number, filter?: object): Promise<AxiosResponse> => {
    const data = {
        page: page_num,
        filter
    }
    const url = `${baseURL}/payment_profiles/get_profiles`
    return axios.post(url, data)
}

export const refreshPaymentProfiles = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/payment_profiles/refresh_payment_profile`
    return axios.get(url)
}

export const getAllStickyIoPaymentProfile = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/payment_profiles/get_all_profiles`
    return axios.get(url)
}
