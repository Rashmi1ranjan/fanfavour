import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getOptInReport, getAllOptInCountReport } from '../api/OptInReport'

interface opt_in_pending {
    popupDisplayCount: number
    activeUserCount: number
    activeCancelledUserCount: number
    cancelledUserCount: number
    registeredUserCount: number
    total: number
}

interface totalCount {
    popupDisplayCount: number
    activeUser: number
    activeCancelledUserCount: number
    cancelledUserCount: number
    registeredUserCount: number
    total: number
}
interface optInReport {
    bounced: opt_in_pending
    bounced_declined: opt_in_pending
    declined: opt_in_pending
    opt_in_pending: opt_in_pending
    opt_in_link_sent: opt_in_pending
    opt_in: opt_in_pending
    total: totalCount
}

interface optInCountReport {
    opt_in_pending : number
    opt_in_link_sent : number
    opt_in : number
    declined : number
    bounced : number
    bounced_declined : number
    total : number
}

const commonObject = {
    popupDisplayCount: 0,
    activeUserCount: 0,
    activeCancelledUserCount: 0,
    cancelledUserCount: 0,
    registeredUserCount: 0,
    total: 0
}
const commonObjectForTotal = {
    popupDisplayCount: 0,
    activeUser: 0,
    activeCancelledUserCount: 0,
    cancelledUserCount: 0,
    registeredUserCount: 0,
    total: 0
}
class OptInReport {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public optInReportData: optInReport
    @observable public allOptInReportData: optInCountReport
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.optInReportData = {
            opt_in_pending: commonObject,
            opt_in_link_sent: commonObject,
            opt_in: commonObject,
            declined: commonObject,
            bounced: commonObject,
            bounced_declined: commonObject,
            total: commonObjectForTotal
        }
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.allOptInReportData = {
            opt_in_pending : 0,
            opt_in_link_sent : 0,
            opt_in : 0,
            declined : 0,
            bounced : 0,
            bounced_declined : 0,
            total : 0
        }
    }

    @action.bound
    getOptInReportList(page_num: number, filter: object) {
        this.currentPage = page_num
        getOptInReport(page_num, filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.optInReportData = responseData.rows
            this.limit = responseData.limit
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
    getAllOptInCount() {
        getAllOptInCountReport().then((response) => {
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data.rows
            this.allOptInReportData = responseData[0]
            return
        })
    }
}
export default OptInReport
