import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const BASE_URL = getAppBaseUrl()

export const getInfluencerActivityData = (filter?: object): Promise<AxiosResponse> => {
    const url = `${BASE_URL}/api/get-influencer-activity`
    return axios.post(url, filter)
}
