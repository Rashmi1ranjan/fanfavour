import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getContactUsEmailList = async (page_num: number, filter?: object): Promise<AxiosResponse> => {
    const data = { page: page_num, filter }
    const url = `${baseURL}/contact_us/get_emails`
    return await axios.post(url, data)
}

export const markAllEmailProcessed = async (currentUser: string, page_num: number, filter?: object): Promise<AxiosResponse> => {
    const data = { page: page_num, filter, currentUser }
    const url = `${baseURL}/contact_us/mark_all_as_processed`
    return await axios.post(url, data)
}

export const markEmailAsProcessed = async (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/contact_us/mark_as_processed`
    return await axios.post(url, data)
}
