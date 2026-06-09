import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getHelpTagList, addHelpTag, editHelpTag, getHelpTagDataById, getAllHelpTagList, deleteInfluencerHelpTagData, getSpecificWebsiteHelpTagList } from '../api/HelpTags'
import _ from 'lodash'
import { AxiosResponse } from 'axios'

interface helpTags {
    _id: string
    title: string
    type: string
}

class HelpTags {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public helpTagsData: Array<helpTags>
    @observable public allHelpTagsData: Array<helpTags>
    @observable public specificWebsiteHelpTagsData: Array<helpTags>
    @observable public editHelpTagsData: helpTags
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public redirect: string

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.helpTagsData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.redirect = ''
        this.allHelpTagsData = []
        this.editHelpTagsData = {
            _id: '',
            title: '',
            type: 'for_help'
        }
        this.specificWebsiteHelpTagsData = []
    }

    @action.bound
    clearData(): void {
        this.editHelpTagsData = {
            _id: '',
            title: '',
            type: 'for_help'
        }
    }

    @action.bound
    setHelpTag(cb: (success: boolean, message: string) => void): void {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        const id = _.get(this.editHelpTagsData, '_id', '')
        const title = this.editHelpTagsData.title

        if (id === '') {
            addHelpTag(this.editHelpTagsData).then((response) => {
                this.isLoading = false

                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    this.editHelpTagsData.title = title
                    this.editHelpTagsData._id = id
                    return cb(false, response.data.message)
                }
                return cb(true, 'Data add successfully')
            })
        } else {
            editHelpTag(this.editHelpTagsData).then((response) => {
                this.isLoading = false
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    this.editHelpTagsData.title = title
                    this.editHelpTagsData._id = id
                    return cb(false, response.data.message)
                }
                return cb(true, 'Data updated successfully')
            })
        }
    }

    @action.bound
    getHelpTagDataById(_id: string, cb: (success: boolean) => void): void {
        getHelpTagDataById(_id).then((response) => {
            this.isLoading = false

            const responseData = response.data.data
            if (responseData.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = responseData.message
                return cb(false)
            }

            if (responseData !== null) {
                this.editHelpTagsData = responseData
            }
            return cb(true)
        })
    }

    @action.bound
    getHelpTagsData(currentPage: number, filter: object): void {
        getHelpTagList(currentPage, filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data.data
            this.helpTagsData = responseData.rows
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
    getAllHelpTagsData(): void {
        getAllHelpTagList().then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data.data
            this.allHelpTagsData = responseData.rows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
    getSpecificWebsiteHelpTagsData(): void {
        getSpecificWebsiteHelpTagList().then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data.data
            this.specificWebsiteHelpTagsData = responseData.rows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
    deleteInfluencerHelpTag(_id: string, tagType: string, cb: (success: boolean, message: string) => void): void {
        deleteInfluencerHelpTagData(_id).then((response: AxiosResponse) => {
            const responseData = response.data

            if (responseData.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = responseData.message
                return cb(false, responseData.message)
            }

            this.getHelpTagsData(this.currentPage, {tagType: tagType})
            this.isApiError = false
            this.apiErrorMessage = ''
            return cb(true, responseData.message)
        })
    }
}
export default HelpTags
