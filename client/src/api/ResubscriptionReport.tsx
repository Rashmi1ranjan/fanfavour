import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

interface filterOption {
    start_date: string
    end_date: string
    domain: string
    email: string
}

export const getResubscriptionReportData = async (page_num: number, filter?: filterOption): Promise<AxiosResponse> => {
    const data = { page: page_num, filter }
    const url = `${baseURL}/resubscription/get-resubscription-report`
    return await axios.post(url, data)
}
