import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getSendGridWebhookList = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/webhook/get_email_webhook_data`
    return axios.post(url, filter)
}

export default { getSendGridWebhookList }
