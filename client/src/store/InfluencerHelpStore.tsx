import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getInfluencerHelpData, getInfluencerDataById, saveInfluencerHelpData, getPresignedUrl, uploadFileUsingPresignedUrl, updateHelpStatus, deleteInfluencerHelpData, saveUserInfluencerHelpData, getInfluencerReadCountData } from '../api/InfluencerHelp'
import { EditorState, convertToRaw, convertFromHTML, ContentState } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import _ from 'lodash'
import moment from 'moment'
import { AxiosResponse } from 'axios'
const htmlContent = EditorState.createEmpty()
interface influencerHelp {
    _id: string
    title: string
    popup_intro: string
    htmlContent: typeof htmlContent
    popupIntroContent: typeof htmlContent
    html: string
    video_title: string
    video_url: string
    pdf_title: string
    pdf_url: string
    tags: Array<string>
    display_as_popup: boolean
    display_as_notification: boolean
    publish_date: string
    is_active: boolean
    exclude_from_help: boolean
    visible_to_tags: Array<string>
    is_visible_to_all_websites: boolean
    notification_expiration_date: string
    popup_expiration_date: string,
    for_admin: boolean,
    read_count: number,
    is_display_read_count: boolean
}

interface Filter {
    key: string;
    helpTag: string;
    websiteTag: string;
    for_admin: string;
}

class InfluencerHelp {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public influencerHelpData: Array<influencerHelp>
    @observable public updateInfluencerHelpData: influencerHelp
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public presignedVideoUrl: string
    @observable public isPresignedUrlForVideo: boolean
    @observable public presignedVideoFileName: string
    @observable public isPresignedUrlForPdf: boolean
    @observable public presignedPdfUrl: string
    @observable public presignedPdfFileName: string
    @observable public isApiCall: boolean
    @observable public isVideoUploadStart: boolean
    @observable public isPdfUploadStart: boolean
    @observable public filter: Filter

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = true
        this.influencerHelpData = []
        this.updateInfluencerHelpData = {
            _id: '',
            title: '',
            popup_intro: '',
            popupIntroContent: EditorState.createEmpty(),
            htmlContent: EditorState.createEmpty(),
            video_title: '',
            video_url: '',
            pdf_title: '',
            pdf_url: '',
            tags: [],
            html: '',
            display_as_popup: false,
            display_as_notification: false,
            publish_date: moment().format('YYYY-MM-DDTHH:mm:00.000'),
            is_active: true,
            exclude_from_help: false,
            visible_to_tags: [],
            is_visible_to_all_websites: true,
            notification_expiration_date: moment().add(7, 'days').format('YYYY-MM-DDTHH:mm:00.000'),
            popup_expiration_date: moment().add(7, 'days').format('YYYY-MM-DDTHH:mm:00.000'),
            for_admin: true,
            read_count: 0,
            is_display_read_count: false
        }
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.presignedVideoUrl = ''
        this.isPresignedUrlForVideo = false
        this.presignedVideoFileName = ''
        this.isPresignedUrlForPdf = false
        this.presignedPdfUrl = ''
        this.presignedPdfFileName = ''
        this.isApiCall = false
        this.isVideoUploadStart = false
        this.isPdfUploadStart = false
        this.filter = {
            key: '',
            helpTag: '',
            websiteTag: '',
            for_admin: ''
        }
    }

    @action.bound
    updateLoader(status: boolean): void {
        this.isLoading = status
    }

    @action.bound
    clearData(): void {
        this.isPdfUploadStart = false
        this.isVideoUploadStart = false
        this.isPresignedUrlForVideo = false
        this.isPresignedUrlForPdf = false
    }

    @action.bound
    clearInfluencerData(): void {
        this.updateInfluencerHelpData = {
            _id: '',
            title: '',
            popup_intro: '',
            html: '',
            video_title: '',
            video_url: '',
            pdf_title: '',
            pdf_url: '',
            tags: [],
            display_as_popup: false,
            display_as_notification: false,
            htmlContent: EditorState.createEmpty(),
            popupIntroContent: EditorState.createEmpty(),
            publish_date: moment().format('YYYY-MM-DDTHH:mm:00.000'),
            is_active: true,
            exclude_from_help: false,
            visible_to_tags: [],
            is_visible_to_all_websites: true,
            notification_expiration_date: moment().add(7, 'days').format('YYYY-MM-DDTHH:mm:00.000'),
            popup_expiration_date: moment().add(7, 'days').format('YYYY-MM-DDTHH:mm:00.000'),
            for_admin: true,
            read_count: 0,
            is_display_read_count: false
        }
    }

    @action.bound
    generatePresignedUrl(fileName: string, type: string, cb: (success: boolean) => void): void {
        getPresignedUrl(fileName, type).then((response) => {
            const responseData = response.data
            if (responseData.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                alert(response.data.message)
                return cb(false)
            }
            if (type === 'video') {
                this.presignedVideoUrl = responseData.data.presigned_url
                this.presignedVideoFileName = responseData.data.file_name
                this.updateInfluencerHelpData.video_url = responseData.data.file_name
                this.isPresignedUrlForVideo = true
            } else if (type === 'pdf') {
                this.presignedPdfUrl = responseData.data.presigned_url
                this.presignedPdfFileName = responseData.data.file_name
                this.isPresignedUrlForPdf = true
                this.updateInfluencerHelpData.pdf_url = responseData.data.file_name
            }

            return cb(true)
        })
    }

    @action.bound
    getInfluencerHelpDataList(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        getInfluencerHelpData(page_num, this.filter).then((response) => {
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                this.isLoading = false
                alert(response.data.message)
                return
            }
            const responseData = response.data.data
            this.influencerHelpData = responseData.rows
            this.limit = responseData.limit
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.isLoading = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
    getInfluencerHelpDataById(_id: string, cb: (success: boolean, tags: Array<string>, visibleToTag: Array<string>) => void): void {
        getInfluencerDataById(_id).then((response) => {
            const responseData = response.data
            if (responseData.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = responseData.message
            }

            if (responseData.data !== null) {
                this.updateInfluencerHelpData = responseData.data
                let blocksFromHTML = convertFromHTML(responseData.data.html)
                let state = ContentState.createFromBlockArray(
                    blocksFromHTML.contentBlocks,
                    blocksFromHTML.entityMap
                )
                this.updateInfluencerHelpData.htmlContent = EditorState.createWithContent(state)
                blocksFromHTML = convertFromHTML(responseData.data.popup_intro)
                state = ContentState.createFromBlockArray(
                    blocksFromHTML.contentBlocks,
                    blocksFromHTML.entityMap
                )
                this.updateInfluencerHelpData.popupIntroContent = EditorState.createWithContent(state)
                if (responseData.data.notification_expiration_date === undefined) {
                    this.updateInfluencerHelpData.notification_expiration_date = moment().add(7, 'days').format('YYYY-MM-DDTHH:mm:00.000')
                }
                if (responseData.data.popup_expiration_date === undefined) {
                    this.updateInfluencerHelpData.popup_expiration_date = moment().add(7, 'days').format('YYYY-MM-DDTHH:mm:00.000')
                }
                return cb(true, responseData.data.tags, responseData.data.visible_to_tags)
            }
            return cb(false, [], [])
        })
    }

    @action.bound
    async setInfluencerHelpData(videoFile: any, pdfFile: any, videoConfig: any, pdfConfig: any, cb: (success: boolean, message: string) => void): Promise<any> {
        this.isApiCall = true
        this.isApiError = false
        this.apiErrorMessage = ''

        // html content convert
        let contentState = this.updateInfluencerHelpData.htmlContent.getCurrentContent()
        let rawContent = draftToHtml(convertToRaw(contentState))
        this.updateInfluencerHelpData.html = rawContent

        // popup intro content convert
        contentState = this.updateInfluencerHelpData.popupIntroContent.getCurrentContent()
        rawContent = draftToHtml(convertToRaw(contentState))
        this.updateInfluencerHelpData.popup_intro = rawContent

        if (this.isPresignedUrlForVideo) {
            this.isVideoUploadStart = true

            const response = await uploadFileUsingPresignedUrl(this.presignedVideoUrl, videoFile, 'video/mp4', videoConfig)
            if (response.status !== 200) {
                this.isApiCall = false
                return cb(false, 'Error in video upload')
            }

        } else {
            this.updateInfluencerHelpData.video_url = ''
        }
        if (this.isPresignedUrlForPdf) {
            this.isPdfUploadStart = true
            const response = await uploadFileUsingPresignedUrl(this.presignedPdfUrl, pdfFile, 'application/pdf', pdfConfig)
            if (response.status !== 200) {
                this.isApiCall = false
                return cb(false, 'Error in pdf upload')
            }
        } else {
            this.updateInfluencerHelpData.pdf_url = ''
        }
        let response
        if (this.updateInfluencerHelpData.for_admin === true) {
            response = await saveInfluencerHelpData(this.updateInfluencerHelpData)
        } else {
            response = await saveUserInfluencerHelpData(this.updateInfluencerHelpData)
        }
        this.isLoading = false
        this.isApiCall = false
        if (response.data.status === false) {
            this.isApiError = true
            this.apiErrorMessage = response.data.message
            return cb(false, this.apiErrorMessage)
        }

        const message = 'Help data updated successfully'
        return cb(true, message)
    }

    @action.bound
    updateStatus(_id: string, cb: (success: boolean, message: string) => void): void {
        this.isApiCall = true
        this.isApiError = false
        this.apiErrorMessage = ''

        updateHelpStatus(_id).then((response: AxiosResponse) => {
            const responseData = response.data

            if (responseData.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = responseData.message
                return cb(true, responseData.message)
            }

            const findData = _.findIndex(this.influencerHelpData, function (n: any) {
                return (n._id === _id) ? n : false
            })
            this.influencerHelpData[findData].is_active = !this.influencerHelpData[findData].is_active
            this.isApiError = false
            this.apiErrorMessage = ''
            this.isApiCall = false
            return cb(true, responseData.message)
        })
    }

    @action.bound
    deleteInfluencerHelp(_id: string): void {
        this.isApiCall = true
        this.isApiError = false
        this.apiErrorMessage = ''

        deleteInfluencerHelpData(_id).then((response: AxiosResponse) => {
            const responseData = response.data

            if (responseData.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = responseData.message
                return
            }

            _.remove(this.influencerHelpData, function (n: influencerHelp) {
                return n._id === _id
            })

            this.isApiError = false
            this.apiErrorMessage = ''
            this.isApiCall = false

            const rows = this.totalRows - 1
            const limit = this.limit
            this.totalPage = Math.ceil(rows / limit)
            this.totalRows = rows

            alert(responseData.message)
            return
        })
    }

    @action.bound
    getInfluencerReadCount(_id: string): void {
        this.isApiCall = true
        this.isApiError = false
        this.apiErrorMessage = ''
        getInfluencerReadCountData(_id).then((response: AxiosResponse) => {
            if (response.data.success === 0) {
                this.isApiError = true
                const errorMessage = _.get(response, 'data.message', 'something went wrong!')
                alert(errorMessage)
                this.apiErrorMessage = response.data.message
                return
            }
            const findIndex = _.findIndex(this.influencerHelpData, function (index: any) {
                return (index._id === _id) ? index : false
            })
            this.influencerHelpData[findIndex].read_count = response.data.data
            this.influencerHelpData[findIndex].is_display_read_count = true
            this.isApiError = false
            this.apiErrorMessage = ''
            this.isApiCall = false
        })
    }

    changeFormatOfDate(date: string | Date) {
        if (date !== undefined && date !== null) {
            return new Date(date.toString().replace('.000Z', ''))
        }
    }
}

export default InfluencerHelp
