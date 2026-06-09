import { makeObservable, observable, action } from 'mobx'
import moment from 'moment'
import RootStore from './Root'
import { getEmailStatistics } from '../api/Email'

interface filterOption {
    domain: string
    start_date: string
    end_date: string
}

class EmailStatistics {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoadingEmailStatistics: boolean
    @observable public emailStatistics: Array<Array<(string | number)>>
    // @observable public filter: filterOption

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoadingEmailStatistics = false
        this.emailStatistics = []
        // this.filter = {
        //     domain: '',
        //     start_date: moment().subtract(6, 'days').format('MM/DD/YYYY'),
        //     end_date: moment().format('MM/DD/YYYY')
        // }
    }


    @action.bound
    setEmailStatistics() {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoadingEmailStatistics = true
        getEmailStatistics().then((response) => {
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                alert(response.data.message)
                this.isLoadingEmailStatistics = false
                return
            }
            const responseData = response.data
            const emailData = responseData.data
            if (emailData.length === 0) {
                this.emailStatistics = [['x']]
            } else {
                const eventTypes = Object.keys(emailData[0]).filter(key => key !== 'date')
                this.emailStatistics = [['x', ...eventTypes.map(e => e.charAt(0).toUpperCase() + e.slice(1))]]
                for (const entry of emailData) {
                    const row = [entry.date]
                    for (const type of eventTypes) {
                        row.push(entry[type])
                    }
                    this.emailStatistics.push(row)
                }
            }

            this.isLoadingEmailStatistics = false
            this.isApiError = false
        }).catch((error) => {
            console.log('error', error)
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isLoadingEmailStatistics = false
            this.isApiError = true
            this.apiErrorMessage = error.message
        })
    }
}

export default EmailStatistics
