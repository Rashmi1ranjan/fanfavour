import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getDeclineCodeDescriptionOptions, addDeclineCodeDescription, editDeclineCodeDescription, getDeclineCodeDescriptionList, getDeclineCodeDescriptionById } from '../api/DeclineCodeDescription'
import _ from 'lodash'
interface declineCodeDetails {
    _id?: string
    decline_code?: string
    description?: string
    error_message?: string
    link_to_change_card?: boolean
    link_text?: string
    payment_gateway?: string
}

interface Map<T> {
    [K: string]: T;
}

class DeclineCodeDescriptionStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public declineCodeDescription: Array<declineCodeDetails>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public showViewModel: boolean
    @observable public editDeclineCodeDescription: declineCodeDetails
    @observable public allDeclineCodeOptions: Array<declineCodeDetails>
    @observable public isDeclineCodeOptionDataLoaded: boolean
    @observable public isDeclineCodeOptionDataRequested: boolean
    @observable public declineCodeLookup: Map<string>
    @observable public isDataSending: boolean

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.declineCodeDescription = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.showViewModel = false
        this.editDeclineCodeDescription = {
            _id: '',
            decline_code: '',
            description: '',
            error_message: '',
            link_to_change_card: false,
            link_text: '',
            payment_gateway: 'ccbill'
        }
        this.allDeclineCodeOptions = []
        this.isDeclineCodeOptionDataLoaded = false
        this.isDeclineCodeOptionDataRequested = false
        this.declineCodeLookup = {}
        this.isDataSending = false
    }

    @action.bound
    getAllDeclineCodeOptions() {
        if (this.isDeclineCodeOptionDataRequested === true) {
            return
        }
        this.isDeclineCodeOptionDataRequested = true
        getDeclineCodeDescriptionOptions().then((response) => {
            const responseData = response.data.rows
            _.forEach(responseData, (item) => {
                const declineCode = item.decline_code
                const description = item.description
                this.declineCodeLookup[declineCode] = description
            })
            this.allDeclineCodeOptions = responseData
        })
    }

    getDeclineCodeDescription(code: string): string {
        const description = _.get(this.declineCodeLookup, code, code)
        return description
    }

    @action.bound
    clearDeclineCodeData(): void {
        this.editDeclineCodeDescription = {
            _id: '',
            decline_code: '',
            description: '',
            error_message: '',
            link_to_change_card: false,
            link_text: '',
            payment_gateway: 'ccbill'
        }
    }

    @action.bound
    setDeclineCodeDescriptionDetailById(id: string) {
        this.isLoading = true
        getDeclineCodeDescriptionById(id).then((response) => {
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                this.isLoading = false
                return
            }
            const responseData = response.data.rows
            this.editDeclineCodeDescription = responseData[0]
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
    setDeclineCodeDescriptionDetails(currentPage: number): void {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        getDeclineCodeDescriptionList(currentPage).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.declineCodeDescription = responseData.rows
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
    setDeclineCodeDescriptionData(callback: (status: boolean) => void) {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isDataSending = true
        const id = _.get(this.editDeclineCodeDescription, '_id', false)
        if (id === false || id === '') {
            addDeclineCodeDescription(this.editDeclineCodeDescription).then((response) => {
                this.isDataSending = false
                if (response.data.status === false) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    alert(this.apiErrorMessage)
                    return callback(false)
                }
                alert('Data added successfully')
                return callback(true)
            })
        } else {
            editDeclineCodeDescription(this.editDeclineCodeDescription).then((response) => {
                this.isDataSending = false
                if (response.data.status === false) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    alert(this.apiErrorMessage)
                    return callback(false)
                }
                alert('Data updated successfully')
                return callback(true)
            })
        }
        this.isDeclineCodeOptionDataRequested = false
    }
}

export default DeclineCodeDescriptionStore
