import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getSubscriptionStatistics } from '../api/subscriptionStatistics'

interface filterOption {
    domain?: Array<string>
    start_date?: string
    end_date?: string
}

class SubscriptionStatisticsStore {
    public rootStore: RootStore
    @observable public isApiError: boolean
    @observable public apiErrorMessage: string
    @observable public isLoading: boolean
    @observable public subscriptionStatisticsData: Array<Array<Array<(string | number)>> | Array<(string | number)>>
    @observable public filter: filterOption

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = false
        this.subscriptionStatisticsData = []
        this.filter = {
            domain: [],
            start_date: '',
            end_date: ''
        }
    }

    @action.bound
    async getSubscriptionStatisticsList() {
        this.isLoading = true
        const response = await getSubscriptionStatistics(this.filter)
        if (response.data.success === 0) {
            this.isApiError = true
            let errorMessage = response.data.message
            if (response.data.message === '' || response.data.message === undefined) {
                errorMessage = 'Something went wrong!'
            }
            alert(errorMessage)
            this.isLoading = false
            return
        }
        const responseData = response.data.data
        const activeUserData = responseData
        if (this.filter.domain && this.filter.domain.length > 1) {
            this.subscriptionStatisticsData = []
            for (let index = 0; index < activeUserData.length; index++) {
                const activeList = [['x', 'Active', 'Active Cancelled', 'Rebill Failed']]
                for (const activeUser of activeUserData[index]) {
                    const activacUserCountList = [
                        activeUser.date,
                        activeUser.activeUsers,
                        activeUser.activeCancelledUsers,
                        activeUser.rebillFailedUsers
                    ]
                    activeList.push(activacUserCountList)
                }
                this.subscriptionStatisticsData.push(activeList)
            }
        } else {
            this.subscriptionStatisticsData = [['x', 'Active', 'Active Cancelled', 'Rebill Failed']]
            for (const userCount of activeUserData) {
                const activeUserList = [
                    userCount.date,
                    userCount.activeUsers,
                    userCount.activeCancelledUsers,
                    userCount.rebillFailedUsers
                ]
                this.subscriptionStatisticsData.push(activeUserList)
            }
        }
        this.isLoading = false
        return
    }
}

export default SubscriptionStatisticsStore

