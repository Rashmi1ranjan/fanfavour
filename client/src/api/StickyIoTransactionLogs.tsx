import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getStickyIoSuccessErrorLogs = (page_num: number, filter?: object): Promise<AxiosResponse> => {
    const data = {
        page: page_num,
        filter
    }
    const url = `${baseURL}/sticky-io/get_sticky_io_success_error_logs`
    return axios.post(url, data)
}

export const getStickyIoSummaryReportDetails = (filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/sticky-io/get_summary_report_detail`
    return axios.post(url, filter)
}
