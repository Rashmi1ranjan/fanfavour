import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getWebsiteUserStatisticsLog, exportCSVFile, downloadCsv } from '../api/WebsiteUserStatistics'
import { TotalUserStatistics, Website } from '../types/types'

type IFConfigType = {
    key: string,
    direction: string
}
interface filterOptions {
    page_num?: number
    domain?: string
    sortBy?: IFConfigType
}

class WebsiteUserStatisticsStore {
    public rootStore: RootStore
    @observable public isLoading: boolean
    @observable public totalUsers: Array<TotalUserStatistics>
    @observable public websiteStatistics: Array<Website>
    @observable public currentPage: number
    @observable public totalPages: number
    @observable public totalRows: number
    @observable public limit: number
    @observable public filter: filterOptions
    @observable public apiErrorMessage: string
    @observable public isCSVAvailable: boolean
    @observable public csvFileName: string
    @observable public csvFile: string

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.isLoading = false
        this.totalUsers = []
        this.websiteStatistics = []
        this.currentPage = 1
        this.totalPages = 0
        this.limit = 0
        this.totalRows = 0
        this.isCSVAvailable = false
        this.csvFileName = ''
        this.csvFile = ''
        this.filter = {
            page_num: 1,
            domain: '',
            sortBy: { key: 'recently_visited_subscribers_45', direction: 'desc' }
        }
        this.apiErrorMessage = ''
    }

    @action.bound
    getWebsiteUserStatistics() {
        this.isLoading = true
        getWebsiteUserStatisticsLog(this.filter)
            .then((response) => {
                const responseData = response.data.data
                if (responseData.success === 0) {
                    this.apiErrorMessage = responseData.message
                    return
                }
                this.apiErrorMessage = ''
                let websiteIndex = (responseData.currentPage - 1) * responseData.limit + 1
                const websites = responseData.rows
                const websiteList = websites.map((website: Website) => ({ ...website, website_index: websiteIndex++ }))
                this.websiteStatistics = websiteList
                this.limit = responseData.limit
                this.totalPages = responseData.totalPages
                this.totalRows = responseData.totalRows
                this.currentPage = responseData.currentPage
                this.totalUsers = responseData.totalWebsitesUsersStatisticsData
                this.isLoading = false
                return
            })
    }

    @action.bound
    generateCSV() {
        this.isLoading = true
        exportCSVFile().then((response) => {
            this.isCSVAvailable = true
            this.csvFileName = response.data.data.csvUrl
            this.isLoading = false
            this.downloadCSVFromUrl()
            return
        })
    }

    @action.bound
        downloadCSVFromUrl = (): void => {
            const postData = {
                file: this.csvFileName
            }
            downloadCsv(postData).then((response) => {
                if (response.status === 200) {
                    this.csvFile = response.data
                } else {
                    alert('Something went wrong')
                }
            })
        }
}

export default WebsiteUserStatisticsStore
