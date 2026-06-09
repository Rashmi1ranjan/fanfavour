import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getContactUsEmailList, markAllEmailProcessed, markEmailAsProcessed } from '../api/contactUs'
import { ContactUsEmail } from '../types/types'

interface filterOption {
    start_date: string
    end_date: string
    domain: string
    email: string
    is_processed: string
}


class ContactUsStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public showAllProcessedBtn: boolean
    @observable public contactUsEmailList: Array<ContactUsEmail>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public filter: filterOption

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.showAllProcessedBtn = false
        this.contactUsEmailList = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.filter = {
            start_date: '',
            end_date: '',
            domain: '',
            email: '',
            is_processed: 'false'
        }
    }

    @action.bound
    async getContactUsEmailList(page_num: number) {
        this.currentPage = page_num
        this.isLoading = true
        const response = await getContactUsEmailList(page_num, this.filter)
        this.showAllProcessedBtn = (this.filter.is_processed === 'false' && (this.filter.email !== '' || this.filter.domain !== '' || (this.filter.start_date !== '' && this.filter.end_date !== '')) && response.data.data.totalRows > 0) ? true : false
        this.isLoading = false
        if (response.data.success === 0) {
            this.isApiError = true
            this.apiErrorMessage = response.data.message
            return
        }
        const responseData = response.data.data
        this.contactUsEmailList = responseData.rows
        this.limit = responseData.limit
        this.totalPage = responseData.totalPages
        this.totalRows = responseData.totalRows
        this.isApiError = false
        this.apiErrorMessage = ''
        return
    }

    @action.bound
    async markAllEmailProcessed(currentUser: string) {
        this.isLoading = true
        if (window.confirm('Are you sure to mark all mail as processed?') === true) {
            if ((this.filter.email !== '' || this.filter.domain !== '' || (this.filter.start_date !== '' && this.filter.end_date !== '')) && this.filter.is_processed === 'false') {
                const response = await markAllEmailProcessed(currentUser, this.currentPage, this.filter)
                this.isLoading = false
                alert(response.data.message)
                this.getContactUsEmailList(this.currentPage)
                return
            }
        }
        this.isLoading = false
        return
    }

    @action.bound
    async markProcessed(id: string, currentUser: string) {
        this.isLoading = true
        const data = { log_id: id, currentUser }
        if (window.confirm('Are you sure to mark this mail as processed?') === true) {
            const response = await markEmailAsProcessed(data)
            this.isLoading = false
            if (response.data.status === false) {
                alert(this.apiErrorMessage)
                return
            }
            alert(response.data.message)
            this.getContactUsEmailList(this.currentPage)
            return
        }
        this.isLoading = false
        return

    }

}

export default ContactUsStore
