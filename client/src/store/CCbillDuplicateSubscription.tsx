import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getDuplicateSubscriptionLogList, updateLogAsProcessed } from '../api/CCbillDuplicateSubscriptionLog'

interface ErrorLog {
    _id: string
    isProcessed: boolean
    domain: string
    subscription_sub_account: string
    user_id: string
    card_id: string
    card_last_four_digits: boolean
    exist_in_collection: string
    createdAt: Date
    updatedAt: Date
}

class CCBillDuplicateSubscriptionLogStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public logList: Array<ErrorLog>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public totalRows: number

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.logList = []
        this.currentPage = 1
        this.totalPage = 0
        this.totalRows = 0
    }

    @action.bound
    getDuplicateSubscription(currentPage: number, filter: object): void {
        getDuplicateSubscriptionLogList(currentPage, filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.logList = responseData.rows
            this.currentPage = responseData.currentPage
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
        markLogProcessed = (id: string, filter: object): void => {
            this.isApiError = false
            this.apiErrorMessage = ''
            this.isLoading = true
            const data = {
                log_id: id
            }
            if (window.confirm('Are you sure to mark this log as processed?') === true) {
                updateLogAsProcessed(data).then((response) => {
                    this.isLoading = false
                    if (response.data.status === false) {
                        this.isApiError = true
                        this.apiErrorMessage = response.data.message
                        alert(this.apiErrorMessage)
                        return
                    }
                    alert(response.data.message)
                    this.getDuplicateSubscription(this.currentPage, filter)
                    this.isApiError = false
                    this.apiErrorMessage = ''
                    return
                })
            }
            this.isLoading = false
            return
        }

}

export default CCBillDuplicateSubscriptionLogStore
