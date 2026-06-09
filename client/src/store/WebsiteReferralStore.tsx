import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { addOrUpdateWebsiteReferral, getWebsiteReferralDataById, getWebsiteReferralList, getAllReferralOption, getAllLinkReferralOption } from '../api/WebsiteReferral'
import _ from 'lodash'

interface websiteReferral {
    _id: string
    name: string
}

class WebsiteReferral {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public websiteReferralData: Array<websiteReferral>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public redirect: string
    @observable public editWebsiteReferralData: websiteReferral
    @observable public allWebsiteReferralOptions: Array<websiteReferral>
    @observable public allLinkTrackingReferralOptions: Array<websiteReferral>


    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.websiteReferralData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.redirect = ''
        this.editWebsiteReferralData = {
            _id: '',
            name: ''
        }
        this.allWebsiteReferralOptions = [],
        this.allLinkTrackingReferralOptions = []
    }

    @action.bound
    clearWebsiteReferralData() {
        this.editWebsiteReferralData = {
            _id: '',
            name: ''
        }
    }

    @action.bound
    setWebsiteReferralData(cb: (success: boolean) => void): void {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        const id = _.get(this.editWebsiteReferralData, '_id', false)

        addOrUpdateWebsiteReferral(this.editWebsiteReferralData).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                alert(this.apiErrorMessage)
                return cb(false)
            }
            this.getWebsiteReferralData(this.currentPage)
            const message = (id === false || id === '') ? 'Data add successfully' : 'Data updated successfully'
            alert(message)
            return cb(true)
        })
    }

    @action.bound
        getWebsiteReferralDataById = (_id: string): void => {
            getWebsiteReferralDataById(_id).then((response) => {
                this.isLoading = false
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                const responseData = response.data.data
                this.editWebsiteReferralData = responseData[0]
                return
            })
        }

    @action.bound
        getWebsiteReferralData = (currentPage: number): void => {
            getWebsiteReferralList(currentPage).then((response) => {
                this.isLoading = false
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                const responseData = response.data.data
                this.websiteReferralData = responseData.rows
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
    getAllReferralWebsiteOptions() {
        getAllReferralOption().then((response) => {
            const responseData = response.data.data
            this.allWebsiteReferralOptions = responseData.rows
        })
    }

    @action.bound
    getAllLinkTrackingReferralOptions() {
        getAllLinkReferralOption().then((response) => {
            const responseData = response.data.data
            this.allLinkTrackingReferralOptions = responseData.rows
        })
    }
}

export default WebsiteReferral
