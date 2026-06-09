import { observable, action, makeObservable } from 'mobx'
import moment from 'moment'
import RootStore from './Root'
import {
    addOrUpdateLinkTrackingReferral,
    getLinkTrackingReferralDataById,
    getLinkTrackingReferralList,
    getAllLinkTrackingReferralOption,
    getReferralLinkAnalyticsData,
    addReferralLinkUser,
    getLinkTrackingReferralUserData,
    getLinkTrackingReferralUserDataForSingleUser,
    updateReferralLinkUser,
    deleteLinkTrackingReferralUser,
    getReferralList
} from '../api/linkTrackingReferral'
import _ from 'lodash'

interface linkTrackingReferral {
    _id: string
    name: string
}

interface linkTrackingReferralUserData {
    _id: string
    name: string
    email: string
    password?: string
    referral_links: Array<string>
}

interface linkTrackingReferralAnalyticsData {
    name: string
    visits: number
    registrations: number
    subscriptions: number
    revenue?: number
    refunds?: number
    chargebacks?: number
    total?: number
}

class WebsiteReferral {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public linkTrackingReferralData: Array<linkTrackingReferral>
    @observable public linkTrackingReferralUserData: Array<linkTrackingReferralUserData>
    @observable public linkTrackingReferralUserPaginationData: {
        currentPage: number
        totalPages: number
        limit: number
        totalRows: number
    }
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public redirect: string
    @observable public editLinkTrackingReferralData: linkTrackingReferral
    @observable public allLinkTrackingReferralOptions: Array<linkTrackingReferral>
    @observable public isSaveReferralLinkUser: boolean
    @observable public editLinkTrackingReferralUserData: linkTrackingReferralUserData
    @observable public linkTrackingReferralAnalyticsPaginationData: {
        currentPage: number
        totalPages: number
        limit: number
        totalRows: number
        referral_links: Array<string>
        domains: Array<string>
        start_date: string
        end_date: string
    }
    @observable public linkTrackingReferralAnalyticsData: Array<linkTrackingReferralAnalyticsData>
    @observable public linkTrackingReferralAnalyticsDataLoading: boolean
    @observable public referralList: Array<linkTrackingReferral>

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.linkTrackingReferralData = []
        this.linkTrackingReferralUserData = []
        this.linkTrackingReferralUserPaginationData = {
            currentPage: 1,
            totalPages: 0,
            limit: 0,
            totalRows: 0
        }
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.redirect = ''
        this.editLinkTrackingReferralData = {
            _id: '',
            name: ''
        }
        this.allLinkTrackingReferralOptions = []
        this.isSaveReferralLinkUser = false
        this.editLinkTrackingReferralUserData = {
            _id: '',
            name: '',
            email: '',
            password: '',
            referral_links: []
        }
        this.linkTrackingReferralAnalyticsPaginationData = {
            currentPage: 1,
            totalPages: 0,
            limit: 0,
            totalRows: 0,
            referral_links: [],
            domains: [],
            start_date: moment().subtract(7, 'days').format('MM/DD/YYYY'),
            end_date: moment().format('MM/DD/YYYY')
        }
        this.linkTrackingReferralAnalyticsData = []
        this.linkTrackingReferralAnalyticsDataLoading = false
        this.referralList = []
    }

    @action.bound
    clearLinkTrackingReferralData() {
        this.editLinkTrackingReferralData = {
            _id: '',
            name: ''
        }
    }

    @action.bound
    clearLinkTrackingReferralUserData() {
        this.editLinkTrackingReferralUserData = {
            _id: '',
            name: '',
            email: '',
            password: '',
            referral_links: []
        }
    }

    @action.bound
    async setLinkTrackingReferralData(cb: (success: boolean) => void): Promise<void> {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true

        const id = _.get(this.editLinkTrackingReferralData, '_id', false)

        try {
            const response = await addOrUpdateLinkTrackingReferral(this.editLinkTrackingReferralData)
            this.isLoading = false

            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                alert(this.apiErrorMessage)
                cb(false)
                return
            }

            this.getLinkTrackingReferralData(this.currentPage)
            const message = (!id || id === '') ? 'Data added successfully' : 'Data updated successfully'
            alert(message)
            cb(true)

        } catch (error: any) {
            this.isLoading = false
            this.isApiError = true
            this.apiErrorMessage = error?.message || 'Something went wrong'
            alert(this.apiErrorMessage)
            cb(false)
        }
    }

    @action.bound
        getLinkTrackingReferralDataById = (_id: string): void => {
            this.isLoading = true
            getLinkTrackingReferralDataById(_id).then((response) => {
                if (response.data.success === 0) {
                    this.isLoading = false
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                const responseData = response.data.data
                this.editLinkTrackingReferralData = responseData
                this.isLoading = false
                return
            })
        }

    @action.bound
        getLinkTrackingReferralData = (currentPage: number): void => {
            this.isLoading = true
            getLinkTrackingReferralList(currentPage).then((response) => {
                if (response.data.success === 0) {
                    this.isLoading = false
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                const responseData = response.data.data
                this.linkTrackingReferralData = responseData.rows
                this.currentPage = responseData.currentPage
                this.totalPage = responseData.totalPages
                this.limit = responseData.limit
                this.totalRows = responseData.totalRows
                this.isApiError = false
                this.apiErrorMessage = ''
                this.isLoading = false
                return
            })
        }

    @action.bound
    getAllLinkTrackingReferralWebsiteOptions() {
        getAllLinkTrackingReferralOption().then((response) => {
            const responseData = response.data.data
            this.allLinkTrackingReferralOptions = responseData.rows
        })
    }

    @action.bound
        getLinkTrackingAnalyticsData = (): void => {
            this.linkTrackingReferralAnalyticsDataLoading = true
            getReferralLinkAnalyticsData(this.linkTrackingReferralAnalyticsPaginationData).then((response) => {
                if (response.data.success === 0) {
                    this.linkTrackingReferralAnalyticsDataLoading = false
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                const responseData = response.data.data
                this.linkTrackingReferralAnalyticsData = responseData.rows
                this.linkTrackingReferralAnalyticsPaginationData.totalPages = responseData.totalPages
                this.linkTrackingReferralAnalyticsPaginationData.limit = responseData.limit
                this.linkTrackingReferralAnalyticsPaginationData.totalRows = responseData.totalRows
                this.isApiError = false
                this.apiErrorMessage = ''
                this.linkTrackingReferralAnalyticsDataLoading = false
            })
        }

    @action.bound
        getLinkTrackingReferralUserData = (): void => {
            this.isLoading = true
            getReferralLinkAnalyticsData(this.linkTrackingReferralAnalyticsPaginationData).then((response) => {
                //     if (response.data.success === 0) {
                //         this.isLoading = false
                //         this.isApiError = true
                //         this.apiErrorMessage = response.data.message
                //         return
                //     }
                //     const responseData = response.data.data
                //     this.linkTrackingReferralData = responseData.rows
                //     this.currentPage = responseData.currentPage
                //     this.totalPage = responseData.totalPages
                //     this.limit = responseData.limit
                //     this.totalRows = responseData.totalRows
                //     this.isApiError = false
                //     this.apiErrorMessage = ''
                this.isLoading = false
                //     return
            })
        }

    @action.bound
        getUserData = (currentPage: number): void => {
            this.isLoading = true
            getLinkTrackingReferralUserData(currentPage).then((response) => {
                if (response.data.success === 0) {
                    this.isLoading = false
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                const responseData = response.data.data
                this.linkTrackingReferralUserData = responseData.rows
                this.linkTrackingReferralUserPaginationData.currentPage = responseData.currentPage
                this.linkTrackingReferralUserPaginationData.totalPages = responseData.totalPages
                this.linkTrackingReferralUserPaginationData.limit = responseData.limit
                this.linkTrackingReferralUserPaginationData.totalRows = responseData.totalRows
                this.isApiError = false
                this.apiErrorMessage = ''
                this.isLoading = false
                return
            })
        }

    @action.bound
    async saveReferralLinkUserData(cb: (success: boolean) => void): Promise<void> {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isSaveReferralLinkUser = true

        try {
            const response = await addReferralLinkUser(this.editLinkTrackingReferralUserData)
            this.isSaveReferralLinkUser = false

            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                alert(this.apiErrorMessage)
                cb(false)
                return
            }

            this.getUserData(this.linkTrackingReferralUserPaginationData.currentPage)
            alert(response.data.message)
            cb(true)

        } catch (error: any) {
            this.isSaveReferralLinkUser = false
            this.isApiError = true
            this.apiErrorMessage = error?.message || 'Something went wrong'
            alert(this.apiErrorMessage)
            cb(false)
        }
    }

    @action.bound
    async updateReferralLinkUserData(cb: (success: boolean) => void): Promise<void> {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isSaveReferralLinkUser = true

        try {
            const response = await updateReferralLinkUser(this.editLinkTrackingReferralUserData)
            this.isSaveReferralLinkUser = false

            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                alert(this.apiErrorMessage)
                cb(false)
                return
            }

            this.getUserData(this.linkTrackingReferralUserPaginationData.currentPage)
            alert(response.data.message)
            cb(true)

        } catch (error: any) {
            this.isSaveReferralLinkUser = false
            this.isApiError = true
            this.apiErrorMessage = error?.message || 'Something went wrong'
            alert(this.apiErrorMessage)
            cb(false)
        }
    }

    @action.bound
        getLinkTrackingReferralUserDataById = (_id: string): void => {
            this.isLoading = true
            getLinkTrackingReferralUserDataForSingleUser(_id).then((response) => {
                if (response.data.success === 0) {
                    this.isLoading = false
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                const responseData = response.data.data
                this.editLinkTrackingReferralUserData = responseData
                this.isLoading = false
                return
            })
        }

    @action.bound
        deleteLinkTrackingReferralUserById = (_id: string): void => {
            this.isLoading = true
            deleteLinkTrackingReferralUser(_id).then((response) => {
                if (response.data.success === 0) {
                    this.isLoading = false
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                this.isLoading = false
                this.getUserData(this.linkTrackingReferralUserPaginationData.currentPage)
                alert(response.data.message)
                return
            })
        }

    @action.bound
        getReferralList = (): void => {
            this.isLoading = true
            getReferralList().then((response) => {
                if (response.data.success === 0) {
                    this.isLoading = false
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                this.isLoading = false
                console.log(response.data)
                this.referralList = response.data.data
                return
            })
        }
}

export default WebsiteReferral
