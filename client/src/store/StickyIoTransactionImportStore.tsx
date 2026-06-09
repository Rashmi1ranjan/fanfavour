import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { uploadTransactionCSV, getUploadCsvLogs, calculateEarnings } from '../api/StickyIoImportTransaction'

interface csvLog {
    _id: string
    file_name: string
    uploaded_by: string
    createdAt: string
    updatedAt: string
}

class StickyIoTransactionImportStore {
    public rootStore: RootStore
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public logData: Array<csvLog>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public awsUrl: string

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.isApiError = false
        this.isLoading = false
        this.logData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.awsUrl = ''
    }

    @action.bound
    uploadCSV(data: FormData) {
        this.isApiError = false
        this.isLoading = true
        uploadTransactionCSV(data).then((response) => {
            this.isLoading = false
            if (response.data.status === false) {
                this.isApiError = true
                alert(response.data.message)
                return
            }
            this.getCsvLog(1)
            alert(response.data.message)
            return
        })
    }

    @action.bound
    getCsvLog(currentPage: number): void {
        getUploadCsvLogs(currentPage).then((response) => {
            this.isLoading = false
            if (response.data.success === false) {
                this.isApiError = true
                alert(response.data.message)
                return
            }
            const responseData = response.data
            this.logData = responseData.data.rows
            this.currentPage = responseData.data.currentPage
            this.totalPage = responseData.data.totalPages
            this.limit = responseData.data.limit
            this.totalRows = responseData.data.totalRows
            this.isApiError = false
            this.awsUrl = responseData.data.awsUrl
            return
        })
    }

    @action.bound
    calculateEarning(data: { date: string }) {
        this.isApiError = false
        this.isLoading = true
        calculateEarnings(data).then((response) => {
            this.isLoading = false
            if (response.data.status === false) {
                this.isApiError = true
                alert(response.data.message)
                return
            }
            this.getCsvLog(1)
            alert(response.data.message)
            return
        })
    }
}

export default StickyIoTransactionImportStore
