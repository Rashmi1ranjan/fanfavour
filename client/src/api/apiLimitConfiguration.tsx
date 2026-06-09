import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getApiConfigurations = async (page: number, filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api-limit/list-api-limit-configuration?page_num=${page}`
    return await axios.post(url, filter)
}

export const addApiLimitConfiguration = async (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api-limit/add-api-limit-configuration`
    return await axios.post(url, data)
}

export const getApiLimitConfigurationById = async (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api-limit/get-api-limit-configuration`
    return await axios.post(url, data)
}

export const editApiLimitConfiguration = async (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api-limit/edit-api-limit-configuration`
    return await axios.post(url, data)
}

export const getAutoBlockUsers = async (page: number, filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api-limit/auto-block-user-log?page_num=${page}`
    return await axios.post(url, filter)
}

export const markAutoBlockUserAsProcessed = async (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api-limit/mark-as-processed`
    return await axios.post(url, data)
}
