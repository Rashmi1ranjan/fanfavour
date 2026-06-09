import Axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getCCBillSummaryReportDetails = (filter?: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/log_ccbill_error/get_ccbill_summary_report_detail`
    return Axios.post(url, filter)
}

export default { getCCBillSummaryReportDetails }
