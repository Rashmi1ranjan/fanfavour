import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getBlockCodeOptions } from '../api/BlockCode'
import { addBlockUser, getBlockUserList, getBlockUserById, editBlockUser, getBlockedUsersList } from '../api/BlockUser'
import _ from 'lodash'
import { OptionType, SortConfig } from '../types/types'
import { AxiosError } from 'axios'
import { toast } from 'react-toastify'

interface blockUserDetails {
    _id?: string
    block_code_id?: string
    type?: number
    domain_id?: number
    field?: string
    source_domain: number
}

interface blockCodeDetails {
    _id?: string
    message?: string
}

interface filterOption {
    domain: Array<OptionType>
    email: string
    card: string
    type: string
    source_domain: Array<OptionType>
}

class BlockUserStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public BlockUser: Array<blockUserDetails>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public editBlockUser: blockUserDetails
    @observable public allBlockUsers: Array<blockUserDetails>
    @observable public isBlockUserDataLoaded: boolean
    @observable public domainData: Array<blockUserDetails>
    @observable public BlockCodeData: Array<blockCodeDetails>
    @observable public blockedUsers: Array<blockCodeDetails>
    @observable public isLoadingBlockedUsersList: boolean
    @observable public filter: filterOption
    @observable public sortConfig: SortConfig
    @observable public history: any

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = true
        this.BlockUser = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.editBlockUser = {
            _id: '',
            block_code_id: '',
            type: 0,
            domain_id: -1,
            field: '',
            source_domain: -1
        }
        this.isBlockUserDataLoaded = false
        this.allBlockUsers = []
        this.domainData = []
        this.BlockCodeData = []
        this.blockedUsers = []
        this.isLoadingBlockedUsersList = true
        this.filter = {
            domain: [],
            email: '',
            card: '',
            type: 'all',
            source_domain: []
        }
        this.sortConfig = { key: 'created_at', direction: 'desc' }
        this.history = null
    }

    @action.bound
    clearBlockUserData(): void {
        this.editBlockUser = {
            _id: '',
            block_code_id: '',
            type: 0,
            domain_id: -1,
            field: '',
            source_domain: -1
        }
    }

    @action.bound
    getAllBlockCodeOption() {
        getBlockCodeOptions().then((response) => {
            const responseData = response.data.rows
            this.BlockCodeData = responseData
            this.isLoading = false
        })
    }

    @action.bound
    getUsersListByBlockedUserId(id: string) {
        this.isLoadingBlockedUsersList = true
        getBlockedUsersList(id).then((response) => {
            const responseData = response.data.rows
            this.blockedUsers = responseData
            this.isLoadingBlockedUsersList = false
        })
    }

    @action.bound
    setBlockUserDetails(currentPage: number): void {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        getBlockUserList(currentPage, this.filter, this.sortConfig).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data

            this.BlockUser = responseData.rows
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
    setBlockCodeDetailById(id: string): void {
        this.isLoading = true
        getBlockUserById(id).then((response) => {
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                this.isLoading = false
                return
            }
            const responseData = response.data.rows
            this.editBlockUser = responseData[0]
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
    AddBlockUserData(navigate: any) {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        const id = _.get(this.editBlockUser, '_id', false)
        this.history = navigate
        if (id === false || id === '') {
            addBlockUser(this.editBlockUser).then(() => {
                this.isApiError = true
                toast.success('Data added successfully')
                setTimeout(() => {
                    this.history('/block-user-list')
                    this.isLoading = false
                }, 3000)
            }).catch((error: AxiosError) => {
                const errorMessage = _.get(error, 'response.data.message', 'Error while add block data')
                this.isApiError = true
                toast.error(errorMessage)
                this.isLoading = false
            })
        } else {
            editBlockUser(this.editBlockUser).then((response) => {
                this.isApiError = true
                setTimeout(() => {
                    this.history('/block-user-list')
                    this.isLoading = false
                }, 3000)
            }).catch((error: AxiosError) => {
                const errorMessage = _.get(error, 'response.data.message', 'Error while add block data')
                this.isApiError = true
                toast.error(errorMessage)
                this.isLoading = false
            })
        }
    }

    @action.bound
        resetFilters = () => {
            this.filter = {
                domain: [],
                email: '',
                card: '',
                type: 'all',
                source_domain: []
            }
        }
}

export default BlockUserStore
