import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const login = (email: string, password: string, mfa_code?: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/login`
    return axios.post(url, { email, password, mfa_code })
}

export const checkMfaStatus = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/mfa/check-mfa-status`
    return axios.get(url)
}

export default { login }
