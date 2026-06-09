import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const addBlockCode = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/block_code`
    return axios.post(url, data)
}

export const editBlockCode = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/block_code`
    return axios.put(url, data)
}

export const getBlockCodeList = (page_num: number): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/block_code?page_num=${page_num}`
    return axios.get(url)
}

export const getBlockCodeById = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/block_code_by_id?_id=${_id}`
    return axios.get(url)
}

export const getBlockCodeOptions = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/block_code/all`
    return axios.get(url)
}

export default { getBlockCodeOptions, addBlockCode, editBlockCode, getBlockCodeList, getBlockCodeById }
