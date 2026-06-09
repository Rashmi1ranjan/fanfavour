import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getAllWebsitesUsersList = async (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/websites/user-lookup`
    return await axios.post(url, data)
}
