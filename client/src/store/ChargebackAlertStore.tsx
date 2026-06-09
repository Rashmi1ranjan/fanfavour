import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getChargebackAlerts, markChargebackAlertAsProcessed, markAllChargeBackAlertAsProcessed } from '../api/ChargebackAlert'
import { ChargebackAlert } from '../types/types'

interface filterOption {
    start_date: string
    end_date: string
    is_processed: string
    case_number: string
    card_number: string
}

class ChargebackAlertStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public chargebackAlertList: Array<ChargebackAlert>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public filter: filterOption
    @observable public showAllProcessedBtn: boolean

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.chargebackAlertList = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.filter = {
            start_date: '',
            end_date: '',
            is_processed: 'false',
            case_number: '',
            card_number: ''
        }
        this.showAllProcessedBtn = false
    }

    @action.bound
    async getChargebackAlertList(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        const response = await getChargebackAlerts(page_num, this.filter)
        this.showAllProcessedBtn = (this.filter.case_number !== '' && this.filter.is_processed === 'false' && response.data.data.totalRows > 0) ? true : false
        this.isLoading = false
        if (response.data.success === 0) {
            this.isApiError = true
            this.apiErrorMessage = response.data.message
            return
        }
        const responseData = response.data.data
        this.chargebackAlertList = responseData.rows
        this.limit = responseData.limit
        this.totalPage = responseData.totalPages
        this.totalRows = responseData.totalRows
        this.isApiError = false
        this.apiErrorMessage = ''
        return
    }

    @action.bound
    async markAllChargeBackAlertProcessed() {
        this.isLoading = true
        if (window.confirm('Are you sure to mark all alerts as processed?') === true) {
            if (this.filter.case_number !== '' && this.filter.is_processed === 'false') {
                const response = await markAllChargeBackAlertAsProcessed(this.filter)
                this.isLoading = false
                alert(response.data.message)
                this.getChargebackAlertList(this.currentPage)
                return
            }
        }
        this.isLoading = false
        return
    }

    @action.bound
        markProcessed = async (id: string) => {
            this.isLoading = true
            const data = { log_id: id }
            if (window.confirm('Are you sure to mark this log as processed?') === true) {
                const response = await markChargebackAlertAsProcessed(data)
                this.isLoading = false
                if (response.data.status === false) {
                    alert(this.apiErrorMessage)
                    return
                }
                alert(response.data.message)
                this.getChargebackAlertList(this.currentPage)
                return
            }
            this.isLoading = false
            return
        }
}

export default ChargebackAlertStore
