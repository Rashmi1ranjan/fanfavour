import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getCCBillErrorCodeDescriptionOptions, addCCBillErrorCodeDescription, editCCBillErrorCodeDescription, getCCBillErrorCodeDescriptionList, getCCBillErrorCodeDescriptionById } from '../api/CCBillErrorCodeDescription'
import _ from 'lodash'

interface ccbillErrorCodeDetails {
    _id?: string
    ccbill_error_code?: string
    description?: string
    error_message?: string
}

interface Map<T> {
    [K: string]: T;
}

class CCBillErrorCodeDescriptionStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public ccbillErrorCodeDescription: Array<ccbillErrorCodeDetails>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public showViewModel: boolean
    @observable public editCCBillErrorCodeDescription: ccbillErrorCodeDetails
    @observable public allCCBillErrorCodeOptions: Array<ccbillErrorCodeDetails>
    @observable public isCCBillErrorCodeOptionDataLoaded: boolean
    @observable public isCCBillErrorCodeOptionDataRequested: boolean
    @observable public ccbillErrorLookup: Map<string>

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.ccbillErrorCodeDescription = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.showViewModel = false
        this.editCCBillErrorCodeDescription = {
            _id: '',
            ccbill_error_code: '',
            description: '',
            error_message: ''
        }
        this.isCCBillErrorCodeOptionDataLoaded = false
        this.allCCBillErrorCodeOptions = []
        this.isCCBillErrorCodeOptionDataRequested = false
        this.ccbillErrorLookup = {
            key: '',
            value: ''
        }
    }

    @action.bound
    getAllCCBillErrorCodeOptions() {
        if (this.isCCBillErrorCodeOptionDataRequested === true) {
            return
        }
        this.isCCBillErrorCodeOptionDataRequested = true
        getCCBillErrorCodeDescriptionOptions().then((response) => {
            const responseData = response.data.rows
            _.forEach(responseData, (item) => {
                const ccbillErrorCode = item.ccbill_error_code
                const description = item.description
                this.ccbillErrorLookup[ccbillErrorCode] = description
            })
            this.allCCBillErrorCodeOptions = responseData

            this.isCCBillErrorCodeOptionDataLoaded = true
        })
    }


    getCCBillErrorCodeDescription(code: string): string {
        const description = _.get(this.ccbillErrorLookup, code, code)
        return description
    }

    @action.bound
    clearCCBillErrorCodeData(): void {
        this.editCCBillErrorCodeDescription = {
            _id: '',
            ccbill_error_code: '',
            description: '',
            error_message: ''
        }
    }

    @action.bound
    setCCBillErrorCodeDescriptionDetailById(id: string): void {
        this.isLoading = true
        getCCBillErrorCodeDescriptionById(id).then((response) => {
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                this.isLoading = false
                return
            }
            const responseData = response.data.rows
            this.editCCBillErrorCodeDescription = responseData[0]
            this.isApiError = false
            this.apiErrorMessage = ''
            this.isLoading = false
            return
        }).catch((error) => {
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isLoading = false
            this.isApiError = true
            this.apiErrorMessage = error.message
        })
    }

    @action.bound
    setCCBillErrorCodeDescriptionDetails(currentPage: number): void {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        getCCBillErrorCodeDescriptionList(currentPage).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data

            this.ccbillErrorCodeDescription = responseData.rows
            this.currentPage = responseData.currentPage
            this.totalPage = responseData.totalPages
            this.limit = responseData.limit
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        }).catch((error) => {
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isLoading = false
            this.isApiError = true
            this.apiErrorMessage = error.message
        })
    }

    @action.bound
    setCCBillErrorCodeDescriptionData() {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        const id = _.get(this.editCCBillErrorCodeDescription, '_id', false)
        if (id === false || id === '') {
            addCCBillErrorCodeDescription(this.editCCBillErrorCodeDescription).then((response) => {
                this.isLoading = false
                if (response.data.status === false) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    alert(this.apiErrorMessage)
                    return
                }
                alert('Data added successfully')
                return
            })
        } else {
            editCCBillErrorCodeDescription(this.editCCBillErrorCodeDescription).then((response) => {
                this.isLoading = false
                if (response.data.status === false) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    alert(this.apiErrorMessage)
                    return
                }
                alert('Data updated successfully')
                return
            })
        }
        this.isCCBillErrorCodeOptionDataRequested = false
    }
}

export default CCBillErrorCodeDescriptionStore
