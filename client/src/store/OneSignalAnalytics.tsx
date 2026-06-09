import { observable, action, makeObservable } from 'mobx'
import moment from 'moment'
import RootStore from './Root'
import { getOneSignalAnalyticData } from '../api/OneSignalAnalytics'

interface filterOption {
    page: number,
    domain: Array<string>
    start_date: string
    end_date: string
}

class OneSignalAnalyticsStore {
    public rootStore: RootStore
    @observable public isLoading: boolean
    @observable public isApiError: boolean
    @observable public filter: filterOption
    @observable public dataRow: Array<object>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public totalRows: number
    @observable public limit: number

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.isLoading = true
        this.isApiError = false
        this.dataRow = []
        this.currentPage = 1
        this.totalPage = 0
        this.totalRows = 0
        this.limit = 0
        this.filter = {
            page: 1,
            domain: [],
            start_date: moment().subtract(7, 'days').format('MM/DD/YYYY'),
            end_date: moment().format('MM/DD/YYYY')
        }
    }

    @action.bound
    getAnalyticData(): void {
        this.isLoading = true
        getOneSignalAnalyticData(this.filter).then((response) => {
            if (response.data.success === 1) {
                this.dataRow = response.data.data.rows
                this.currentPage = response.data.data.currentPage
                this.totalPage = response.data.data.totalPage
                this.totalRows = response.data.data.totalRows
                this.limit = response.data.data.limit
            } else {
                this.isApiError = true
            }
            this.isLoading = false
        }).catch((error) => {
            console.log(error)
            this.isApiError = true
            this.isLoading = false
        })
    }
}

export default OneSignalAnalyticsStore
