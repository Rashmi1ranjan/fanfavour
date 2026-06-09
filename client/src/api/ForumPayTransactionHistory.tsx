import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getForumPayTransactionHistory = (page_num: number, filter?: object): Promise<AxiosResponse> => {
    const data = {
        page: page_num,
        filter
    }
    const url = `${baseURL}/forum-pay/wallet-transaction-history`
    return axios.post(url, data)
}

export const getForumPayWebhooks = (page_num: number, filter?: object): Promise<AxiosResponse> => {
    const data = {
        page: page_num,
        filter
    }
    const url = `${baseURL}/forum-pay/webhooks`
    return axios.post(url, data)
}

export const getUsersWalletDetails = (page_num: number, filter?: object): Promise<AxiosResponse> => {
    const data = {
        page: page_num,
        filter
    }
    const url = `${baseURL}/forum-pay/user-wallet-details`
    return axios.post(url, data)
}

export const updateTransactionStatus = (transaction_id: string): Promise<AxiosResponse> => {
    const data = {
        transaction_id: transaction_id
    }
    const url = `${baseURL}/forum-pay/update-transaction-status`
    return axios.post(url, data)
}

export const getForumpayTransactionStatistics = (filter?: object): Promise<AxiosResponse> => {
    const data = {
        filter
    }
    const url = `${baseURL}/forum-pay/wallet-transaction-statistics`
    return axios.post(url, data)
}

export const exportForumPayTransactionHistory = (filter?: object): Promise<AxiosResponse> => {
    const data = {
        filter
    }
    const url = `${baseURL}/forum-pay/export-wallet-transaction-history`
    return axios.post(url, data)
}
