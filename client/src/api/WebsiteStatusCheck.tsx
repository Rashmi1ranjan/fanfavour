import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getAllWebsites = async (): Promise<AxiosResponse> => {
    const url = `${baseURL}/websites/get-all-websites`
    return await axios.get(url)
}

export const getWebsiteStatus = async (website_url: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/websites/check-website-status`
    return await axios.post(url, { website_url })
}
