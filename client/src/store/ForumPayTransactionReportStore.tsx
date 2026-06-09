import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getForumpayTransactionReports } from '../api/forumpayTransactionReport'

interface ForumPayTransactionReport {
    transaction_id: string
    amount: string
    email: string
    pcp_transaction_type: string
    pcp_user_id: string
    pcp_transaction_id: string
    website_url: string
    createdAt: string
    updatedAt: string
}

interface filterOption {
    start_date: string,
    end_date: string,
    transaction_id: string
    email: string
    pcp_transaction_type: string
    pcp_user_id: string
    pcp_transaction_id: string
    website_url: string
    limit: number
}

class ForumPayTransactionReport {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public filter: filterOption
    @observable public forumpayTransactionList: Array<ForumPayTransactionReport>

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.forumpayTransactionList = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.filter = {
            start_date: '',
            end_date: '',
            transaction_id: '',
            email: '',
            pcp_transaction_type: 'all',
            pcp_user_id: '',
            pcp_transaction_id: '',
            website_url: '',
            limit: 20
        }
    }

    @action.bound
    getForumPayTransactionReportList(pageNum: number) {
        this.currentPage = pageNum
        this.isLoading = true
        getForumpayTransactionReports(pageNum, this.filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.apiErrorMessage = ''
                this.isApiError = false
                return
            }

            const responseData = response.data
            this.forumpayTransactionList = responseData.rows
            this.limit = responseData.limit
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }
}

export default ForumPayTransactionReport
