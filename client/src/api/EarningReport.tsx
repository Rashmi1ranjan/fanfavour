import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getMonthlyEarningReportCSV = (filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/earning_report/get_earning_report_all_website`
    return axios.post(url, filter)
}

export const getDailyEarningReport = (page_num: number, filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/earning_report/get_daily_earning_report?page_num=${page_num}`
    return axios.post(url, filter)
}

export const downloadCsv = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/earning_report/download_csv`
    return axios.post(url, data)
}

export const getMonthlyEarningReport = (page_number: number, filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/earning/get-monthly-earning?page_num=${page_number}`
    return axios.post(url, filter)
}

export default { getMonthlyEarningReportCSV, getDailyEarningReport }
