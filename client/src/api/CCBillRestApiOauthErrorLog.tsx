import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getOauthErrorLogList = (page:number, data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/ccbill-rest-api-oauth-error/get-log?page_num=${page}`
    return axios.post(url, data)
}

export default { getOauthErrorLogList }
