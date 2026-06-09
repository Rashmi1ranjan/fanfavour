import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import {getSuspiciousUserList} from '../api/SuspiciousUser'
import { SuspiciousUserNotes } from '../types/types'

interface ErrorLog {
    _id: string
    website_url:string
    user_id: string
    createdAt: Date
    updatedAt: Date
}

interface filterOption {
    domain: string
    user_id: string
}

class SuspiciousUserStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public userList: Array<ErrorLog>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public totalRows: number
    @observable public totalSuccess: number
    @observable public totalFail: number
    @observable public filter: filterOption
    @observable public limit: number
    @observable public isValid: boolean
    @observable public suspiciousUserNotes: SuspiciousUserNotes

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.userList = []
        this.currentPage = 1
        this.totalPage = 0
        this.totalRows = 0
        this.totalSuccess = 0
        this.totalFail = 0
        this.limit = 0
        this.isValid = true

        this.filter = {
            domain: '',
            user_id: ''
        }
        this.suspiciousUserNotes = {}
    }
    @action.bound
    getSuspiciousUser(currentPage:number, cb: (success: boolean, message:string)=>void): void {
        this.isLoading = true
        getSuspiciousUserList(currentPage, this.filter).then((response)=>{
            if (response.data.success == 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                cb(false, '')
                return
            }

            const responseData = response.data
            if (responseData.isValid === false) {
                this.isLoading = false
                return cb(false, 'Please enter valid user id')
            }
            this.userList = responseData.totalRecord
            this.currentPage = responseData.currentPage
            this.totalPage = responseData.totalPages
            this.totalRows = responseData.totalRows
            this.totalSuccess = responseData.totalSuccess
            this.totalFail = responseData.totalFailed
            this.isApiError = false
            this.limit = responseData.limit
            this.apiErrorMessage = ''
            this.isLoading = false
            cb(true, '')
            return

        })
    }

    @action.bound
    setSuspiciousUserNotes(data: SuspiciousUserNotes) {
        this.suspiciousUserNotes = data
        return
    }
}


export default SuspiciousUserStore
