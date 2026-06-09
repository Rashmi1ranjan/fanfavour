import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getStickyIoTransactionReports, markChargebackOrder } from '../api/StickyIoTransactionReports'
import { ITransactionInfo } from '../types/types'

interface StickyIoTransactionReport {
    transaction_type?: string
    campaign_id?: string
    product_id?: string
    order_id?: string
    amount?: string
    first_name?: string
    last_name?: string
    email?: string
    card_type?: string
    is_recurring?: string
    transaction_date?: string
    pcp_transaction_type?: string
    pcp_user_id?: string
    pcp_transaction_id?: string
    website_url?: string
    createdAt?: string
}

interface filterOption {
    start_date: string
    end_date: string
    website_url: string
    limit: number
    is_recurring: string
    campaign_id: string
    order_id: string
    email: string
    user_id: string
    transaction_id: string
    transaction_type: string
    pcp_transaction_type: string
    gateway_id: string
    payment_transaction_id: string
}

class StickyIoTransactionReports {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public StickyIoTransactionReportsData: Array<StickyIoTransactionReport>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public filter: filterOption
    @observable public transactionDetails: ITransactionInfo

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.StickyIoTransactionReportsData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.filter = {
            start_date: '',
            end_date: '',
            website_url: '',
            limit: 20,
            is_recurring: 'all',
            campaign_id: '',
            order_id: '',
            email: '',
            user_id: '',
            transaction_id: '',
            transaction_type: 'all',
            pcp_transaction_type: 'all',
            gateway_id: 'all',
            payment_transaction_id: ''
        }
        this.transactionDetails = {
            transaction_id: '',
            notes: '',
            chargeback_date: ''
        }
    }

    @action.bound
    getStickyIoTransactionReportsList(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        getStickyIoTransactionReports(page_num, this.filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.StickyIoTransactionReportsData = responseData.rows
            this.limit = responseData.limit
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
    setTransactionDetails(data: { _id: string }) {
        this.resetTransactionDetails()
        this.transactionDetails.transaction_id = data._id
        return
    }

    @action.bound
    resetTransactionDetails() {
        this.transactionDetails = {
            transaction_id: '',
            notes: '',
            chargeback_date: ''
        }
    }

    @action.bound
    async markTransactionAsChargeback(data: ITransactionInfo) {
        this.isLoading = true
        const response = await markChargebackOrder(data)
        this.isLoading = false
        return response.data
    }
}

export default StickyIoTransactionReports
