import { observable, action, makeObservable } from 'mobx'
import FileSaver from 'file-saver'
import RootStore from './Root'
import { getForumPayTransactionHistory, updateTransactionStatus, exportForumPayTransactionHistory } from '../api/ForumPayTransactionHistory'
import { toast } from 'react-toastify'
import { downloadCsv } from '../api/analytics'
import { ForumPayTransactionHistory, ITransactionInfo } from '../types/types'
import { AxiosResponse } from 'axios'

interface filterOption {
    domain?: string
    start_date?: string
    end_date?: string
    pcp_transaction_id?: string
    transaction_type?: string
    transaction_status?: string
    transaction_id?: string
    user_id?: string,
    wallet_transaction_status?: Array<string>
    content_type?: Array<string>
}

class ForumPayTransactionHistoryStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public ForumPayTransactionHistoryData: Array<ForumPayTransactionHistory>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public filter: filterOption
    @observable public transactionDetails: ITransactionInfo
    @observable public isValidUserId: boolean
    @observable public isValidTransaction: boolean
    @observable public isPcpTransactionId: boolean
    @observable public csvUrl: string
    @observable public csvFile: string

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.isApiError = false
        this.isLoading = false
        this.ForumPayTransactionHistoryData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.isValidUserId = true
        this.isValidTransaction = true
        this.isPcpTransactionId = true
        this.apiErrorMessage = ''
        this.filter = {
            domain: '',
            start_date: '',
            end_date: '',
            pcp_transaction_id: '',
            transaction_type: 'all',
            transaction_status: 'all',
            transaction_id: '',
            user_id: '',
            wallet_transaction_status: [],
            content_type: []
        }

        this.transactionDetails = {
            transaction_id: '',
            notes: '',
            chargeback_date: ''
        }
        this.csvUrl = ''
        this.csvFile = ''
    }

    @action.bound
    getForumPayTransactionHistoryList(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        getForumPayTransactionHistory(page_num, this.filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data.data
            if (responseData.isValidUserId === false) {
                this.isLoading = false
                toast.error('please enter valid user id')
                return
            }
            if (responseData.isPcpTransactionId === false) {
                this.isLoading = false
                toast.error('please enter valid pcp transaction id')
                return
            }
            this.ForumPayTransactionHistoryData = responseData.rows
            this.limit = responseData.limit
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }

    @action.bound
    setTransactionDetails(data: ForumPayTransactionHistory) {
        this.resetTransactionDetails()
        this.transactionDetails.transaction_id = data._id
        return
    }

    @action.bound
    resetTransactionDetails() {
        this.transactionDetails = {
            transaction_id: '',
            notes: '',
            chargeback_date: ''
        }
    }

    @action.bound
    updateTransactionStatusByTransactionId(transaction_id: string) {
        this.isLoading = true
        updateTransactionStatus(transaction_id).then((response) => {
            this.isLoading = false
            this.apiErrorMessage = response.data.message
            this.getForumPayTransactionHistoryList(this.currentPage)
            toast.success(response.data.message)
            return
        })
    }

    @action.bound
    exportForumPayTransactionHistory() {
        this.isLoading = true
        exportForumPayTransactionHistory(this.filter).then((response: AxiosResponse) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data.data
            if (responseData.isValidUserId === false) {
                this.isLoading = false
                toast.error('Invalid user id')
                return
            }
            if (responseData.isValidPcpTransactionId === false) {
                this.isLoading = false
                toast.error('Invalid pcp transaction id')
                return
            }

            this.csvUrl = responseData.csvUrl
            this.isApiError = false
            this.apiErrorMessage = ''
            this.downloadCSVFromUrl()
            return
        })
    }

    downloadCSVFromUrl = (): void => {
        const postData = {
            file: this.csvUrl
        }
        downloadCsv(postData).then((response) => {
            if (response.status === 200) {
                this.csvFile = response.data

                const csvData = new Blob([this.csvFile], { type: 'text/csv' })
                FileSaver.saveAs(csvData, 'cryptoTransactionHistory.csv')
            } else {
                alert('Something went wrong')
            }
        })
    }
}

export default ForumPayTransactionHistoryStore
