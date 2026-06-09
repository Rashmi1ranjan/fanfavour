import { observable, action, makeObservable } from 'mobx'
import { addModel, editModel, getModelDataById, getModelList, getFeaturedModelText, saveFeaturedModelText, removeModelById } from '../api/FanFavourModel'
import RootStore from './Root'
import _ from 'lodash'

interface model {
    _id: string
    website_url: string
    model_name: string
    likes: number
    display_order: number
    image: string,
    is_featured_model: boolean,
    previewUrl: string,
    featured_model_display_order: number
}

export interface ModelPreviousData {
    website_url: string
    model_name: string
    likes: number
    display_order: string,
    is_featured_model: boolean,
    featured_model_display_order: number
}

export interface ModelFilters {
    website_url: string
}

class ModelStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public editModelData: model
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public modelData: any = []
    @observable public isDataLoading = false
    @observable public redirect: string
    @observable public previousData: ModelPreviousData
    @observable public modelFilters: ModelFilters
    @observable public isTextLoading: boolean
    @observable public featuredModelText: string

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.isDataLoading = false
        this.modelData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.redirect = ''
        this.previousData = {
            website_url: '',
            model_name: '',
            likes: 0,
            display_order: '',
            is_featured_model: false,
            featured_model_display_order: 0
        }
        this.editModelData = {
            _id: '',
            website_url: '',
            model_name: '',
            likes: 0,
            display_order: 0,
            image: '',
            is_featured_model: false,
            previewUrl: '',
            featured_model_display_order: 0
        },
        this.modelFilters = {
            website_url: ''
        }
        this.isTextLoading = false
        this.featuredModelText = ''
    }

    @action.bound
    clearModelData(): void {
        this.editModelData = {
            _id: '',
            website_url: '',
            model_name: '',
            likes: 0,
            display_order: 0,
            image: '',
            is_featured_model: false,
            previewUrl: '',
            featured_model_display_order: 0
        }
    }

    @action.bound
    setModel(cb: (success: boolean) => void): void {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        const id = _.get(this.editModelData, '_id', false)

        if (id === false || id === '') {
            addModel(this.editModelData).then((response) => {
                this.isLoading = false
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    alert(this.apiErrorMessage)
                    cb(false)
                    return
                }
                // this.getModelData(this.currentPage)
                alert(response.data.message)
                this.redirect = '/model-list'
                cb(true)
                return
            })
        } else {
            editModel(this.editModelData, this.previousData).then((response) => {
                this.isLoading = false
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    alert(this.apiErrorMessage)
                    cb(false)
                    return
                }
                alert(response.data.message)
                this.redirect = '/websites'
                cb(true)
                return
            })
        }
    }

    @action.bound
    getModelDataById(_id: string): void {
        this.isDataLoading = true
        getModelDataById(_id).then((response) => {
            this.isLoading = false
            const responseData = response.data
            if (responseData.success === 0) {
                this.isDataLoading = false
                this.isApiError = true
                this.apiErrorMessage = responseData.message
                alert(responseData.message)
                return
            }
            if (responseData.data !== null) {
                this.editModelData = responseData.data
                this.previousData = {
                    website_url: responseData.data.website_url,
                    model_name: responseData.data.model_name,
                    likes: responseData.data.likes,
                    display_order: responseData.data.display_order,
                    is_featured_model: responseData.data.is_featured_model,
                    featured_model_display_order: responseData.data.featured_model_display_order
                }
                this.isDataLoading = false
            }
            this.isDataLoading = false
            return
        })
    }

    @action.bound
    clearModelFilter(): void {
        this.modelFilters = {
            website_url: ''
        }
    }

    @action.bound
    getModelData(currentPage: number, modelFilter: object): void {
        this.isLoading = true
        getModelList(currentPage, modelFilter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                alert(response.data.message)
                return
            }
            const responseData = response.data.data
            this.modelData = responseData.rows
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
    getFeaturedModelText(): void {
        this.isTextLoading = true
        getFeaturedModelText().then((response) => {
            this.isTextLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                alert(response.data.message)
            } else {
                this.featuredModelText = response.data.data.featured_model_text
            }
            this.isTextLoading = false
        })
    }

    @action.bound
    saveFeaturedModelText(data: object, cb: (success: boolean) => void): void {
        this.isTextLoading = true
        saveFeaturedModelText(data).then((response) => {
            this.isTextLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                cb(false)
            } else {
                this.featuredModelText = response.data.data.featured_model_text
                cb(true)
            }
            this.isTextLoading = false
        })
    }

    @action.bound
    removeModel(modelId: string): Promise<void> {
        this.isLoading = true
        return new Promise((resolve, reject) => {
            removeModelById(modelId).then((response) => {
                this.isLoading = false
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    alert(this.apiErrorMessage)
                    reject(new Error(this.apiErrorMessage))
                } else {
                    alert(response.data.message)
                    resolve()
                }
            }).catch((error) => {
                this.isLoading = false
                reject(error)
            })
        })
    }
}

export default ModelStore
