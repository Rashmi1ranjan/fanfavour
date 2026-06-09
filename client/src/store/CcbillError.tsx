import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getCcbillErrorDetails, getCcbillErrorDetailById } from '../api/CcbillErrorLog'

interface ccbillErrorDetails {
    _id?: string
    url?: string
    created_at?: string
    domain?: string
    error_from?: string
    response?: string
    response_code?: string
    ccbill_error_code?: string
    decline_code?: string
    is_ccbill_error?: boolean
    approved?: string
}

interface filterOption {
    domain: string
    limit: number
    error_type: string
    is_ccbill_error: string | boolean
    decline_code: string,
    ccbill_error_code: string
    is_recurring: string | boolean
    is_unique: string | boolean
}

class CcbillErrorStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public ccbillError: Array<ccbillErrorDetails>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public filter: filterOption
    @observable public showViewModel: boolean
    @observable public viewCcbillErrorLogDetail: ccbillErrorDetails

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.ccbillError = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.filter = {
            domain: '',
            limit: 50,
            error_type: 'Charge By Previous',
            is_ccbill_error: 'all',
            decline_code: '',
            ccbill_error_code: '',
            is_recurring: 'all',
            is_unique: true
        }
        this.showViewModel = false
        this.viewCcbillErrorLogDetail = {}
    }

    @action.bound
    setCcbillErrorDetailById(id: string) {
        getCcbillErrorDetailById(id).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.viewCcbillErrorLogDetail = responseData.rows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        }).catch((error) => {
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isLoading = false
            this.isApiError = true
            this.apiErrorMessage = error.message
        })
    }

    @action.bound
    setCcbillErrorDetails(currentPage: number) {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        getCcbillErrorDetails(currentPage, this.filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.ccbillError = responseData.rows
            this.currentPage = responseData.currentPage
            this.totalPage = responseData.totalPages
            this.limit = responseData.limit
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        }).catch((error) => {
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isLoading = false
            this.isApiError = true
            this.apiErrorMessage = error.message
        })
    }

}

export default CcbillErrorStore
