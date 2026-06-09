import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getMissingWebhookList = (page_num: number): Promise<AxiosResponse> => {
    const url = `${baseURL}/webhooks/get_missing_webhook_list?page_num=${page_num}`
    return axios.get(url)
}

export const resolveMissingWebhook = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/webhooks/resolve_missing_webhook?_id=${_id}`
    return axios.get(url)
}

export default { getMissingWebhookList }
