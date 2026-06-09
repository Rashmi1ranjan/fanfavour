import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getResubscriptionReportData } from '../api/ResubscriptionReport'
import { ResubscriptionOfferDetail, ResubscriptionSummary } from '../types/types'

interface filterOption {
    start_date: string
    end_date: string
    domain: string
    email: string
    user_id: string
    offer_id: string
}

class ResubscriptionReport {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public filter: filterOption
    @observable public resubscriptionReport: Array<ResubscriptionSummary>
    @observable public resubscriptionOfferDetail: ResubscriptionOfferDetail

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.filter = {
            start_date: '',
            end_date: '',
            domain: '',
            email: '',
            user_id: '',
            offer_id: ''
        }
        this.resubscriptionReport = []
        this.resubscriptionOfferDetail = {
            user_min_amount_spend: 0,
            _id: '',
            id: '',
            user_min_active_month: 0,
            title: '',
            recurring_price: 0,
            give_free_month_subscription: 0
        }
    }

    @action.bound
    async getResubscriptionReport(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        const response = await getResubscriptionReportData(page_num, this.filter)
        if (response.data.success === 0) {
            this.isApiError = true
            this.apiErrorMessage = response.data.message
            return
        }
        const responseData = response.data.data
        this.resubscriptionReport = responseData.rows
        this.limit = responseData.limit
        this.totalPage = responseData.totalPages
        this.totalRows = responseData.totalRows
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = false
        return
    }

    @action.bound
    setResubscriptionOfferDetail(offerData: ResubscriptionOfferDetail) {
        this.resubscriptionOfferDetail = offerData
        return
    }
}

export default ResubscriptionReport
