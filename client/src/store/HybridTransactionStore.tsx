import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getHybridTransactionCount, getHybridTransactionSummary } from '../api/HybridTransactions'
import _ from 'lodash'
import { GlobalTransactionSummary, PaymentGatewayTransactionSummary, SecondaryPaymentSummary } from '../types/types'

interface filterOption {
    domain: string
    start_date: string
    end_date: string
}

interface summaryFilterOption {
    domain: string
    filter_by: string
    record_limit: number
    is_recurring: string
    countries: Array<string>
    exclude_include_country: string
    start_date: string
    end_date: string
    is_cascade_enabled: string
}

class HybridTransactionStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public filter: filterOption
    @observable public transactionCountData: Array<Array<(string | number)>>
    @observable public transactionAmountData: Array<Array<(string | number)>>
    @observable public summaryFilter: summaryFilterOption
    @observable public globalTransactionSummary: Array<GlobalTransactionSummary>
    @observable public paymentGatewayTransactionSummary: Array<PaymentGatewayTransactionSummary>
    @observable public paymentGatewayTransactionTotalSummary: PaymentGatewayTransactionSummary
    @observable public secondaryPaymentSummary: SecondaryPaymentSummary

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.filter = {
            domain: '',
            start_date: '',
            end_date: ''
        }
        this.summaryFilter = {
            domain: '',
            filter_by: 'date',
            record_limit: 50,
            is_recurring: 'all',
            countries: [],
            exclude_include_country: 'exclude',
            start_date: '',
            end_date: '',
            is_cascade_enabled: 'all'
        }
        this.transactionCountData = []
        this.transactionAmountData = []
        this.globalTransactionSummary = []
        this.paymentGatewayTransactionSummary = []
        this.paymentGatewayTransactionTotalSummary = {
            success: 0,
            success_amount: 0,
            failed: 0,
            unique_failed: 0,
            unique_failed_amount: 0
        }
        this.secondaryPaymentSummary = {
            total_count: 0,
            total_amount: 0,
            cascade_count: 0,
            cascade_amount: 0,
            normal_count: 0,
            normal_amount: 0
        }
    }

    @action.bound
    async setTransactionCountData() {
        this.isApiError = false
        this.isLoading = true
        this.apiErrorMessage = ''
        try {
            const response = await getHybridTransactionCount(this.filter)
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            const transactionCountData = responseData.data
            this.transactionCountData = [['x', 'Success', 'Cascade Success', 'Unique Failed', 'Failed']]
            this.transactionAmountData = [['x', 'Success Amount', 'Cascade Success Amount', 'Unique Failed Amount']]
            for (const count of transactionCountData) {
                const transactionChartData = [
                    count.date,
                    count.success,
                    count.cascade_success,
                    count.unique_failed,
                    count.failed
                ]
                const transactionChartAmountData = [
                    count.date,
                    count.success_amount,
                    count.cascade_success_amount,
                    count.unique_failed_amount
                ]
                this.transactionCountData.push(transactionChartData)
                this.transactionAmountData.push(transactionChartAmountData)
            }

            this.isApiError = false
            this.apiErrorMessage = ''
        } catch (error) {
            console.log('error', error)
            const status = _.get(error, 'request.status', false)
            if (status !== false && status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isApiError = true
            this.apiErrorMessage = _.get(error, 'message', 'Error in set transaction count data')
        }
    }

    @action.bound
    async setTransactionSummaryData() {
        this.isApiError = false
        this.isLoading = true
        this.apiErrorMessage = ''
        try {
            const response = await getHybridTransactionSummary(this.summaryFilter)
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            const transactionCountData = responseData.data
            this.globalTransactionSummary = transactionCountData.global_summary

            this.secondaryPaymentSummary.total_count = transactionCountData.global_summary[0].processed_count_by_secondary_gateway
            this.secondaryPaymentSummary.total_amount = transactionCountData.global_summary[0].processed_amount_by_secondary_gateway
            this.secondaryPaymentSummary.cascade_count = transactionCountData.global_summary[0].cascade_success
            this.secondaryPaymentSummary.cascade_amount = transactionCountData.global_summary[0].cascade_success_amount
            this.secondaryPaymentSummary.normal_count = transactionCountData.global_summary[0].processed_count_by_secondary_gateway_not_cascade
            this.secondaryPaymentSummary.normal_amount = transactionCountData.global_summary[0].processed_amount_by_secondary_gateway_not_cascade

            this.paymentGatewayTransactionSummary = transactionCountData.payment_gateway_summary

            this.paymentGatewayTransactionTotalSummary = {
                success: 0,
                failed: 0,
                unique_failed: 0,
                success_amount: 0,
                unique_failed_amount: 0
            }

            for (const summary of transactionCountData.payment_gateway_summary) {
                this.paymentGatewayTransactionTotalSummary.success += summary.success
                this.paymentGatewayTransactionTotalSummary.failed += summary.failed
                this.paymentGatewayTransactionTotalSummary.unique_failed += summary.unique_failed
                this.paymentGatewayTransactionTotalSummary.success_amount += summary.success_amount
                this.paymentGatewayTransactionTotalSummary.unique_failed_amount += summary.unique_failed_amount
            }

            this.isApiError = false
            this.apiErrorMessage = ''
        } catch (error) {
            console.log('error', error)
            const status = _.get(error, 'request.status', false)
            if (status !== false && status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isApiError = true
            this.apiErrorMessage = _.get(error, 'message', 'Error in get transaction summary')
        }
    }
}

export default HybridTransactionStore
