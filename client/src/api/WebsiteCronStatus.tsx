import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getWebsiteCronStatus = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/website-cron/cron-details`
    return axios.get(url, { params: filter })
}
