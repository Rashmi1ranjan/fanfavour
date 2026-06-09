import { observable, makeObservable } from 'mobx'
import RootStore from './Root'
import { getMonthlyRevenueReportCSV, downloadCsv } from '../api/analytics'


class AnalyticsRevenueReportStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public reportType: string
    @observable public website: string
    @observable public csv_file: string
    @observable public csvFile: string
    @observable public isCSVAvailable: boolean

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.reportType = ''
        this.website = ''
        this.csv_file = ''
        this.csvFile = ''
        this.isCSVAvailable = false
    }

    exportCSVForUserCountAnalytics = (): void => {
        const postData = {
            domain: this.website,
            report_type: this.reportType
        }
        this.isLoading = true
        getMonthlyRevenueReportCSV(postData).then((response) => {
            if (response.status === 200) {
                this.csv_file = response.data.csvUrl
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
            file: this.csv_file
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

    setReportType = (type: string): void => {
        this.reportType = type
    }

    setWebsite = (website: string): void => {
        this.website = website
    }
}

export default AnalyticsRevenueReportStore
