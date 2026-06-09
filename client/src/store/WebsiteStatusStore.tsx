import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getAllWebsites, getWebsiteStatus } from '../api/WebsiteStatusCheck'
import { OptionType } from '../types/types'

interface website {
    website_id: number
    website_url: string
    status: string,
    last_registered_user: string,
    last_transaction_time: string,
    version: string
}

interface websiteVersionSummary {
    version: string
    count: number
}

interface Filter {
    domain: string
    status: OptionType
    version: string
}

class AnalyticsReportStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public websites: Array<website>
    @observable public websitesPerPage: Array<website>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public totalOnlineSites: number
    @observable public totalOfflineSites: number
    @observable public websiteVersionSummary: Array<websiteVersionSummary>
    @observable public checkingOnlineStatus: boolean
    @observable public filter: Filter
    @observable public showWebsiteFilter: boolean
    @observable public filteredWebsites: Array<website> | null

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.websites = []
        this.websitesPerPage = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 10
        this.totalRows = 0
        this.totalOnlineSites = 0
        this.totalOfflineSites = 0
        this.websiteVersionSummary = []
        this.checkingOnlineStatus = false
        this.filter = {
            domain: '',
            status: { label: 'All', value: '' },
            version: ''
        }
        this.showWebsiteFilter = false
        this.filteredWebsites = null
    }

    @action.bound
        setAllWebsites = async () => {
            this.websites = []
            this.filteredWebsites = null
            this.totalOnlineSites = 0
            this.totalOfflineSites = 0
            this.websiteVersionSummary = []
            this.checkingOnlineStatus = true
            this.showWebsiteFilter = false
            this.filter = {
                domain: '',
                status: { label: 'All', value: '' },
                version: ''
            }
            this.isLoading = true
            const response = await getAllWebsites()
            this.isLoading = false

            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                this.checkingOnlineStatus = false
                return
            }
            const responseData = response.data
            this.websites = responseData.data.websites
            this.isApiError = false
            this.apiErrorMessage = ''
            this.setWebsiteStatus()
            return
        }

    setWebsiteStatus = async () => {
        for (const website of this.websites) {
            const response = await getWebsiteStatus(website.website_url)
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                this.checkingOnlineStatus = false
                return
            }
            const responseData = response.data
            website.status = responseData.data.website_status
            if (responseData.data.website_status === 'Online') {
                this.totalOnlineSites++
            } else {
                this.totalOfflineSites++
            }
            website.last_registered_user = responseData.data.last_registered_user
            website.last_transaction_time = responseData.data.last_transaction_time
            website.version = responseData.data.version

            if (website.version !== undefined) {
                const websiteVersionDetail = this.websiteVersionSummary.findIndex(versionSummary => versionSummary.version === website.version)
                if (websiteVersionDetail === -1) {
                    const versionSummary = {
                        version: website.version,
                        count: 1
                    }
                    this.websiteVersionSummary.push(versionSummary)
                } else {
                    this.websiteVersionSummary[websiteVersionDetail].count++
                }
            }

            this.websites = this.websites.map(site => site.website_url === website.website_url ? website : site)
        }
        this.checkingOnlineStatus = false
        this.showWebsiteFilter = true
    }

    @action.bound
        filterWebsites = () => {
            this.filteredWebsites = this.websites.filter(website => {
                const { domain, status, version } = this.filter
                return (
                    (domain ? website.website_url === domain : true) &&
                    (status.value ? website.status === status.value : true) &&
                    (version ? website.version === version : true)
                )
            })
        }
}

export default AnalyticsReportStore
