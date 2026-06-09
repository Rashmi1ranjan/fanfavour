import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getApiLimiterLogs } from '../api/apiLimiterLogs'

interface apiLimiter {
    domain: string
    ip_address: string
    created_at: string
    api_end_point: string
    user_id: string
}

interface filterOption {
    domain: string
    start_date: string
    end_date: string
    user_id: string
    ip_address: string
    api_end_point: string
}

class ApiLimiterReport {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public apiLimiterData: Array<apiLimiter>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public filter: filterOption
    @observable public totalRows: number

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.apiLimiterData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.filter = {
            domain: '',
            start_date: '',
            end_date: '',
            user_id: '',
            ip_address: '',
            api_end_point: ''
        }
    }

    clearData = (): void => {
        this.filter = {
            domain: '',
            start_date: '',
            end_date: '',
            user_id: '',
            ip_address: '',
            api_end_point: ''
        }
        this.apiLimiterData = []
    }

    @action.bound
    getApiLimiterLogsList(page_num: number, cb: (success: boolean) => void): void {
        this.currentPage = page_num
        getApiLimiterLogs(page_num, this.filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                cb(false)
                return
            }
            const responseData = response.data
            this.apiLimiterData = responseData.rows
            this.limit = responseData.limit
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            cb(true)
            return
        })
    }
}
export default ApiLimiterReport
