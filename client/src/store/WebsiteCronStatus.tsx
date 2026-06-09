import { observable, action, makeObservable } from 'mobx'
import moment from 'moment'
import _ from 'lodash'
import RootStore from './Root'
import { getWebsiteCronStatus } from '../api/WebsiteCronStatus'

interface filterOption {
    domain: Array<string>,
    start_date: string,
    end_date: string
}

class WebsiteCronStatusStore {
    public rootStore: RootStore
    @observable public isLoading: boolean
    @observable public isApiError: boolean
    @observable public filter: filterOption
    @observable public cronStatusCounts: Array<Array<(string | number)>>

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.isLoading = true
        this.isApiError = false
        this.cronStatusCounts = []
        this.filter = {
            domain: [],
            start_date: moment().subtract(7, 'days').format('MM/DD/YYYY'),
            end_date: moment().format('MM/DD/YYYY')
        }
    }

    @action.bound
    getWebsiteCronStatus(): void {
        this.isLoading = true
        getWebsiteCronStatus(this.filter).then((response) => {
            if (response.data.success === 1) {
                this.cronStatusCounts = [['x', 'Success', 'Error']]
                const cronStatusCountsData = response.data.data
                for (const statusCounts of cronStatusCountsData) {
                    const date = moment(statusCounts.date).format('M/D')
                    const successCount = _.get(statusCounts, 'success', 0)
                    const errorCount = _.get(statusCounts, 'error', 0)
                    const chartData = [date, successCount, errorCount]
                    this.cronStatusCounts.push(chartData)
                }
            } else {
                this.isApiError = true
            }
            this.isLoading = false
        }).catch((error) => {
            console.log(error)
            this.isApiError = true
            this.isLoading = false
        })
    }
}

export default WebsiteCronStatusStore
