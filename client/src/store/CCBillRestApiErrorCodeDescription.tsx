import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getCCBillRestApiErrorCodeDescriptionOptions, addCCBillRestApiErrorCodeDescription, editCCBillRestApiErrorCodeDescription, getCCBillRestApiErrorCodeDescriptionList, getCCBillRestApiErrorCodeDescriptionById } from '../api/CCBillRestApiErrorCodeDescription'
import _ from 'lodash'

interface ccbillRestApiErrorCodeDetails {
    _id?: string
    ccbill_error_code?: string
    description?: string
    error_message?: string
}

interface Map<T> {
    [K: string]: T;
}

class CCBillRestApiErrorCodeDescriptionStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public ccbillRestApiErrorCodeDescription: Array<ccbillRestApiErrorCodeDetails>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public showViewModel: boolean
    @observable public editCCBillRestApiErrorCodeDescription: ccbillRestApiErrorCodeDetails
    @observable public allCCBillErrorCodeOptions: Array<ccbillRestApiErrorCodeDetails>
    @observable public isCCBillErrorCodeOptionDataLoaded: boolean
    @observable public isCCBillErrorCodeOptionDataRequested: boolean
    @observable public ccbillErrorLookup: Map<string>

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.ccbillRestApiErrorCodeDescription = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.showViewModel = false
        this.editCCBillRestApiErrorCodeDescription = {
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
        getCCBillRestApiErrorCodeDescriptionOptions().then((response) => {
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


    getCCBillRestApiErrorCodeDescription(code: string): string {
        const description = _.get(this.ccbillErrorLookup, code, code)
        return description
    }

    @action.bound
    clearCCBillRestApiErrorCodeData(): void {
        this.editCCBillRestApiErrorCodeDescription = {
            _id: '',
            ccbill_error_code: '',
            description: '',
            error_message: ''
        }
    }

    @action.bound
    setCCBillRestApiErrorCodeDescriptionDetailById(id: string): void {
        this.isLoading = true
        getCCBillRestApiErrorCodeDescriptionById(id).then((response) => {
            console.log(response)
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                this.isLoading = false
                return
            }
            const responseData = response.data.rows
            this.editCCBillRestApiErrorCodeDescription = responseData
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
    setCCBillRestApiErrorCodeDescriptionDetails(currentPage: number): void {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        getCCBillRestApiErrorCodeDescriptionList(currentPage).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data

            this.ccbillRestApiErrorCodeDescription = responseData.rows
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
    addCCBillRestApiErrorCodeDescriptionData(data: object) {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        addCCBillRestApiErrorCodeDescription(data).then((response) => {
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
        this.isCCBillErrorCodeOptionDataRequested = false
    }

    @action.bound
    editCCBillRestApiErrorCodeDescriptionData() {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        editCCBillRestApiErrorCodeDescription(this.editCCBillRestApiErrorCodeDescription).then((response) => {
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
        this.isCCBillErrorCodeOptionDataRequested = false
    }
}

export default CCBillRestApiErrorCodeDescriptionStore
