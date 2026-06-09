import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getChargebackBlockedUserLogs = async (page_num: number, filter?: object): Promise<AxiosResponse> => {
    const data = { page: page_num, filter }
    const url = `${baseURL}/chargeback-block-user/get-log`
    return await axios.post(url, data)
}
