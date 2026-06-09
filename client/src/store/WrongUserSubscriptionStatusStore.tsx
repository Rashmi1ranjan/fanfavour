import { observable, action, makeObservable } from 'mobx'
import { AxiosResponse } from 'axios'
import RootStore from './Root'
import { getWrongUserSubscriptionStatusLog, fixWrongUserSubscriptionStatus } from '../api/WrongUserSubscriptionStatusLog'
import { WrongUserSubscriptionStatusLog } from '../types/types'

interface filterOption {
    website_url?: string
    user_id?: string
    transaction_type?: string
}

class WrongUserSubscriptionStatusStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public wrongUserSubscriptionStatusLogData: Array<WrongUserSubscriptionStatusLog>
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
        this.wrongUserSubscriptionStatusLogData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.filter = {
            website_url: '',
            user_id: '',
            transaction_type: 'all'
        }
    }

    @action.bound
    getWrongUserSubscriptionStatusList(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        getWrongUserSubscriptionStatusLog(page_num, this.filter).then((response: AxiosResponse) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data.data
            this.wrongUserSubscriptionStatusLogData = responseData.rows
            this.limit = responseData.limit
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
        markLogProcessed = async (id: string) => {
            this.isLoading = true
            const data = { id: id }
            if (window.confirm('Are you sure to mark this log as processed?') === true) {
                const response = await fixWrongUserSubscriptionStatus(data)
                this.isLoading = false
                if (response.data.status === false) {
                    alert(this.apiErrorMessage)
                    return
                }
                alert(response.data.message)
                this.getWrongUserSubscriptionStatusList(this.currentPage)
                return
            }
            this.isLoading = false
            return
        }
}

export default WrongUserSubscriptionStatusStore
