import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getStickyIoPaymentProfile, refreshPaymentProfiles } from '../api/StickyIoPaymentProfiles'

interface stickyIoPaymentProfile {
    gateway_type: string
    gateway_provider: string
    gateway_created: string
    gateway_active: string
    gateway_alias: string
    gateway_id: string
}

interface filterOption {
    gateway_alias: string
    gateway_active: string
}

class StickyIoPaymentProfiles {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public stickyIoPaymentProfileData: Array<stickyIoPaymentProfile>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public filter: filterOption

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.stickyIoPaymentProfileData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.filter = {
            gateway_active: 'all',
            gateway_alias: ''
        }
    }

    @action.bound
    getStickyIoPaymentProfileList(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        getStickyIoPaymentProfile(page_num, this.filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.stickyIoPaymentProfileData = responseData.rows
            this.limit = responseData.limit
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
    refreshStickyIoPaymentProfile() {
        this.isLoading = true
        refreshPaymentProfiles().then((response) => {
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            this.getStickyIoPaymentProfileList(this.currentPage)
            return
        })
    }
}

export default StickyIoPaymentProfiles
