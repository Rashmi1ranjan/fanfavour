import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getStickyIoSuccessErrorLogs } from '../api/StickyIoTransactionLogs'
import { getAllStickyIoPaymentProfile } from '../api/StickyIoPaymentProfiles'
import { GatewayInfo } from '../types/types'

interface stickyIoLogs {
    domain?: string
    user_id?: string
    transaction_type?: string
    is_recurring?: boolean
    request_url?: string
    request_data?: object
    transaction_status?: string
    sticky_io_response?: object
    transaction_for?: string
}

interface filterOption {
    domain: string
    limit: number
    is_recurring: string | boolean
    transaction_status: string
    transaction_for: string
    start_date: string
    end_date: string
    user_id: string
    ip_address: string
    transaction_id: string
    auth_id: string
    order_id: string
    gateway_id: string
    is_unique: string | boolean
}

class StickyIoLogs {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public stickyIoLogsData: Array<stickyIoLogs>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public viewLogData: stickyIoLogs
    @observable public filter: filterOption
    @observable public paymentGateways: Array<GatewayInfo>

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.stickyIoLogsData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.viewLogData = {}
        this.filter = {
            domain: '',
            limit: 50,
            is_recurring: 'all',
            transaction_status: 'all',
            transaction_for: 'all',
            start_date: '',
            end_date: '',
            user_id: '',
            ip_address: '',
            transaction_id: '',
            auth_id: '',
            order_id: '',
            gateway_id: 'all',
            is_unique: true
        }
        this.paymentGateways = []
    }

    @action.bound
    getStickyIoLogsList(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        getStickyIoSuccessErrorLogs(page_num, this.filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.stickyIoLogsData = responseData.rows
            this.limit = responseData.limit
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
    setCcbillErrorDetailById(data: stickyIoLogs) {
        this.viewLogData = data
        return
    }

    @action.bound
    getAllStickyIoPaymentGateways() {
        this.isLoading = true
        getAllStickyIoPaymentProfile().then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            this.paymentGateways = response.data.rows
            return
        })
    }
}

export default StickyIoLogs
