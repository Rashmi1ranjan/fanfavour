import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getUserCountAnalytics, getMonthlyEarningReportCSV } from '../api/analytics'
import { getAppBaseUrl } from './../api/api'
import { UserCountDetail } from '../types/types'
const baseURL = getAppBaseUrl()
interface filterOption {
    domain: string
    start_date: string
    end_date: string
}

class UserCountAnalyticsStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public filter: filterOption
    @observable public showViewModel: boolean
    @observable public userCountDetail: Array<UserCountDetail>
    @observable public csv_url: string
    @observable public isCSVAvailable: boolean

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
            domain: '',
            start_date: '',
            end_date: ''
        }
        this.showViewModel = false
        this.userCountDetail = []
        this.csv_url = ''
        this.isCSVAvailable = false
    }

    clearData = (): void => {
        this.filter = {
            domain: '',
            start_date: '',
            end_date: ''
        }
        this.userCountDetail = []
    }

    @action.bound
    setUserCountAnalytics(page: number) {
        getUserCountAnalytics(page, this.filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.userCountDetail = responseData.records
            this.currentPage = responseData.currentPage
            this.totalPage = responseData.totalPages
            this.limit = responseData.limit
            this.totalRows = responseData.totalRecords
            this.isApiError = false
            this.apiErrorMessage = ''
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        }).catch((error) => {
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isLoading = false
            this.isApiError = true
            this.apiErrorMessage = error.message
        })
    }

    exportCSVForUserCountAnalytics = (): void => {
        getMonthlyEarningReportCSV(this.filter).then((response) => {
            if (response.status === 200) {
                this.csv_url = baseURL + response.data.csvUrl
                this.isCSVAvailable = true
            } else {
                alert('Something went wrong')
            }
        })
    }

    setIsCSVAvailable = (): void => {
        this.isCSVAvailable = false
    }

}

export default UserCountAnalyticsStore
