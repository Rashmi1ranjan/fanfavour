import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getInfluencerHelpData = (page_num: number, filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/help/get/details?page_num=${page_num}`
    return axios.post(url, filter)
}

export const getInfluencerDataById = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/help/details?_id=${_id}`
    return axios.get(url)
}

export const saveInfluencerHelpData = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/help/save`
    return axios.post(url, data)
}

export const getPresignedUrl = (fileName: string, type: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/settings/get-presigned-url`
    return axios.post(url, { file_name: fileName, type: type })
}

export const uploadFileUsingPresignedUrl = (url: string, body: any, contentType: string, config: any): Promise<AxiosResponse> => {
    const axiosInstance = axios.create()
    delete axiosInstance.defaults.headers.common['authorization']
    axiosInstance.defaults.headers['Content-Type'] = contentType

    return axiosInstance.put(url, body, config)
}

export const updateHelpStatus = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/help/update/status`
    return axios.post(url, { _id: _id })
}

export const deleteInfluencerHelpData = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/help/delete`
    return axios.post(url, { _id: _id })
}

export const saveUserInfluencerHelpData = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/user-help/save`
    return axios.post(url, data)
}

export const getInfluencerReadCountData = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/user-help/influence-help-read-count`
    return axios.post(url, { _id: _id })
}
