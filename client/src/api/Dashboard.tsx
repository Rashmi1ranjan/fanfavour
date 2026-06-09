import Axios from 'axios'
import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getChartDetails = (filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/log_ccbill_error/get_logs_detail`
    return axios.post(url, filter)
}

export const getCcbillChartDetails = (filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/log_ccbill_error/get_CCBill_Error_detail`
    return Axios.post(url, filter)
}

export const getDashboardData = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/log_ccbill_error/get_dashboard_data`
    return Axios.post(url, filter)
}

export const getDashboardTransactionData = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/log_ccbill_error/get_dashboard_transaction_data`
    return Axios.post(url, filter)
}

export const getStickyIoRecentTransaction = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/sticky-io/get_recent_transaction`
    return Axios.post(url, filter)
}

export const getHourlyTransaction = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/hourly-transaction`
    return Axios.post(url, filter)
}

/** calling API which returns datewise transactions' count */
export const getTransactionsCount = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/transactions-count`
    return Axios.post(url, filter)
}

export const getUniversalLoginTransactions = (filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/universal-login-transactions`
    return Axios.post(url, filter)
}

export default { getChartDetails }
