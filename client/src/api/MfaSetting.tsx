import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getMfaSetting = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/mfa/get-mfa-setting`
    return axios.post(url)
}

export const enableMfaSetting = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/mfa/enable-mfa-setting`
    return axios.post(url, data)
}

export const disableMfaSetting = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/mfa/disable-mfa-setting`
    return axios.post(url, data)
}
