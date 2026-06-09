import { observable, action, makeObservable } from 'mobx'
import { AxiosResponse } from 'axios'
import _ from 'lodash'
import RootStore from './Root'
import { getCCBillTransactionReports } from '../api/CCBIllTransactionReports'
import { CCBillTransactionReport, CCBillTransactionReportApiResponse } from '../types/types'

interface filterOption {
    email: string
    transaction_type: Array<string>
    start_date: string
    end_date: string
    subscription_id: string,
    domain_sub_account_array: Array<string>
}

class CCBillTransactionReportsStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public transactionReportList: Array<CCBillTransactionReport>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public totalRows: number
    @observable public filter: filterOption

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.transactionReportList = []
        this.currentPage = 1
        this.totalPage = 0
        this.totalRows = 0
        this.filter = {
            email: '',
            transaction_type: [],
            subscription_id: '',
            start_date: '',
            end_date: '',
            domain_sub_account_array: []
        }
    }

    @action.bound
    getTransactionReports(currentPage: number, filter: filterOption): void {
        this.isLoading = true
        getCCBillTransactionReports(currentPage, filter).then((response: AxiosResponse<CCBillTransactionReportApiResponse>) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = _.get(response, 'data.message', 'Error in get transaction report')
                return
            }
            const responseData = response.data
            this.transactionReportList = responseData.rows
            this.currentPage = responseData.currentPage
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }
}

export default CCBillTransactionReportsStore
