import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getUniversalLoginEventLogs } from '../api/UniversalLoginLogs'
import { AxiosResponse } from 'axios'

interface filterOption {
    email: string,
    domain: Array<string>
    event: Array<string>
    start_date: string
    end_date: string,
    page: number
}

class UniversalLoginLogsStore {
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
            email: '',
            domain: [],
            event: [],
            start_date: '',
            end_date: '',
            page: 1
        }
    }

    @action.bound
    getEventLogs(): void {
        this.isLoading = true
        getUniversalLoginEventLogs(this.filter).then((response: AxiosResponse) => {
            this.dataRow = response.data.data.rows
            this.currentPage = response.data.data.currentPage
            this.totalPage = response.data.data.totalPage
            this.totalRows = response.data.data.totalRows
            this.limit = response.data.data.limit
            this.isApiError = false
            this.isLoading = false
        }).catch(() => {
            this.isApiError = true
            this.isLoading = false
        })
    }
}

export default UniversalLoginLogsStore
