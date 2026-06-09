import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getPromotionReport = (page_num: number, filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/promotion-report/get-promotion-report?page_num=${page_num}`
    return axios.post(url, filter)
}
