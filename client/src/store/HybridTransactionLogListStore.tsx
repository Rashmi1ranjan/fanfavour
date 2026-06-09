import { observable, action, makeObservable } from 'mobx'
import { AxiosResponse } from 'axios'
import RootStore from './Root'
import { getHybridTransactionLogs } from '../api/HybridTransactions'
import { HybridTransactionLog } from '../types/types'

interface filterOption {
    domain: string
    start_date: string
    end_date: string
    is_cascade_transaction: string
    is_success: string
    recurring: string
    pcp_transaction_id: string
    final_payment_gateway: string
    country: string
    is_unique: boolean
    transaction_type: string
    is_cascade_enabled: string
    by_primary_gateway: string
    user_id: string
}

class HybridTransactionLogListStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public hybridTransactionLogsData: Array<HybridTransactionLog>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public filter: filterOption
    @observable public logDetails: HybridTransactionLog

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.hybridTransactionLogsData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 20
        this.totalRows = 0
        this.filter = {
            domain: '',
            start_date: '',
            end_date: '',
            is_cascade_transaction: 'all',
            is_success: 'all',
            recurring: 'all',
            pcp_transaction_id: '',
            final_payment_gateway: 'all',
            country: 'all',
            is_unique: true,
            transaction_type: 'all',
            is_cascade_enabled: 'all',
            by_primary_gateway: 'all',
            user_id: ''
        }
        this.logDetails = {
            is_cascade_transaction: false,
            payment_gateways: [],
            is_cascade_enabled: false,
            by_primary_gateway: false,
            cascade_type: 0,
            transaction_execution_time: 0,
            _id: '',
            domain: '',
            user_id: '',
            is_success: false,
            recurring: '',
            amount: 0,
            transaction_date: '',
            pcp_transaction_id: '',
            final_payment_gateway: '',
            ip_address: '',
            country: '',
            is_unique: false,
            transaction_type: ''
        }
    }

    @action.bound
    getHybridTransactionLogsList(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        getHybridTransactionLogs(page_num, this.filter).then((response: AxiosResponse) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data.data
            this.hybridTransactionLogsData = responseData.rows
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
    setHybridLogDetails(data: HybridTransactionLog) {
        this.logDetails = data
        return
    }
}

export default HybridTransactionLogListStore
