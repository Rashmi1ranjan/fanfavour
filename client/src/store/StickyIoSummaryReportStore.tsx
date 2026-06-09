import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getStickyIoSummaryReportDetails } from '../api/StickyIoTransactionLogs'
import { ValueType } from 'react-select'
import { OptionType } from '../types/types'

interface filterOption {
    domain: string
    limit: number
    transaction_for: ValueType<OptionType, boolean>
    is_recurring: string
    gateway_id: string
}

class StickyIoSummaryReportStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public tableDetails: []
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public totalRows: number
    @observable public filter: filterOption
    @observable public declineSummary: []

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.currentPage = 1
        this.totalPage = 0
        this.filter = {
            domain: '',
            limit: 50,
            transaction_for: [],
            is_recurring: 'all',
            gateway_id: 'all'
        }
        this.totalRows = 0
        this.tableDetails = []
        this.declineSummary = []
    }

    @action.bound
    setStickyIoSummaryReportDetails() {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true

        getStickyIoSummaryReportDetails(this.filter).then((response) => {

            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }

            const responseData = response.data
            this.tableDetails = responseData.transaction_summary
            this.declineSummary = responseData.decline_transaction_summary
            this.isLoading = false
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        }).catch((error) => {
            console.log('error', error)
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isLoading = false
            this.isApiError = true
            this.apiErrorMessage = error.message
        })
    }
}

export default StickyIoSummaryReportStore
