import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getForumPayWebhooks } from '../api/ForumPayTransactionHistory'
import { toast } from 'react-toastify'
import { ForumPayWebhookDetails } from '../types/types'

interface filterOption {
    pcp_transaction_id?: string
    transaction_id?: string
}

class ForumPayTransactionHistoryStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public forumPayWebhookData: Array<ForumPayWebhookDetails>
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
        this.forumPayWebhookData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.filter = {
            pcp_transaction_id: '',
            transaction_id: ''
        }
    }

    @action.bound
    getForumPayWebhooksList(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        getForumPayWebhooks(page_num, this.filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                toast.error(response.data.message)
                return
            }
            const responseData = response.data.data
            this.forumPayWebhookData = responseData.rows
            this.limit = responseData.limit
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }
}

export default ForumPayTransactionHistoryStore
