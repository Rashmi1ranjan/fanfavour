import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getBlockCodeOptions, addBlockCode, editBlockCode, getBlockCodeList, getBlockCodeById } from '../api/BlockCode'
import _ from 'lodash'

interface blockCodeDetails {
    _id?: string
    code?: string
    message?: string
}

interface Map<T> {
    [K: string]: T;
}

class BlockCodeStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public BlockCode: Array<blockCodeDetails>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public showViewModel: boolean
    @observable public editBlockCode: blockCodeDetails
    @observable public allBlockCode: Array<blockCodeDetails>
    @observable public isBlockCodeDataLoaded: boolean
    @observable public isBlockCodeDataRequested: boolean
    @observable public blockCodeLookup: Map<string>

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = true
        this.BlockCode = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.showViewModel = false
        this.editBlockCode = {
            _id: '',
            code: '',
            message: ''
        }
        this.isBlockCodeDataLoaded = false
        this.allBlockCode = []
        this.isBlockCodeDataRequested = false
        this.blockCodeLookup = {
            key: '',
            value: ''
        }
    }

    @action.bound
    getAllCCBillErrorCodeOptions() {
        if (this.isBlockCodeDataRequested === true) {
            return
        }
        this.isBlockCodeDataRequested = true
        getBlockCodeOptions().then((response) => {
            const responseData = response.data.rows
            _.forEach(responseData, (item) => {
                const ccbillErrorCode = item.ccbill_error_code
                const description = item.description
                this.blockCodeLookup[ccbillErrorCode] = description
            })
            this.allBlockCode = responseData

            this.isBlockCodeDataLoaded = true
        })
    }


    getBlockCode(code: string): string {
        const description = _.get(this.blockCodeLookup, code, code)
        return description
    }

    @action.bound
    clearBlockCodeData(): void {
        this.editBlockCode = {
            _id: '',
            code: '',
            message: ''
        }
        this.isLoading = false
    }

    @action.bound
    setBlockCodeDetailById(id: string): void {
        this.isLoading = true
        getBlockCodeById(id).then((response) => {
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                this.isLoading = false
                return
            }
            const responseData = response.data.rows
            this.editBlockCode = responseData[0]
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
    setBlockCodeDetails(currentPage: number): void {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        getBlockCodeList(currentPage).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data

            this.BlockCode = responseData.rows
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
    setBlockCodeData(callback: (isError: boolean) => void) {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        const id = _.get(this.editBlockCode, '_id', false)
        if (id === false || id === '') {
            addBlockCode(this.editBlockCode).then((response) => {
                this.isLoading = false
                if (response.data.status === false) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return callback(this.isApiError)
                }
                return callback(this.isApiError)
            })
        } else {
            editBlockCode(this.editBlockCode).then((response) => {
                this.isLoading = false
                if (response.data.status === false) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return callback(this.isApiError)
                }
                return callback(this.isApiError)
            })
        }
        this.isBlockCodeDataRequested = false
    }
}

export default BlockCodeStore
