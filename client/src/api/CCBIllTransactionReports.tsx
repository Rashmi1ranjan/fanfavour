import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getCCBillTransactionReports = (page:number, data: object): Promise<AxiosResponse> => {
    const filter = {
        page: page,
        filter: data
    }
    const url = `${baseURL}/ccbill-transactions`
    return axios.post(url, filter)
}

export default { getCCBillTransactionReports }
