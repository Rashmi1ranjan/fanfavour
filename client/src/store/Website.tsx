import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getWebsiteCommission, addWebsite, editWebsite, getWebsiteOptions, getWebsiteList, getWebsiteDataById, getWebsiteLists, getWebsiteCommissionList, getReferralDomainOptions, addWebsiteTags } from '../api/Website'
import _ from 'lodash'
import { WebsiteCommissionDetail, WebsitePreviousData } from '../types/types'

interface website {
    _id: string
    website_url: string
    tip_sub_account: string
    subscription_sub_account: string
    shop_sub_account: string
    status: string
    is_cloudfront: boolean
    google_analytics: string
    server_id: string
    database_id: string
    created_at: Date
    model_name: string
    model_email: string
    vendor_name: string
    payment_gateway: string
    sticky_io_campaign_id: string
    tag: Array<string>
    website_id: number
    recaptcha_website_id: string
    rating: number
    setup_date: string
    lunch_date: string
    bring_down_date: string
    is_crypto_payment_enabled: boolean
}

interface websiteOption {
    _id: string
    website_url: string
    is_referral: boolean
    subscription_sub_account: string
    shop_sub_account: string
    tip_sub_account: string
    payment_gateway: string
}

interface websiteCommission {
    _id: string
    domain: string
    platform_commission: number
    ccbill_fees: number
    target_date: Date
    created_at: Date
}

interface websiteReferral {
    _id: string
    website_url: string
    referral_name: string
    referral_commission: string
    vendor_name: string
}

interface websiteFilters {
    status: Array<string>
    domain: string
    server: string
    database: string
    tag: Array<string>
    campaignId: string
    subAccountNo: string
    payment_gateway: string
    is_crypto_enabled: string
}

class Website {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public websiteData: Array<website>
    @observable public editWebsiteData: website
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public redirect: string
    @observable public serverData: Array<''>
    @observable public websiteCommissionData: Array<websiteCommission>
    @observable public allWebsitesOptions: Array<websiteOption>
    @observable public websiteReferralData: Array<websiteReferral>
    @observable public isWebsiteOptionDataLoaded: boolean
    @observable public isWebsiteOptionDataRequested: boolean
    @observable public websiteCommission: websiteCommission
    @observable public websiteCommissionDetail: WebsiteCommissionDetail
    @observable public referralWebsiteOption: Array<websiteOption>
    @observable public websiteFilters: websiteFilters
    @observable public previousData: WebsitePreviousData
    @observable public isDataLoading: boolean
    @observable public isTagLoading: boolean

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.isDataLoading = false
        this.isTagLoading = false
        this.websiteData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.redirect = ''
        this.serverData = []
        this.editWebsiteData = {
            _id: '',
            website_url: '',
            tip_sub_account: '',
            subscription_sub_account: '',
            model_name: '',
            shop_sub_account: '',
            status: 'pending',
            is_cloudfront: false,
            google_analytics: '',
            server_id: '',
            created_at: new Date(),
            model_email: '',
            vendor_name: '',
            database_id: '',
            payment_gateway: 'ccbill',
            sticky_io_campaign_id: '',
            tag: [],
            website_id: 0,
            recaptcha_website_id: '',
            rating: 0,
            setup_date: '',
            lunch_date: '',
            bring_down_date: '',
            is_crypto_payment_enabled: false
        }
        this.websiteCommissionData = []
        this.allWebsitesOptions = []
        this.websiteReferralData = []
        this.isWebsiteOptionDataLoaded = false
        this.isWebsiteOptionDataRequested = false
        this.websiteCommission = {
            _id: '',
            domain: '',
            platform_commission: 0,
            ccbill_fees: 0,
            target_date: new Date(),
            created_at: new Date()
        }
        this.websiteCommissionDetail = {}
        this.referralWebsiteOption = []
        this.websiteFilters = {
            domain: '',
            server: '',
            database: '',
            status: [],
            payment_gateway: '',
            tag: [],
            campaignId: '',
            subAccountNo: '',
            is_crypto_enabled: ''
        }
        this.previousData = {
            domain: '',
            subscription_sub_account: '',
            shop_sub_account: '',
            tip_sub_account: '',
            sticky_io_campaign_id: ''
        }
    }

    @action.bound
    getWebsiteCommissionData(filter: object) {
        getWebsiteCommission(filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.websiteCommission = responseData.row
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
    getAllWebsiteOptions() {
        if (this.isWebsiteOptionDataRequested === true) {
            return
        }
        this.isWebsiteOptionDataRequested = true
        getWebsiteOptions().then((response) => {
            const responseData = response.data
            this.allWebsitesOptions = responseData.rows
            this.isWebsiteOptionDataLoaded = true
        }).catch(() => {
            this.isApiError = true
            this.apiErrorMessage = 'Get Error while Fetch Website List'
        })
    }

    @action.bound
    clearWebsiteData(): void {
        this.editWebsiteData = {
            _id: '',
            website_url: '',
            tip_sub_account: '',
            subscription_sub_account: '',
            shop_sub_account: '',
            model_name: '',
            status: 'pending',
            is_cloudfront: false,
            google_analytics: '',
            server_id: '',
            created_at: new Date(),
            model_email: '',
            vendor_name: '',
            database_id: '',
            payment_gateway: 'ccbill',
            sticky_io_campaign_id: '',
            tag: [],
            website_id: 0,
            recaptcha_website_id: '',
            rating: 0,
            setup_date: '',
            lunch_date: '',
            bring_down_date: '',
            is_crypto_payment_enabled: false
        }
    }

    @action.bound
    clearWebsiteFilter(): void {
        this.websiteFilters = {
            domain: '',
            server: '',
            database: '',
            status: [],
            payment_gateway: '',
            tag: [],
            campaignId: '',
            subAccountNo: '',
            is_crypto_enabled: ''
        }
    }

    @action.bound
    setWebsite(cb: (success: boolean) => void): void {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        const id = _.get(this.editWebsiteData, '_id', false)

        if (id === false || id === '') {
            addWebsite(this.editWebsiteData).then((response) => {
                this.isLoading = false
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    alert(this.apiErrorMessage)
                    cb(false)
                    return
                }
                // this.getWebsiteData(this.currentPage)
                alert(response.data.message)
                this.redirect = '/websites'
                cb(true)
                return
            })
        } else {
            editWebsite(this.editWebsiteData, this.previousData).then((response) => {
                this.isLoading = false
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    alert(this.apiErrorMessage)
                    cb(false)
                    return
                }
                // this.getWebsiteData(this.currentPage)
                alert(response.data.message)
                this.redirect = '/websites'
                cb(true)
                return
            })
        }
        this.isWebsiteOptionDataRequested = false
    }

    @action.bound
    getWebsiteDataById(_id: string): void {
        this.isDataLoading = true
        getWebsiteDataById(_id).then((response) => {
            this.isLoading = false
            const responseData = response.data
            if (responseData.success === 0) {
                this.isDataLoading = false
                this.isApiError = true
                this.apiErrorMessage = responseData.message
                alert(responseData.message)
                return
            }

            if (responseData.data !== null) {
                this.editWebsiteData = responseData.data
                this.previousData = {
                    domain: responseData.data.website_url,
                    subscription_sub_account: responseData.data.subscription_sub_account,
                    shop_sub_account: responseData.data.shop_sub_account,
                    tip_sub_account: responseData.data.tip_sub_account,
                    sticky_io_campaign_id: responseData.data.sticky_io_campaign_id
                }
                this.isDataLoading = false
            }
            this.isDataLoading = false
            return
        })
    }

    @action.bound
    getWebsiteData(currentPage: number, filter: object): void {
        this.isLoading = true
        getWebsiteList(currentPage, filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                alert(response.data.message)
                return
            }
            const responseData = response.data.data
            this.websiteData = responseData.rows
            this.currentPage = responseData.currentPage
            this.totalPage = responseData.totalPages
            this.limit = responseData.limit
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
    getWebsitesData(): void {
        getWebsiteLists().then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                alert(response.data.message)
                return
            }
            const responseData = response.data.data
            this.websiteData = responseData.rows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
        getWebsiteCommissionDate = (currentPage: number, filter: object) => {
            getWebsiteCommissionList(currentPage, filter).then((response) => {
                this.isLoading = false
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                const responseData = response.data
                this.websiteCommissionData = responseData.rows
                this.currentPage = responseData.currentPage
                this.totalPage = responseData.totalPages
                this.limit = responseData.limit
                this.totalRows = responseData.totalRows
                this.isApiError = false
                this.apiErrorMessage = ''
                return
            })
        }

    @action.bound
    setWebsiteCommissionDetail(data: WebsiteCommissionDetail) {
        this.websiteCommissionDetail = data
        return
    }

    @action.bound
    setWebsiteTags(data: { _id: string, tag: Array<string> }, currentPage: number, filter: object, cb: (success: boolean) => void) {
        this.isTagLoading = true
        addWebsiteTags(data).then((response) => {
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                alert(response.data.message)
                this.isTagLoading = false
                cb(false)
                return
            }
            this.getWebsiteData(currentPage, filter)
            alert(response.data.message)
            this.isTagLoading = false
            cb(true)
            return
        })
    }

    @action.bound
    getReferralWebsiteOptions(referralName: string) {
        getReferralDomainOptions({ referral_name: referralName }).then((response) => {
            const responseData = response.data
            this.referralWebsiteOption = responseData.data
            this.isWebsiteOptionDataLoaded = true
        })
    }
}
export default Website
