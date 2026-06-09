import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import {
    getApiConfigurations,
    addApiLimitConfiguration,
    getApiLimitConfigurationById,
    editApiLimitConfiguration
} from '../api/apiLimitConfiguration'
import { ApiLimitConfiguration } from '../types/types'

interface filterOption {
    api_end_point: string
}

class ApiLimitConfigurationStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isLoading: boolean
    @observable public apiConfigurationList: Array<ApiLimitConfiguration>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public filter: filterOption
    @observable public apiLimitConfiguration: ApiLimitConfiguration

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isLoading = false
        this.apiConfigurationList = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 20
        this.totalRows = 0
        this.filter = { api_end_point: '' }
        this.apiLimitConfiguration = {
            api_end_point: '',
            max_attempt: '',
            duration: ''
        }
    }

    @action.bound
    async getApiConfigurationList(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        const response = await getApiConfigurations(page_num, this.filter)
        this.isLoading = false
        if (response.data.success === 0) {
            this.apiErrorMessage = response.data.message
            return
        }
        const responseData = response.data.data
        this.apiConfigurationList = responseData.rows
        this.totalPage = responseData.totalPages
        this.totalRows = responseData.totalRows
        return
    }

    @action.bound
    async createApiLimitConfiguration() {
        this.isLoading = true
        const response = await addApiLimitConfiguration(this.apiLimitConfiguration)
        this.isLoading = false
        const message = response.data.message
        if (response.data.success === 0) {
            return { status: false, message: message }
        }
        return { status: true, message: response.data.message }
    }

    @action.bound
    async clearData() {
        this.apiLimitConfiguration = {
            api_end_point: '',
            max_attempt: '',
            duration: ''
        }
    }

    @action.bound
    async getApiConfigurationById(id: string) {
        this.isLoading = true
        const data = { configuration_id: id }
        const response = await getApiLimitConfigurationById(data)
        this.isLoading = false
        if (response.data.success === 0) {
            const message = response.data.message
            return { status: false, message: message }
        }
        const responseData = response.data.data
        this.apiLimitConfiguration = {
            api_end_point: responseData.api_configuration.api_end_point,
            max_attempt: responseData.api_configuration.max_attempt,
            duration: responseData.api_configuration.duration
        }
        return { status: true }
    }

    @action.bound
    async updateApiLimitConfiguration(id: string) {
        this.isLoading = true
        const data = {
            id: id,
            api_end_point: this.apiLimitConfiguration.api_end_point,
            max_attempt: this.apiLimitConfiguration.max_attempt,
            duration: this.apiLimitConfiguration.duration
        }
        const response = await editApiLimitConfiguration(data)
        this.isLoading = false
        const message = response.data.message
        if (response.data.success === 0) {
            return { status: false, message: message }
        }
        return { status: true, message: message }
    }
}

export default ApiLimitConfigurationStore
