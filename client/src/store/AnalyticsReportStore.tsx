import { observable, makeObservable } from 'mobx'
import RootStore from './Root'
import { getMonthlyEarningReportCSV, downloadCsv } from '../api/analytics'

class AnalyticsReportStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public reportType: string
    @observable public website: string
    @observable public start_date: string
    @observable public end_date: string
    @observable public csv_file: string
    @observable public isCSVAvailable: boolean
    @observable public csvFile: string

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.reportType = ''
        this.website = ''
        this.start_date = ''
        this.end_date = ''
        this.csv_file = ''
        this.csvFile = ''
        this.isCSVAvailable = false
    }

    exportCSVForUserCountAnalytics = (): void => {
        const postData = {
            domain: this.website,
            report_type: this.reportType,
            start_date: this.start_date,
            end_date: this.end_date
        }
        this.isLoading = true
        getMonthlyEarningReportCSV(postData).then((response) => {
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

    setDates = (start_date: string, end_date: string): void => {
        this.start_date = start_date
        this.end_date = end_date
    }
}

export default AnalyticsReportStore
