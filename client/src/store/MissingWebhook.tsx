import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getMissingWebhookList, resolveMissingWebhook } from '../api/MissingWebhook'

interface website {
    website_url: string
}

interface missingWebhook {
    _id: string
    client_sub_account: string
    subscription_id: string
    website: website,
    first_name: string
    last_name: string
    email_address: string
    pcp_transaction_date: string
}

class MissingWebhook {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public missingWebhookData: Array<missingWebhook>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.missingWebhookData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
    }

    @action.bound
        getMissingWebhookData = (currentPage: number): void => {
            this.isApiError = false
            this.apiErrorMessage = ''
            this.isLoading = true
            getMissingWebhookList(currentPage).then((response) => {
                this.isLoading = false
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                const responseData = response.data
                this.missingWebhookData = responseData.rows
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
        resolveMissingWebhookData = (id: string): void => {
            this.isApiError = false
            this.apiErrorMessage = ''
            this.isLoading = true
            if (window.confirm('Resolve the Webhook?') === true) {
                resolveMissingWebhook(id).then((response) => {
                    this.isLoading = false
                    if (response.data.status === false) {
                        this.isApiError = true
                        this.apiErrorMessage = response.data.message
                        alert(this.apiErrorMessage)
                        return
                    }
                    alert('Webhook resolved')
                    this.getMissingWebhookData(this.currentPage)
                    this.isApiError = false
                    this.apiErrorMessage = ''
                    return
                })
            }
            this.isLoading = false
            return
        }
}

export default MissingWebhook
