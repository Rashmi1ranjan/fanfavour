import { makeObservable, observable } from 'mobx'
import RootStore from './Root'
import { getMonthlyEarningReportCSV, getDailyEarningReport, downloadCsv, getMonthlyEarningReport } from '../api/EarningReport'

interface filterOption {
    domain: string
    start_date: string
    end_date: string
}

interface EarningReportFilter {
    startDate: string;
    endDate: string;
    isReferral: boolean;
    withFormula: boolean;
    earningReportSelect: string;
    stickyIoSelect: string;
}

class WebsiteEarningStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public earning_csv_file: string
    @observable public daily_earning_report: Array<[]>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public isCSVAvailable: boolean
    @observable public csvFile: string
    @observable public monthly_earning_report: Array<[]>
    @observable public monthly_filter: filterOption
    @observable public monthly_earning_currentPage: number
    @observable public monthly_earning_totalPage: number
    @observable public monthly_earning_totalRows: number
    @observable public total_earning_report: Array<[]>

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.earning_csv_file = ''
        this.daily_earning_report = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.isCSVAvailable = false
        this.csvFile = ''
        this.monthly_earning_report = []
        this.monthly_filter = {
            domain: '',
            start_date: '',
            end_date: ''
        }
        this.monthly_earning_currentPage = 1
        this.monthly_earning_totalPage = 0
        this.monthly_earning_totalRows = 0
        this.total_earning_report = []
    }


    generateMonthlyEarningReportCSV = (filter: EarningReportFilter): void => {
        this.isLoading = true
        getMonthlyEarningReportCSV(filter).then((response) => {
            if (response.status === 200) {
                this.earning_csv_file = response.data.csvUrl
                this.downloadCSVFromUrl()
                this.isCSVAvailable = true
                this.isLoading = false
            } else {
                alert('Something went wrong')
                this.isLoading = false
            }
        })
    }

    downloadCSVFromUrl = (): void => {
        const postData = {
            file: this.earning_csv_file
        }
        downloadCsv(postData).then((response) => {
            if (response.status === 200) {
                this.csvFile = response.data
            } else {
                alert('Something went wrong')
            }
        })
    }

    setIsCSVAvailable = (): void => {
        this.isCSVAvailable = false
    }

    getDailyEarningReportDate = (page: number, filter: object): void => {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        getDailyEarningReport(page, filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data

            this.daily_earning_report = responseData.rows
            this.currentPage = responseData.currentPage
            this.totalPage = responseData.totalPages
            this.limit = responseData.limit
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    getMonthlyEarningReportDate = (page_number: number): void => {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        getMonthlyEarningReport(page_number, this.monthly_filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            const currentRecords = responseData.data.rows.length
            this.monthly_earning_report = responseData.data.rows
            this.total_earning_report = responseData.data.totalEarning
            this.monthly_earning_currentPage = currentRecords > 0 ? responseData.data.currentPage : 1
            this.monthly_earning_totalPage = currentRecords > 0 ? responseData.data.totalPages : 0
            this.monthly_earning_totalRows = currentRecords > 0 ? responseData.data.totalRows : 0
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }
}

export default WebsiteEarningStore
