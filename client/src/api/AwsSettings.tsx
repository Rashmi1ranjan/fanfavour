import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getAwsSettings = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/settings/get-aws-settings`
    return axios.get(url)
}

export const saveAwsSettings = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/settings/save-aws-settings`
    return axios.post(url, data)
}
