import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getPromotionReport } from '../api/PromotionReport'

interface promotionReport {
    website_url: string
    promotion_id: string
    promotion_info: string
    start_date: string
    duration: string
    discount: string
    promo_message: string
    number_of_transaction: string
    revenue: string
    registration: string
    promotion_type: string
    created_at: string
    applicable_to: string
}

class PromotionReport {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public promotionReportData: Array<promotionReport>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.promotionReportData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
    }

    @action.bound
    getPromotionReportList(page_num: number, filter: object) {
        this.currentPage = page_num
        getPromotionReport(page_num, filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            console.log(response)
            const responseData = response.data
            this.promotionReportData = responseData.rows
            this.limit = responseData.limit
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }
}
export default PromotionReport
