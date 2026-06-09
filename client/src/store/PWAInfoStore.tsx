import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getPWAInfo } from '../api/PWAInfo'
import { PwaInfo } from '../types/types'

interface Filter {
    domain: string;
    device_type: string;
    page_num: number;
    is_running_from_pwa: string;
    subscribers_only: string;
}

class pwaInfo {

    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public pwaInfoData: Array<PwaInfo>
    @observable public filter: Filter
    @observable public averageCountsFor30Days: number
    @observable public averageCountsFor90Days: number
    @observable public averageInstalls: number
    @observable public avgPopupDisplayed: number

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
        this.averageCountsFor30Days = 0
        this.averageCountsFor90Days = 0
        this.averageInstalls = 0
        this.avgPopupDisplayed = 0
        this.pwaInfoData = []
        this.filter = {
            domain: '',
            device_type: 'all',
            page_num: this.currentPage,
            is_running_from_pwa: 'all',
            subscribers_only: 'all'
        }
    }

    @action.bound
    getPWAInfoData(page_num: number) {
        this.filter.page_num = page_num
        this.isLoading = true
        getPWAInfo(this.filter).then((response) => {
            const responseData = response.data.data
            this.pwaInfoData = responseData.rows
            this.currentPage = responseData.currentPage
            this.totalPage = responseData.totalPages
            this.limit = responseData.limit
            this.totalRows = responseData.totalRows
            this.averageCountsFor30Days = responseData.averageCountsFor30Days
            this.averageCountsFor90Days = responseData.averageCountsFor90Days
            this.averageInstalls = responseData.averageInstalls
            this.avgPopupDisplayed = responseData.avgPopupDisplayed
            this.isLoading = false
        })
    }
}

export default pwaInfo
