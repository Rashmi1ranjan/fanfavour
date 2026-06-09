import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getWrongUserSubscriptionStatusLog = (page_num: number, filter?: object): Promise<AxiosResponse> => {
    const data = {
        ...filter,
        page: page_num
    }
    const url = `${baseURL}/api/get-wrong-subscription-status-users`
    return axios.post(url, data)
}

export const fixWrongUserSubscriptionStatus = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/fix-wrong-user-subscription-status`
    return axios.post(url, data)
}
