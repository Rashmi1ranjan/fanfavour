import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getUserCountAnalytics = (page_no: number, data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/analytics/user_count/get_user_count?page=${page_no}`
    return axios.post(url, data)
}

export const getMonthlyEarningReportCSV = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/analytics/user_count/export_user_count`
    return axios.post(url, data)
}


export const getMonthlyRevenueReportCSV = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/analytics/user_count/export_monthly_revenue`
    return axios.post(url, data)
}

export const downloadCsv = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/analytics/user_count/download_csv`
    return axios.post(url, data)
}

export default { getUserCountAnalytics, getMonthlyEarningReportCSV, downloadCsv }
