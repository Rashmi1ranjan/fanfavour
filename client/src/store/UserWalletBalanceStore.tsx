import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getUsersWalletDetails } from '../api/ForumPayTransactionHistory'
import { toast } from 'react-toastify'
import { UserWalletDetails } from '../types/types'

interface filterOption {
    user_id?: string
    email?: string
    domain?: string
}

class UserWalletBalanceStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public usersWalletDetails: Array<UserWalletDetails>
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
        this.usersWalletDetails = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.filter = {
            user_id: '',
            email: '',
            domain: ''
        }
    }

    @action.bound
    getUsersWalletDetailsList(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        getUsersWalletDetails(page_num, this.filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                toast.error(response.data.message)
                return
            }
            const responseData = response.data.data
            this.usersWalletDetails = responseData.rows
            this.limit = responseData.limit
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }
}

export default UserWalletBalanceStore
