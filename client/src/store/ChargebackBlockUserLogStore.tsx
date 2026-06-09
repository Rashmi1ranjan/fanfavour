import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getChargebackBlockedUserLogs } from '../api/ChargebackBlockUserLog'

interface chargebackBlockUser {
    domain?: string
    user_id?: string
    subscription_id?: string
    email?: string
    chargeback_reason?: string
    chargeback_date?: string
}

interface filterOption {
    domain: string
    limit: number
    start_date: string
    end_date: string
    user_id: string
    subscription_id: string
    email: string
}

class chargebackBlockUserLog {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public chargebackBlockUserLogData: Array<chargebackBlockUser>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public filter: filterOption

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.chargebackBlockUserLogData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.filter = {
            domain: '',
            limit: 50,
            start_date: '',
            end_date: '',
            user_id: '',
            subscription_id: '',
            email: ''
        }
    }

    @action.bound
    async getChargebackBlockUserLogList(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        const response = await getChargebackBlockedUserLogs(page_num, this.filter)
        this.isLoading = false
        if (response.data.success === 0) {
            this.isApiError = true
            this.apiErrorMessage = response.data.message
            return
        }
        const responseData = response.data
        this.chargebackBlockUserLogData = responseData.rows
        this.limit = responseData.limit
        this.totalPage = responseData.totalPages
        this.totalRows = responseData.totalRows
        this.isApiError = false
        this.apiErrorMessage = ''
        return
    }
}

export default chargebackBlockUserLog
