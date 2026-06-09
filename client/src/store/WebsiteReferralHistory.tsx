import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { addWebsiteReferralHistory, editWebsiteReferralHistory, getWebsiteReferralByDomain, getWebsiteReferralDataById, getWebsiteReferralHistoryList } from '../api/WebsiteReferralHistory'
import _ from 'lodash'
import moment from 'moment'

interface websiteReferralHistory {
    _id: string
    domain: string
    total_referral: number
    referral_name: string
    referral_commission: string
    referral_name1: string
    referral_commission1: string
    referral_name2: string
    referral_commission2: string
    referral_type: string
    referral_type1: string
    referral_type2: string
    target_date: string
    created_date: string
    referral_id: string
    referral_id1: string
    referral_id2: string
}

class WebsiteReferralHistory {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public websiteReferralHistoryData: Array<websiteReferralHistory>
    @observable public editWebsiteReferralHistoryData: websiteReferralHistory
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public redirect: string
    @observable public isWebsiteOptionDataRequested: boolean
    @observable public isLocked: boolean
    @observable public isReferralDataFound: boolean

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.websiteReferralHistoryData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.redirect = ''
        this.isWebsiteOptionDataRequested = false
        this.isLocked = false
        this.isReferralDataFound = true
        this.editWebsiteReferralHistoryData = {
            _id: '',
            domain: 'all',
            total_referral: 1,
            referral_name: '',
            referral_commission: '',
            referral_name1: '',
            referral_commission1: '',
            referral_name2: '',
            referral_commission2: '',
            referral_type: 'normal',
            referral_type1: 'normal',
            referral_type2: 'normal',
            target_date: moment().startOf('day').toISOString(),
            created_date: '',
            referral_id: '',
            referral_id1: '',
            referral_id2: ''
        }
    }

    @action.bound
    clearWebsiteData(): void {
        this.editWebsiteReferralHistoryData = {
            _id: '',
            domain: 'all',
            total_referral: 1,
            referral_name: '',
            referral_commission: '',
            referral_name1: '',
            referral_commission1: '',
            referral_name2: '',
            referral_commission2: '',
            referral_type: 'normal',
            referral_type1: 'normal',
            referral_type2: 'normal',
            target_date: moment().startOf('day').toISOString(),
            created_date: '',
            referral_id: '',
            referral_id1: '',
            referral_id2: ''
        }
    }

    @action.bound
    getWebsiteReferralHistoryData(currentPage: number, filter: object): void {
        this.isLoading = true
        getWebsiteReferralHistoryList(currentPage, filter).then((response) => {
            if (response.data.success === 0) {
                this.isLoading = false
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.websiteReferralHistoryData = responseData.rows
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
    getWebsiteReferralData(filter: object): void {
        getWebsiteReferralByDomain(filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data.rows
            if (responseData.length > 0) {
                const element = responseData[0]
                this.editWebsiteReferralHistoryData = {
                    _id: '',
                    domain: element.domain,
                    total_referral: element.total_referral,
                    referral_name: element.referral_name,
                    referral_commission: element.referral_commission,
                    referral_name1: element.referral_name1,
                    referral_commission1: element.referral_commission1,
                    referral_name2: element.referral_name2,
                    referral_commission2: element.referral_commission2,
                    referral_type: element.referral_type,
                    referral_type1: element.referral_type1,
                    referral_type2: element.referral_type2,
                    target_date: element.target_date,
                    created_date: element.created_date,
                    referral_id: element.referral_id,
                    referral_id1: element.referral_id1,
                    referral_id2: element.referral_id2
                }
                this.isReferralDataFound = true
            } else {
                const domain = this.editWebsiteReferralHistoryData.domain
                this.clearWebsiteData()
                this.editWebsiteReferralHistoryData.domain = domain
                this.isReferralDataFound = false
            }
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
    getWebsiteReferralById(id: string): void {
        getWebsiteReferralDataById(id).then((response) => {
            this.isLoading = false
            if (response.data.rows === null) {
                alert('Data not found')
                this.isApiError = true
                this.redirect = 'website_referral_history'
                return
            }
            const responseData = response.data
            this.editWebsiteReferralHistoryData = responseData.rows
            this.currentPage = responseData.currentPage
            this.totalPage = responseData.totalPages
            this.limit = responseData.limit
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            this.isReferralDataFound = true
            return
        })
    }

    @action.bound
    setWebsiteReferralHistory(cb: (success: boolean) => void): void {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        const id = _.get(this.editWebsiteReferralHistoryData, '_id', false)
        if (id === false || id === '') {
            addWebsiteReferralHistory(this.editWebsiteReferralHistoryData).then((response) => {
                if (response.data.status === false) {
                    this.isLocked = false
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    this.isLoading = false
                    alert(this.apiErrorMessage)
                    cb(false)
                    return
                }
                this.isLoading = false
                alert('Data add successfully')
                cb(true)
                return
            })
        } else {
            if (this.editWebsiteReferralHistoryData.total_referral === 0 || this.editWebsiteReferralHistoryData.total_referral === undefined) {
                this.editWebsiteReferralHistoryData.total_referral = 1
            }
            this.isLoading = true
            editWebsiteReferralHistory(this.editWebsiteReferralHistoryData).then((response) => {
                if (response.data.status === false) {
                    this.isLoading = false
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    alert(this.apiErrorMessage)
                    cb(false)
                    return
                }
                this.isLoading = false
                alert('Data updated successfully')
                cb(true)
                return
            })
        }
        this.isWebsiteOptionDataRequested = false
    }
}

export default WebsiteReferralHistory
