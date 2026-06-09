import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getForumpayTransactionStatistics } from '../api/ForumPayTransactionHistory'
import { toast } from 'react-toastify'

interface filterOption {
    domain?: string,
    start_date?: string,
    end_date?: string,
    user_id?: string
}

interface IBalance {
    total_credit: number
    total_debit: number
    total_balance: number
}

class ForumPayTransactionStatisticsStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public filter: filterOption
    @observable public balance: IBalance

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.isApiError = false
        this.isLoading = false
        this.balance = {
            total_credit: 0,
            total_debit: 0,
            total_balance: 0
        }
        this.apiErrorMessage = ''
        this.filter = {
            domain: '',
            start_date: '',
            end_date: '',
            user_id: ''
        }
    }

    @action.bound
    getForumpayTransactionStatisticsList() {
        this.isLoading = true
        getForumpayTransactionStatistics(this.filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data.data
            if (responseData.isValidUserId === false) {
                this.isLoading = false
                toast.error('please enter valid user id')
                return
            }
            this.balance = responseData.balance
        })
    }
}

export default ForumPayTransactionStatisticsStore
