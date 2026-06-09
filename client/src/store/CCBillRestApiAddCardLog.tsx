import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getAddCardLogList, getCountry } from '../api/CCBillRestApiAddCardLog'
import { CountryDetails } from '../types/types'

interface ErrorLog {
    _id: string
    is_processed: boolean
    domain: string
    user_id: string
    error_message: string
    createdAt: Date
    updatedAt: Date
}

interface filterOption {
    domain: Array<string>,
    email: string,
    user_id: string,
    is_error: string,
    start_date: string,
    end_date: string,
    countries: Array<string>,
    is_unique: boolean,
    exclude_include_country: string,
    payment_gateway: string
    card_id: string
    exclude_include_domain: string
    reCaptCha: Array<string>
}

class CCBillRestApiAddCardLogStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public logList: Array<ErrorLog>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public totalRows: number
    @observable public totalSuccess: number
    @observable public totalFail: number
    @observable public filter: filterOption
    @observable public countryList: Array<CountryDetails>
    @observable public totalSubscribed: number

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
        this.totalSuccess = 0
        this.totalFail = 0
        this.filter = {
            domain: [],
            email: '',
            user_id: '',
            is_error: '',
            start_date: '',
            end_date: '',
            countries: [],
            is_unique: true,
            exclude_include_country: 'exclude',
            payment_gateway: 'all',
            card_id: '',
            exclude_include_domain: 'include',
            reCaptCha: []
        }
        this.countryList = []
        this.totalSubscribed = 0
    }

    @action.bound
    getCardAddLog(currentPage: number, filter: filterOption): void {
        this.isLoading = true
        getAddCardLogList(currentPage, filter).then((response) => {
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
            this.totalSuccess = responseData.totalSuccess
            this.totalFail = responseData.totalFailed
            this.totalSubscribed = responseData.totalSubscribed
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
    getCountryList(): void {
        getCountry().then((response) => {
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.countryList = responseData.countries
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }
}

export default CCBillRestApiAddCardLogStore
