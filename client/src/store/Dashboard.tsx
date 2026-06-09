import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import moment from 'moment'
import {
    getDashboardData,
    getDashboardTransactionData,
    getStickyIoRecentTransaction,
    getHourlyTransaction,
    getTransactionsCount,
    getUniversalLoginTransactions
} from '../api/Dashboard'
import { Range } from 'react-date-range'
import { LastTransaction, StickyIOTransaction } from '../types/types'
import { AxiosError, AxiosResponse } from 'axios'

interface filterOption {
    domain: string
    transactionType: { label: string, value: string }
    limit: number
    is_unique: string | boolean
    start_date: string
    end_date: string
    hourly_transactions_date_range: Range
    transactions_count_date_range: Range
    hourlyTransactionDomain: string
    transactionsCountDomain: string
}

interface universalLoginTransactionsFilterOptions {
    startDate: string
    endDate: string
    domain: string
}

class DashboardStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public recurringTransactions: string[][]
    @observable public cbptTransactions: string[][]
    @observable public addCardLogTransactions: string[][]
    @observable public lastSubscriptionTransaction: Array<LastTransaction>
    @observable public lastCbptTransaction: Array<LastTransaction>
    @observable public filter: filterOption
    @observable public isRecurringGraphExist: boolean
    @observable public isCBPTGraphExist: boolean
    @observable public isLoadingTransaction: boolean
    @observable public addCardLogTransactionsForStickyIo: string[][]
    @observable public recurringTransactionsForStickyIo: string[][]
    @observable public cbptTransactionsForStickyIo: string[][]
    @observable public isRecurringStickyIOGraphExist: boolean
    @observable public isCBPTStickyIOGraphExist: boolean
    @observable public isAddCardLogGraphExist: boolean
    @observable public isStickyIoAddCardLogGraphExist: boolean
    @observable public activeTab: string
    @observable public recentStickyIoSubscriptions: Array<StickyIOTransaction>
    @observable public recentStickyIoContentPurchase: Array<StickyIOTransaction>
    @observable public hourlyTransactionCount: Array<Array<(string | number)>>
    @observable public transactionsCount: Array<Array<(string | number)>>
    @observable public isLoadingHourlyTransaction: boolean
    @observable public isLoadingTransactionsCount: boolean
    @observable public isLoadingUniversalLoginTransactions: boolean
    @observable public universalLoginTransactionCounts: Array<Array<(string | number)>>
    @observable public universalLoginTransactionsFilter: universalLoginTransactionsFilterOptions
    @observable public universalLoginUsersEarnings: number
    @observable public nonUniversalLoginUsersEarnings: number
    @observable public totalEarnings: number
    @observable public ccbillTotalEarning: number
    @observable public stickyIoTotalEarning: number

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.recurringTransactions = []
        this.cbptTransactions = []
        this.addCardLogTransactions = []
        this.lastSubscriptionTransaction = []
        this.lastCbptTransaction = []
        this.hourlyTransactionCount = []
        this.transactionsCount = []
        this.ccbillTotalEarning = 0
        this.stickyIoTotalEarning = 0
        this.filter = {
            domain: '',
            transactionType: { label: 'All', value: '' },
            hourlyTransactionDomain: '',
            transactionsCountDomain: '',
            limit: 50,
            is_unique: true,
            start_date: moment().format('MM/DD/YYYY'),
            end_date: moment().format('MM/DD/YYYY'),
            hourly_transactions_date_range: { startDate: new Date(), endDate: new Date(), key: 'selection' },
            transactions_count_date_range: { startDate: moment().subtract(6, 'day').toDate(), endDate: new Date(), key: 'selection' }
        }
        this.universalLoginTransactionsFilter = {
            startDate: '',
            endDate: '',
            domain: ''
        }
        this.isRecurringGraphExist = false
        this.isCBPTGraphExist = false
        this.isLoadingTransaction = false
        this.addCardLogTransactionsForStickyIo = []
        this.recurringTransactionsForStickyIo = []
        this.cbptTransactionsForStickyIo = []
        this.isRecurringStickyIOGraphExist = false
        this.isCBPTStickyIOGraphExist = false
        this.isAddCardLogGraphExist = false
        this.isStickyIoAddCardLogGraphExist = false
        this.activeTab = 'analytics'
        this.recentStickyIoContentPurchase = []
        this.recentStickyIoSubscriptions = []
        this.isLoadingHourlyTransaction = false
        this.isLoadingTransactionsCount = false
        this.isLoadingUniversalLoginTransactions = false
        this.universalLoginTransactionCounts = [
            ['x', 'Value'],
            ['Non Universal Users Earnings', 0],
            ['Total Earnings', 0],
            ['Universal Users Earnings', 0]
        ]
        this.universalLoginUsersEarnings = 0
        this.nonUniversalLoginUsersEarnings = 0
        this.totalEarnings = 0
    }

    @action.bound
    setDashboardData() {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        getDashboardData({ domain: this.filter.domain, transactionType: this.filter.transactionType.value }).then((response) => {
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }

            const responseData = response.data
            this.lastSubscriptionTransaction = responseData.last_recurring_transaction
            this.lastCbptTransaction = responseData.last_cbpt_transaction
            this.ccbillTotalEarning = responseData.totalAmount
            this.isLoading = false
            this.isApiError = false
            this.apiErrorMessage = ''
        }).catch((error) => {
            console.log('error', error)
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isLoading = false
            this.isApiError = true
            this.apiErrorMessage = error.message
        })
    }

    @action.bound
    setDashboardTransactionData() {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoadingTransaction = true

        getDashboardTransactionData(this.filter).then((response) => {
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }

            const responseData = response.data
            this.recurringTransactions = [
                ['Transaction Type', 'Count'],
                ['Success', responseData.recurring_success_transaction],
                ['Failed', responseData.recurring_fail_transaction]
            ]

            this.cbptTransactions = [
                ['Transaction Type', 'Count'],
                ['Success', responseData.cbpt_success_transaction],
                ['Failed', responseData.cbpt_fail_transaction]
            ]

            this.recurringTransactionsForStickyIo = [
                ['Transaction Type', 'Count'],
                ['Success', responseData.recurring_success_transaction_for_sticky_io],
                ['Failed', responseData.recurring_fail_transaction_for_sticky_io]
            ]

            this.cbptTransactionsForStickyIo = [
                ['Transaction Type', 'Count'],
                ['Success', responseData.cbpt_success_transaction_for_sticky_io],
                ['Failed', responseData.cbpt_fail_transaction_for_sticky_io]
            ]

            this.addCardLogTransactions = [
                ['Transaction Type', 'Count'],
                ['Success', responseData.add_card_log_success],
                ['Failed', responseData.add_card_log_error]
            ]

            this.addCardLogTransactionsForStickyIo = [
                ['Transaction Type', 'Count'],
                ['Success', responseData.sticky_io_add_card_success],
                ['Failed', responseData.sticky_io_add_card_error]
            ]

            this.isRecurringGraphExist = (responseData.recurring_success_transaction !== 0 || responseData.recurring_fail_transaction !== 0)
            this.isCBPTGraphExist = (responseData.cbpt_success_transaction !== 0 || responseData.cbpt_fail_transaction !== 0)
            this.isRecurringStickyIOGraphExist = (responseData.recurring_success_transaction_for_sticky_io !== 0 || responseData.recurring_fail_transaction_for_sticky_io !== 0)
            this.isCBPTStickyIOGraphExist = (responseData.cbpt_success_transaction_for_sticky_io !== 0 || responseData.cbpt_fail_transaction_for_sticky_io !== 0)

            this.isAddCardLogGraphExist = (responseData.add_card_log_success !== 0 || responseData.add_card_log_error !== 0)
            this.isStickyIoAddCardLogGraphExist = (responseData.sticky_io_add_card_success !== 0 || responseData.sticky_io_add_card_error !== 0)

            this.isLoadingTransaction = false
            this.isApiError = false
            this.apiErrorMessage = ''
        }).catch((error) => {
            console.log('error', error)
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isLoadingTransaction = false
            this.isApiError = true
            this.apiErrorMessage = error.message
        })
    }

    @action.bound
    setHourlyTransactionData() {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoadingHourlyTransaction = true
        this.filter.start_date = moment(this.filter.hourly_transactions_date_range.startDate).format('MM/DD/YYYY')
        this.filter.end_date = moment(this.filter.hourly_transactions_date_range.endDate).format('MM/DD/YYYY')
        getHourlyTransaction(this.filter).then((response) => {
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                alert(response.data.message)
                this.isLoadingHourlyTransaction = false
                return
            }
            const responseData = response.data
            const hourlyTransactionData = responseData.data
            this.hourlyTransactionCount = [['x', 'Total Transaction', 'CCBill', 'Sticky.io', 'Forumpay']]
            for (const hourlyTransaction of hourlyTransactionData) {
                const hourlyTransactionChartData = [
                    hourlyTransaction.date,
                    hourlyTransaction.totalTransaction,
                    hourlyTransaction.ccbillTransaction,
                    hourlyTransaction.sticky_io_transaction,
                    hourlyTransaction.forumpayTransaction
                ]
                this.hourlyTransactionCount.push(hourlyTransactionChartData)
            }
            this.isLoadingHourlyTransaction = false
            this.isApiError = false
        }).catch((error) => {
            console.log('error', error)
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isLoadingHourlyTransaction = false
            this.isApiError = true
            this.apiErrorMessage = error.message
        })
    }

    @action.bound
    setTransactionsCountData() {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoadingTransactionsCount = true
        this.filter.start_date = moment(this.filter.transactions_count_date_range.startDate).format('MM/DD/YYYY')
        this.filter.end_date = moment(this.filter.transactions_count_date_range.endDate).format('MM/DD/YYYY')
        getTransactionsCount(this.filter).then((response) => {
            const responseData = response.data
            if (responseData.status === 400) {
                this.isApiError = true
                this.apiErrorMessage = responseData.message
            } else {
                this.transactionsCount = responseData.data
            }
            this.isLoadingTransactionsCount = false
        }).catch((error) => {
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isApiError = true
            this.apiErrorMessage = error.message
            this.isLoadingTransactionsCount = false
        })
    }

    @action.bound
    setActiveTab(tab: string) {
        this.activeTab = tab
    }

    @action.bound
    setStickyIoRecentTransactions() {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true

        getStickyIoRecentTransaction({ domain: this.filter.domain, transactionType: this.filter.transactionType.value }).then((response: AxiosResponse) => {
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }

            const responseData = response.data
            this.recentStickyIoSubscriptions = responseData.recent_subscription
            this.recentStickyIoContentPurchase = responseData.recent_content_purchase,
            this.stickyIoTotalEarning = responseData.totalAmount
            this.isLoading = false
            this.isApiError = false
            this.apiErrorMessage = ''
        }).catch((error: AxiosError) => {
            console.log('error', error)
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isLoading = false
            this.isApiError = true
            this.apiErrorMessage = error.message
        })
    }

    @action.bound
    setUniversalTransactionCount() {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoadingUniversalLoginTransactions = true
        const requestData = {
            start_date: this.universalLoginTransactionsFilter.startDate,
            end_date: this.universalLoginTransactionsFilter.endDate,
            domain: this.universalLoginTransactionsFilter.domain
        }
        getUniversalLoginTransactions(requestData).then((response) => {
            const responseData = response.data
            if (responseData.status === 400) {
                this.isApiError = true
                this.apiErrorMessage = responseData.message
            } else {
                this.universalLoginUsersEarnings = 0
                this.nonUniversalLoginUsersEarnings = 0
                this.totalEarnings = 0

                const earningsData = responseData.data
                this.universalLoginTransactionCounts = [['x', 'Non Universal Users Earnings', 'Total Earnings', 'Universal Users Earnings']]

                for (let index = 0; index < earningsData.length; index++) {
                    const element = earningsData[index]

                    const transactionCountChartData = [
                        element.date,
                        element.non_universal_users_earnings,
                        element.total_earning_for_day,
                        element.universal_users_earnings
                    ]
                    this.universalLoginTransactionCounts.push(transactionCountChartData)

                    this.universalLoginUsersEarnings += element.universal_users_earnings
                    this.nonUniversalLoginUsersEarnings += element.non_universal_users_earnings
                    this.totalEarnings += element.total_earning_for_day
                }
            }
            this.isLoadingUniversalLoginTransactions = false
        }).catch((error) => {
            if (error.request.status === 401) {
                this.rootStore.authStore.setAuthToken('')
            }
            this.isApiError = true
            this.apiErrorMessage = error.message
            this.isLoadingUniversalLoginTransactions = false
        })
    }
}

export default DashboardStore
