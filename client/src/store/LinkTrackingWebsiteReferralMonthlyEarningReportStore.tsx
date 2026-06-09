import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getWebsiteReferralDataByReferral, getCSVOfReferralEarning } from '../api/WebsiteReferral'
import moment from 'moment'
import { downloadCsv } from '../api/analytics'
import FileSaver from 'file-saver'

interface filter {
    domain: string
    start_date: string
    end_date: string,
    referral_id: string,
    requestFrom?: string
}

class LinkTrackingWebsiteReferralEarningReport {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public websiteReferralEarningReportData: Array<[]>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public redirect: string
    @observable public filter: filter
    @observable public csvUrl: string
    @observable public csvFile: string
    @observable public earningReportSummary: Array<[]>

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.websiteReferralEarningReportData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.redirect = ''
        this.filter = {
            domain: '',
            start_date: moment().startOf('month').format('MM-DD-YYYY'),
            end_date: moment().endOf('month').format('MM-DD-YYYY'),
            referral_id: '',
            requestFrom: ''
        }
        this.csvUrl = ''
        this.csvFile = ''
        this.earningReportSummary = []
    }

    @action.bound
        getWebsiteReferralData = (filter: object, currentPage: number): void => {
            this.isLoading = true
            getWebsiteReferralDataByReferral(filter, currentPage).then((response) => {
                this.isLoading = false
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                const responseData = response.data.data
                this.websiteReferralEarningReportData = responseData.row
                this.currentPage = responseData.currentPage
                this.totalPage = responseData.totalPages
                this.limit = responseData.limit
                this.totalRows = responseData.totalRows
                this.csvUrl = responseData.csvUrl
                if (currentPage === 1) {
                    this.earningReportSummary = responseData.summary_report
                }
                this.isApiError = false
                this.apiErrorMessage = ''
                return
            })
        }

    getCSVFromUrl = (): void => {
        getCSVOfReferralEarning(this.filter).then((response) => {
            this.isLoading = false
            if (response.data.status === 500) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                alert(this.apiErrorMessage)
                return
            }

            this.csvUrl = response.data.data.csvUrl
            this.downloadCSVFromUrl()
            return
        })
    }

    downloadCSVFromUrl = (): void => {
        const postData = {
            file: this.csvUrl
        }
        downloadCsv(postData).then((response) => {
            if (response.status === 200) {
                this.csvFile = response.data

                const csvData = new Blob([this.csvFile], { type: 'text/csv' })
                FileSaver.saveAs(csvData, `referralEarningReportFrom ${this.filter.start_date} To ${this.filter.end_date}.csv`)
            } else {
                alert('Something went wrong')
            }
        })
    }
}

export default LinkTrackingWebsiteReferralEarningReport
