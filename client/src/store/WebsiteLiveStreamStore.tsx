import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getWebsiteLiveStreamLog, getVideoStreamUrl } from '../api/websiteLiveStream'
import { StreamData } from '../types/types'

interface filterOption {
    domain: string
}

class WebsiteLiveStreamStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public filter: filterOption
    @observable public websiteLiveStream: Array<StreamData>
    @observable public liveStreamUrl: string
    @observable public liveStreamUrlMessage: string

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.filter = {
            domain: ''
        }
        this.liveStreamUrl = ''
        this.liveStreamUrlMessage = ''
        this.websiteLiveStream = []
    }

    clearData = (): void => {
        this.filter = {
            domain: ''
        }
        this.websiteLiveStream = []
    }

    @action.bound
    setWebsiteLiveStreamLog(page: number) {
        getWebsiteLiveStreamLog(page, this.filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.websiteLiveStream = responseData.records
            this.currentPage = responseData.currentPage
            this.totalPage = responseData.totalPages
            this.limit = responseData.limit
            this.totalRows = responseData.totalRecords
            this.isApiError = false
            this.apiErrorMessage = ''
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
    setVideoStreamUrl(stream_id: string) {
        this.liveStreamUrl = ''
        this.liveStreamUrlMessage = ''
        getVideoStreamUrl({stream_id}).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.liveStreamUrl = responseData.data.filename !== undefined ? responseData.data.filename : ''
            this.liveStreamUrlMessage = responseData.message
            this.isApiError = false
            this.apiErrorMessage = ''
            this.isApiError = false
            return
        }).catch((error) => {
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isLoading = false
            this.isApiError = true
            this.apiErrorMessage = error.message
            this.liveStreamUrl = ''
            this.liveStreamUrlMessage = ''
        })
    }
}

export default WebsiteLiveStreamStore
