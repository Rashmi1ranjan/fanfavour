import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getCCBillRestApiReportingListByDomain } from '../api/CCBillRestApiAddCardLog'

interface ErrorLog {
    domain: string
    total: string
    success: string
    error: string
}

interface filterOption {
    domain: string,
    start_date: string,
    end_date: string,
    is_unique: boolean
    payment_gateway: string
}

class CCBillRestApiReportingByDomainStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public logList: Array<ErrorLog>
    @observable public filter: filterOption

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.logList = []
        this.filter = {
            domain: '',
            start_date: '',
            end_date: '',
            is_unique: true,
            payment_gateway: ''
        }
    }

    @action.bound
    getCCBillRestApiReportingByDomain(filter: filterOption): void {
        this.isLoading = true
        getCCBillRestApiReportingListByDomain(filter).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.logList = responseData.rows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }
}

export default CCBillRestApiReportingByDomainStore
