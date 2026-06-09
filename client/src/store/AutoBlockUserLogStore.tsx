import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getAutoBlockUsers, markAutoBlockUserAsProcessed } from '../api/apiLimitConfiguration'
import { AutoBlockUser } from '../types/types'

interface filterOption {
    api_end_point: string
    user_id: string
    subscription_id: string
    ip_address: string
    domain: string
    subscription_status: string
    is_processed: string,
    start_date: string,
    end_date: string,
}

class AutoBlockUserLogStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isLoading: boolean
    @observable public autoBlockUserList: Array<AutoBlockUser>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public filter: filterOption

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isLoading = false
        this.autoBlockUserList = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 20
        this.totalRows = 0
        this.filter = {
            api_end_point: '',
            user_id: '',
            subscription_id: '',
            ip_address: '',
            domain: '',
            subscription_status: '',
            is_processed: 'false',
            start_date: '',
            end_date: ''
        }
    }

    @action.bound
    async getAutoBlockUserLog(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        const response = await getAutoBlockUsers(page_num, this.filter)
        this.isLoading = false
        if (response.data.success === 0) {
            this.apiErrorMessage = response.data.message
            return
        }
        const responseData = response.data.data
        this.autoBlockUserList = responseData.rows
        this.totalPage = responseData.totalPages
        this.totalRows = responseData.totalRows
        return
    }

    @action.bound
        markLogProcessed = async (id: string) => {
            this.isLoading = true
            const data = { log_id: id }
            if (window.confirm('Are you sure to mark this log as processed?') === true) {
                const response = await markAutoBlockUserAsProcessed(data)
                this.isLoading = false
                if (response.data.status === false) {
                    alert(this.apiErrorMessage)
                    return
                }
                alert(response.data.message)
                this.getAutoBlockUserLog(this.currentPage)
                return
            }
            this.isLoading = false
            return
        }
}

export default AutoBlockUserLogStore
