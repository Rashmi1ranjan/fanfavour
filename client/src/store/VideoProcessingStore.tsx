import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getVideoProcessingErrors, getVideoProcessingHealth, getVideoProcessingQueue } from '../api/videoProcessing'

interface LoadingHandler {
    queue: boolean,
    errors: boolean,
    health: boolean
}

interface VideoProcessingStoreData {
    queue: VideoProcessingQueue[],
    errors: VideoProcessingError[],
    health: []
}

interface VideoProcessingStoreError {
    queue: string,
    errors: string,
    health: string
}

interface VideoProcessingQueue {
    website_url: string
    createdAt: string
    is_mass_message: boolean
    udid: string
    video_id: string
}

interface VideoProcessingError {
    object_id: string;
    file_name: string;
    video_from: string;
    error: string;
    created_at: Date;
}

interface PaginationProperties {
    currentPage: number;
    totalPage: number;
    totalRows: number;
    limit: number;
}
interface PaginationHandler {
    errors: PaginationProperties
}

class VideoProcessingStore {
    public rootStore: RootStore
    @observable public loading: LoadingHandler
    @observable public data: VideoProcessingStoreData
    @observable public error: VideoProcessingStoreError
    @observable public pagination: PaginationHandler

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.loading = { queue: true, errors: true, health: true }
        this.data = { queue: [], errors: [], health: [] }
        this.error = { queue: '', errors: '', health: '' }
        this.pagination = {
            errors: {
                currentPage: 1,
                totalPage: 1,
                totalRows: 1,
                limit: 20
            }
        }
    }

    @action.bound
    async getQueue() {
        this.loading.queue = true
        this.error.queue = ''
        getVideoProcessingQueue()
            .then(res => {
                const resData = res.data
                this.loading.queue = false
                if (resData.success === 0) {
                    this.error.queue = resData.message
                    return
                }
                this.data.queue = resData.data.videos
            })
            .catch(err => {
                this.loading.queue = false
                this.error.queue = err.message
            })
    }

    @action.bound
    async getErrors(page: number) {
        this.pagination.errors.currentPage = page
        this.loading.errors = true
        this.error.errors = ''
        getVideoProcessingErrors(page)
            .then(res => {
                const resData = res.data
                this.loading.errors = false
                if (resData.success === 0) {
                    this.error.errors = resData.message
                    return
                }
                this.pagination.errors = resData.data.pagination
                this.data.errors = resData.data.errors
            })
            .catch(err => {
                this.loading.errors = false
                this.error.errors = err.message
            })
    }

    @action.bound
    async getHealth() {
        this.loading.health = true
        this.error.health = ''
        getVideoProcessingHealth().then(res => {
            const resData = res.data
            this.loading.health = false
            if (resData.success === 0) {
                this.error.health = resData.message
                return
            }
            this.data.health = resData.data.health
        }).catch(err => {
            this.loading.health = false
            this.error.health = err.message
        })
    }
}

export default VideoProcessingStore
