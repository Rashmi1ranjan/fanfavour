import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const BASE_URL = getAppBaseUrl()

export const getForumpayTransactionReports = (pageNum: number, filter?: object): Promise<AxiosResponse> => {
    const data = {
        page: pageNum,
        filter
    }
    const url = `${BASE_URL}/forum_pay_transaction_report/get-forum-pay-transaction-report`
    return axios.post(url, data)
}
