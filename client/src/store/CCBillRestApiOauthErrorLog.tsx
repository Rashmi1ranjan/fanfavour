import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getOauthErrorLogList } from '../api/CCBillRestApiOauthErrorLog'

interface ErrorLog {
    _id: string
    is_processed: boolean
    domain: string
    user_id: string
    error_message: string
    createdAt: Date
    updatedAt: Date
}

class CCBillRestApiOauthErrorLogStore {
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
    getOauthErrorLog(currentPage: number, filter: object): void {
        getOauthErrorLogList(currentPage, filter).then((response) => {
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

}

export default CCBillRestApiOauthErrorLogStore
