import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getWebsiteEarnings, getWebsiteEarningReport, getWebsiteLastTransactionReportDate } from '../api/EarningDashboard'
import moment from 'moment'
import { Earning } from '../types/types'

interface filterOption {
    domain: string
    start_date: string
    end_date: string
    payment_gateway: string
}

class EarningDashboardStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public isLoadingChart: boolean
    @observable public filter: filterOption
    @observable public earningData: Array<Array<(string | number)>>
    @observable public transactionCountData: Array<Array<(string | number)>>
    @observable public earningRows: Array<Earning>
    @observable public earningReportDate: string

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = true
        this.isLoadingChart = false
        this.filter = {
            domain: '',
            payment_gateway: '',
            start_date: '',
            end_date: ''
        }
        this.earningData = [
            ['x', 'Value'],
            ['New Transaction', 0],
            ['Refund', 0],
            ['Void', 0],
            ['Chargeback', 0]
        ]
        this.transactionCountData = [
            ['x', 'Value'],
            ['New Transaction', 0],
            ['Refund', 0],
            ['Void', 0],
            ['Chargeback', 0]]
        this.earningRows = []
        this.earningReportDate = moment().format('MM/DD/YYYY')
    }

    @action.bound
    async setDashboardEarningData() {
        this.isApiError = false
        this.isLoadingChart = true
        this.apiErrorMessage = ''
        try {
            const response = await getWebsiteEarnings(this.filter)
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            const earningsData = responseData.data
            this.earningData = [['x', 'New Transaction', 'Refund', 'Void', 'Chargeback']]
            this.transactionCountData = [['x', 'New Transaction', 'Refund', 'Void', 'Chargeback']]
            for (const earning of earningsData) {
                const earningChartData = [
                    earning.date,
                    earning.new_transaction,
                    earning.refund,
                    earning.void,
                    earning.chargeback
                ]
                this.earningData.push(earningChartData)
                const transactionCountChartData = [
                    earning.date,
                    earning.new_transaction_count,
                    earning.refund_transaction_count,
                    earning.void_transaction_count,
                    earning.chargeback_count
                ]
                this.transactionCountData.push(transactionCountChartData)
            }
            this.isLoadingChart = false
            this.isApiError = false
            this.apiErrorMessage = ''
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const error = err
            console.log('error', error)
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isApiError = true
            this.apiErrorMessage = error.message
        }
    }

    @action.bound
    async setDashboardEarningReport(targetDate: Date, onLoad: boolean) {
        this.isApiError = false
        this.isLoading = true
        this.apiErrorMessage = ''
        try {
            const object = {
                domain: this.filter.domain,
                payment_gateway: this.filter.payment_gateway,
                target_date: targetDate,
                onLoad: onLoad
            }
            const response = await getWebsiteEarningReport(object)
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data.data
            const array = []
            if (responseData.rows.length > 0) {
                const total = responseData.rows[responseData.rows.length - 1]
                for (let i = 0; i < responseData.rows.length - 1; i++) {
                    const element = responseData.rows[i]
                    element.percentage = ((100 * Number(element.new_transaction)) / Number(total.new_transaction)).toFixed(2) + '%'
                    element.netProfitPercentage = ((100 * Number(element.net_revenue)) / Number(total.net_revenue)).toFixed(2) + '%'
                    element.stickyIoPercentage = ((100 * Number(element.sticky_io_transaction_cost)) / Number(element.payment_gateway_charge)).toFixed(2) + '%'
                    element.new_transaction = '$' + element.new_transaction
                    element.netProfit = '$' + element.net_revenue
                    element.payment_gateway_charge = '$' + element.payment_gateway_charge
                    element.sticky_io_transaction_cost = '$' + element.sticky_io_transaction_cost
                    element.revenue_collected = '$' + element.revenue_collected
                    element.refund = '$' + element.refund
                    element.void = '$' + element.void
                    element.chargeback = '$' + element.chargeback
                    element.model_earning = '$' + element.model_earning
                    array.push(element)
                }
                total.new_transaction = '$' + total.new_transaction
                total.netProfit = '$' + total.net_revenue
                total.refund = '$' + total.refund
                total.stickyIoPercentage = ((100 * Number(total.sticky_io_transaction_cost)) / Number(total.payment_gateway_charge)).toFixed(2) + '%'
                total.payment_gateway_charge = '$' + total.payment_gateway_charge
                total.sticky_io_transaction_cost = '$' + total.sticky_io_transaction_cost
                total.revenue_collected = '$' + total.revenue_collected
                total.void = '$' + total.void
                total.chargeback = '$' + total.chargeback
                total.model_earning = '$' + total.model_earning
                array.push(total)
            }
            this.earningRows = array
            this.isApiError = false
            this.apiErrorMessage = ''
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const error = err
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isApiError = true
            this.apiErrorMessage = error.message
        }
    }

    @action.bound
    async getLastTransactionReportDate() {
        try {
            const response = await getWebsiteLastTransactionReportDate()
            this.earningReportDate = moment(new Date(response.data.data.date)).format('MM/DD/YYYY')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const error = err
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isApiError = true
            this.apiErrorMessage = error.message
        }
    }

}

export default EarningDashboardStore
