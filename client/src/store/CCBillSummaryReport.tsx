import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getCCBillSummaryReportDetails } from '../api/CCBillSummaryReport'

interface filterOption {
    domain: string
    limit: number
    error_type: string
    is_recurring: string
}

class DashboardStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public chartDetails: string[][]
    @observable public tableDetails: []
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public totalRows: number
    @observable public filter: filterOption
    @observable public table1Details: []
    @observable public table2Details: []

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.chartDetails = []
        this.currentPage = 1
        this.totalPage = 0
        this.filter = {
            domain: '',
            limit: 50,
            error_type: 'Charge By Previous',
            is_recurring: 'all'
        }
        this.totalRows = 0
        this.tableDetails = []
        this.table1Details = []
        this.table2Details = []
    }

    @action.bound
    setCCBillSummaryReportDetails() {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true

        getCCBillSummaryReportDetails(this.filter).then((response) => {

            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }

            const responseData = response.data

            this.tableDetails = responseData[0]
            this.table1Details = responseData[1]
            this.table2Details = responseData[2]

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

export default DashboardStore
