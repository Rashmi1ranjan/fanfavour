import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getWebsiteLiveStreamLog = (page_no: number, data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/liveStream/get-website-stream?page=${page_no}`
    return axios.post(url, data)
}

export const getVideoStreamUrl = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/liveStream/get-website-stream-url`
    return axios.post(url, data)
}
