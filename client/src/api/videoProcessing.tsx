import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getVideoProcessingQueue = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/video-processing/video-queue`
    return axios.get(url)
}

export const getVideoProcessingErrors = (page: number): Promise<AxiosResponse> => {
    const url = `${baseURL}/video-processing/errors?currentPage=${page}`
    return axios.get(url)
}

export const getVideoProcessingHealth = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/video-processing/health`
    return axios.get(url)
}
