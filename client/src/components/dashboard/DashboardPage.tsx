import React, { useEffect, useState } from 'react'
import { DateRangePicker, RangeKeyDict } from 'react-date-range'
import styled from 'styled-components'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { Chart } from 'react-google-charts'
import moment from 'moment'
import _ from 'lodash'
import { ActionMeta, ValueType } from 'react-select/src/types'
import Select from 'react-select'
import Table from '../table/Table'
import { Cell } from './../table/Definations'
import classNames from 'classnames'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'
import DateRange from './../utils/DateRange'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const DateInput = styled.input<{ loading?: boolean }>`
    background-color: ${props => props.loading ? 'hsl(0, 0%, 95%)' : '#fff'} !important;
`

const ResetLink = styled.a<{ isLoad?: boolean }>`
    pointer-events: ${props => props.isLoad ? 'none' : 'auto'};
    cursor: pointer;
`

const DashboardPage: React.FC<Props> = ({ rootStore }) => {
    const { dashboard, websiteStore, authStore } = rootStore
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [chartTitle, setChartTitle] = useState('Hours')
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const { theme, bgColor, fontColor } = authStore

    const {
        isLoading,
        setDashboardData,
        recurringTransactions,
        cbptTransactions,
        addCardLogTransactions,
        lastSubscriptionTransaction,
        lastCbptTransaction,
        filter,
        setDashboardTransactionData,
        isRecurringGraphExist,
        isCBPTGraphExist,
        isLoadingTransaction,
        addCardLogTransactionsForStickyIo,
        recurringTransactionsForStickyIo,
        cbptTransactionsForStickyIo,
        isRecurringStickyIOGraphExist,
        isCBPTStickyIOGraphExist,
        isAddCardLogGraphExist,
        isStickyIoAddCardLogGraphExist,
        setActiveTab,
        activeTab,
        setStickyIoRecentTransactions,
        recentStickyIoSubscriptions,
        recentStickyIoContentPurchase,
        setHourlyTransactionData,
        hourlyTransactionCount,
        setTransactionsCountData,
        transactionsCount,
        isLoadingHourlyTransaction,
        isLoadingTransactionsCount,
        isApiError,
        apiErrorMessage,
        setUniversalTransactionCount,
        isLoadingUniversalLoginTransactions,
        universalLoginTransactionCounts,
        universalLoginTransactionsFilter,
        universalLoginUsersEarnings,
        nonUniversalLoginUsersEarnings,
        totalEarnings,
        ccbillTotalEarning,
        stickyIoTotalEarning
    } = dashboard

    useEffect(() => {
        initData()
    }, [])

    const initData = async () => {
        if (isDataLoading) {
            setInitialDates()
        }
    }

    const setInitialDates = () => {
        const startDate = moment().subtract(6, 'days').format('MM-DD-YYYY')
        const endDate = moment().format('MM-DD-YYYY')

        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        universalLoginTransactionsFilter.startDate = startDate
        universalLoginTransactionsFilter.endDate = endDate
    }

    const onDatePickerChange = (start_date: string, end_date: string) => {
        universalLoginTransactionsFilter.startDate = moment(start_date).format('MM-DD-YYYY')
        universalLoginTransactionsFilter.endDate = moment(end_date).format('MM-DD-YYYY')
        setStartDateInLocalString(moment(start_date).format('MM-DD-YYYY'))
        setEndDateInLocalString(moment(end_date).format('MM-DD-YYYY'))
    }

    const dateRange = (activeTab === 'hourly_transaction') ? filter.hourly_transactions_date_range
        : filter.transactions_count_date_range
    const startDate = moment(dateRange.startDate).format('MM/DD/YYYY')
    const endDate = moment(dateRange.endDate).format('MM/DD/YYYY')
    const lineChartDateInputValue = startDate + ' - ' + endDate

    const hourlyTransactionOptions = {
        hAxis: {
            title: chartTitle,
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        vAxis: {
            title: 'Transaction Count',
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        focusTarget: 'category',
        legend: {
            position: 'top',
            alignment: 'center',
            textStyle: {
                color: fontColor
            }
        },
        colors: ['#00bb00', '#FFD300', '#F62B00', '#6B2C1F'],
        pointSize: 4,
        backgroundColor: bgColor,
        titleTextStyle: {
            color: fontColor
        }
    }

    const transactionsCountOptions = structuredClone(hourlyTransactionOptions)
    transactionsCountOptions.hAxis.title = 'Date'
    transactionsCountOptions.colors = ['#0492c2', '#00bb00', '#F62B00']

    useEffect(() => {
        if (isDataLoading) {
            if (activeTab === 'analytics') {
                setDashboardTransactionData()
            } else if (activeTab === 'ccbill_transaction') {
                setDashboardData()
            } else if (activeTab === 'sticky_io_transaction') {
                setStickyIoRecentTransactions()
            } else if (activeTab === 'hourly_transaction') {
                setHourlyTransactionData()
            } else if (activeTab === 'transactions_count') {
                setTransactionsCountData()
            } else if (activeTab === 'universal_transaction_count') {
                setUniversalTransactionCount()
            }
            setIsDataLoading(false)
        }
    }, [setDashboardTransactionData])

    const limitOptions = [
        { label: 'Recent 50 Transactions', value: 50 },
        { label: 'Recent 100 Transactions', value: 100 },
        { label: 'Recent 500 Transactions', value: 500 },
        { label: 'Recent 1000 Transactions', value: 1000 }
    ]

    const selectLimitOptions = limitOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value

        if (name === 'limit') {
            filter.limit = parseInt(value)
        }
        if (name === 'is_unique') {
            filter.is_unique = (e.target as HTMLInputElement).checked
        }
    }

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const selectedValue = _.get(value, 'value', '')
        const lineChartTabs = ['hourly_transaction', 'transactions_count']

        if (!lineChartTabs.includes(activeTab)) {
            filter.domain = selectedValue
        }

        if (activeTab === 'ccbill_transaction') {
            setDashboardData()
        } else if (activeTab === 'sticky_io_transaction') {
            setStickyIoRecentTransactions()
        } else if (activeTab === 'hourly_transaction') {
            filter.hourlyTransactionDomain = selectedValue
        } else if (activeTab === 'transactions_count') {
            filter.transactionsCountDomain = selectedValue
        } else if (activeTab === 'universal_transaction_count') {
            universalLoginTransactionsFilter.domain = selectedValue
        }
    }

    const onTabChange = (tab: string) => {
        if (tab === 'analytics') {
            setDashboardTransactionData()
        } else if (tab === 'ccbill_transaction') {
            setDashboardData()
        } else if (tab === 'sticky_io_transaction') {
            setStickyIoRecentTransactions()
        } else if (tab === 'hourly_transaction') {
            setShowDatePicker(false)
            setHourlyTransactionData()
        } else if (tab === 'transactions_count') {
            setShowDatePicker(false)
            setTransactionsCountData()
        } else if (tab === 'universal_transaction_count') {
            setUniversalTransactionCount()
        }
        setActiveTab(tab)
    }
    // loading line chart data when we apply filter
    const handleLineChart = () => {
        if (activeTab === 'hourly_transaction') {
            setHourlyTransactionData()
            setDateDiiff(startDate, endDate)
        } else if (activeTab === 'transactions_count') {
            setTransactionsCountData()
        }
    }

    const setDateDiiff = (startDate: string, endDate: string) => {
        const dateStart = moment(startDate, 'MM/DD/YYYY')
        const dateEnd = moment(endDate, 'MM/DD/YYYY')
        const daysDiff = dateEnd.diff(dateStart, 'days')
        if (daysDiff > 0) {
            setChartTitle('Date')
        } else {
            setChartTitle('Hours')
        }
    }

    const handleDateChange = (ranges: RangeKeyDict) => {
        if (activeTab === 'hourly_transaction') {
            filter.hourly_transactions_date_range = ranges.selection
        } else if (activeTab === 'transactions_count') {
            filter.transactions_count_date_range = ranges.selection
        }
    }

    const handleDate = () => {
        setShowDatePicker(!showDatePicker)
    }

    const Loader = () => {
        return <div className='text-center'>
            <div className='spinner-border' role='status' style={{ color: '#c6c6c6' }}>
                <span className='sr-only'>Loading...</span>
            </div>
        </div>
    }

    const tableCellDomainLink: React.FC<Cell> = ({ value }) => {
        const url = (/(http(s?)):\/\//i.test(value)) === true ? value : `https://${value}`
        return <a href={url} target='_blank' rel='noreferrer'>{value}</a>
    }

    const tableCellTimeAgo: React.FC<Cell> = ({ value }) => {
        const timeAgo = moment(value).fromNow()
        const time = moment(value).format('MM/DD/YYYY HH:mm:ss')
        return (<span data-bs-toggle='tooltip' data-bs-placement='top' title={time}>{timeAgo}</span>)
    }

    const ccbillAmountCell: React.FC<Cell> = (objData) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const url = new URL(jsonData.url)
        let amount = url.searchParams.get('initialPrice') || '0.00'
        amount = parseFloat(amount).toFixed(2)
        return <>${amount}</>
    }

    const ccbillTransactionTypeCell: React.FC<Cell> = (objData) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const url = new URL(jsonData.url)
        const type = url.searchParams.get('type') || ''
        return <>{type}</>
    }

    const StickyIoAmountCell: React.FC<Cell> = (props) => {
        const amount = _.get(props.data, 'request_data.offers[0].price', false)
        if (amount) {
            return <span>${parseFloat(amount).toFixed(2)}</span>
        }
        const trial = _.get(props.data, 'request_data.offers[0].trial', false)
        if (trial) {
            return <span>${parseFloat(trial.price).toFixed(2)}</span>
        }
        return <></>
    }

    const StickyIoTransactionTypeCell: React.FC<Cell> = (props) => {
        const type = _.get(props.data, 'request_data.AFID', '')
        return <span>{type}</span>
    }

    const handleResetDate = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        if (activeTab === 'hourly_transaction') {
            filter.hourly_transactions_date_range.startDate = new Date()
            filter.hourly_transactions_date_range.endDate = new Date()
        } else if (activeTab === 'transactions_count') {
            filter.transactions_count_date_range.startDate = moment().subtract(7, 'day').toDate()
            filter.transactions_count_date_range.endDate = new Date()
        }
    }

    const transactionType = [
        { label: 'All', value: '' },
        { label: 'Chat Content Purchase', value: 'chat' },
        { label: 'Pay Per Message', value: 'chat_pay_per_message' },
        { label: 'Tip Payment', value: 'tips' },
        { label: 'Blog Content Purchase', value: 'blog' }
    ]

    const changeTransactionType = (e: { label: string, value: string } | null) => {
        if (e) {
            filter.transactionType = e
        }

        if (activeTab === 'ccbill_transaction') {
            setDashboardData()
        } else if (activeTab === 'sticky_io_transaction') {
            setStickyIoRecentTransactions()
        }
    }

    if (isDataLoading) {
        return <> Loading... </>
    }

    const countChartOptions = {
        hAxis: {
            title: 'Date (MST)',
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        vAxis: {
            title: 'Amount ($)',
            viewWindowMode: 'explicit',
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        focusTarget: 'category',
        colors: ['#FFA500', '#00bb00', '#FFD300'],
        legend: {
            position: 'top',
            alignment: 'center',
            maxLines: 4,
            textStyle: {
                color: fontColor
            }
        },
        pointSize: 5,
        backgroundColor: bgColor,
        titleTextStyle: {
            color: fontColor
        }
    }

    const formatAmount = (amount: number) => {
        const formatAmount = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        return '$' + formatAmount
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <>
            <div className='btn-group'>
                <button type='button'
                    className={classNames('btn', { 'btn-primary': activeTab === 'analytics', 'btn-outline-primary': activeTab !== 'analytics' })}
                    onClick={() => onTabChange('analytics')}
                >Analytics</button>
                <button type='button'
                    className={classNames('btn', { 'btn-primary': activeTab === 'ccbill_transaction', 'btn-outline-primary': activeTab !== 'ccbill_transaction' })}
                    onClick={() => onTabChange('ccbill_transaction')}
                >CCBill Recent Transactions</button>
                <button type='button'
                    className={classNames('btn', { 'btn-primary': activeTab === 'sticky_io_transaction', 'btn-outline-primary': activeTab !== 'sticky_io_transaction' })}
                    onClick={() => onTabChange('sticky_io_transaction')}
                >Sticky.io Recent Transactions</button>
                <button type='button'
                    className={classNames('btn', { 'btn-primary': activeTab === 'hourly_transaction', 'btn-outline-primary': activeTab !== 'hourly_transaction' })}
                    onClick={() => onTabChange('hourly_transaction')}
                >Hourly Transactions</button>
                <button type='button'
                    className={classNames('btn', { 'btn-primary': activeTab === 'transactions_count', 'btn-outline-primary': activeTab !== 'transactions_count' })}
                    onClick={() => onTabChange('transactions_count')}
                >Transactions Count</button>
                <button type='button'
                    className={classNames('btn', { 'btn-primary': activeTab === 'universal_transaction_count', 'btn-outline-primary': activeTab !== 'universal_transaction_count' })}
                    onClick={() => onTabChange('universal_transaction_count')}
                >Universal Login Transactions</button>
            </div>
            <div className='tab-content mb-4'>
                <div className={classNames('tab-pane fade',
                    { 'show active': activeTab === 'analytics' })}>
                    {
                        isLoading ? <Loader /> :
                            <>
                                <div className='row my-3'>
                                    <div className='col-md-3'>
                                        <select
                                            className='form-control form-select'
                                            id='limit'
                                            name='limit'
                                            value={filter.limit}
                                            onChange={onChange}>
                                            {selectLimitOptions}
                                        </select>
                                    </div>
                                    {activeTab === 'analytics' &&
                                        <div className='col-md-3'>
                                            <Domain
                                                onDomainChange={handleChange}
                                                websiteStore={websiteStore}
                                                defaultDomain={filter.domain}
                                                loading={isLoading}
                                                multiSelect={false}
                                            />
                                        </div>
                                    }
                                    <div className='col-md-2'>
                                        <div className='form-check form-switch mt-1'>
                                            <input className='form-check-input' type='checkbox' id='is_unique' defaultChecked={true} onChange={onChange} name='is_unique' />
                                            <label className='form-check-label' htmlFor='is_unique'>Is Unique?</label>
                                        </div>
                                    </div>
                                    <div className='col-md-3'>
                                        <button type='button'
                                            className='btn btn-primary'
                                            onClick={setDashboardTransactionData}
                                            disabled={isLoading}>
                                            Apply Filter</button>
                                    </div>
                                </div>
                                <div className='row mt-4'>
                                    <div className='col-12'>
                                        <h4 className='mt-2 mb-3'>CCBill Transactions</h4>
                                        <div className='row'>
                                            <div className='col-md-4 col-12'>
                                                <div className='card'>
                                                    <div className='card-body px-0'>
                                                        <h5 className='card-title text-center'>Add Card Log</h5>
                                                        {isLoadingTransaction ? <Loader /> :
                                                            isAddCardLogGraphExist === true ?
                                                                <Chart
                                                                    width='100%'
                                                                    height='300px'
                                                                    chartType='PieChart'
                                                                    loader={<Loader />}
                                                                    data={addCardLogTransactions}
                                                                    options={{
                                                                        slices: {
                                                                            0: { color: '#00bb00' },
                                                                            1: { color: '#bb0000' }
                                                                        },
                                                                        backgroundColor: bgColor,
                                                                        legend: {
                                                                            textStyle: {
                                                                                color: fontColor
                                                                            }
                                                                        }
                                                                    }}
                                                                /> : <div className='text-center'>No Data to display graph</div>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-4 col-12'>
                                                <div className='card'>
                                                    <div className='card-body px-0'>
                                                        <h5 className='card-title text-center'>Subscriptions (Rest API)</h5>
                                                        {isLoadingTransaction ? <Loader /> :
                                                            isRecurringGraphExist === true ?
                                                                <Chart
                                                                    width='100%'
                                                                    height='300px'
                                                                    chartType='PieChart'
                                                                    loader={<Loader />}
                                                                    data={recurringTransactions}
                                                                    options={{
                                                                        slices: {
                                                                            0: { color: '#00bb00' },
                                                                            1: { color: '#bb0000' }
                                                                        },
                                                                        backgroundColor: bgColor,
                                                                        legend: {
                                                                            textStyle: {
                                                                                color: fontColor
                                                                            }
                                                                        }
                                                                    }}
                                                                /> : <div className='text-center'>No Data to display graph</div>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-4 col-12'>
                                                <div className='card'>
                                                    <div className='card-body px-0'>
                                                        <h5 className='card-title text-center'>Unlocks, Tips (Rest API)</h5>
                                                        {isLoadingTransaction ? <Loader /> :
                                                            isCBPTGraphExist === true ?
                                                                <Chart
                                                                    width='100%'
                                                                    height='300px'
                                                                    chartType='PieChart'
                                                                    loader={<Loader />}
                                                                    data={cbptTransactions}
                                                                    options={{
                                                                        slices: {
                                                                            0: { color: '#00bb00' },
                                                                            1: { color: '#bb0000' }
                                                                        },
                                                                        backgroundColor: bgColor,
                                                                        legend: {
                                                                            textStyle: {
                                                                                color: fontColor
                                                                            }
                                                                        }
                                                                    }}
                                                                /> : <div className='text-center'>No Data to display graph</div>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='row mt-4'>
                                    <div className='col-12'>
                                        <h4 className='mt-2 mb-3'>Sticky.io Transactions</h4>
                                        <div className='row'>
                                            <div className='col-md-4 col-12'>
                                                <div className='card'>
                                                    <div className='card-body px-0'>
                                                        <h5 className='card-title text-center'>Add Card Log</h5>
                                                        {isLoadingTransaction ? <Loader /> :
                                                            isStickyIoAddCardLogGraphExist === true ?
                                                                <Chart
                                                                    width='100%'
                                                                    height='300px'
                                                                    chartType='PieChart'
                                                                    loader={<Loader />}
                                                                    data={addCardLogTransactionsForStickyIo}
                                                                    options={{
                                                                        slices: {
                                                                            0: { color: '#00bb00' },
                                                                            1: { color: '#bb0000' }
                                                                        },
                                                                        backgroundColor: bgColor,
                                                                        legend: {
                                                                            textStyle: {
                                                                                color: fontColor
                                                                            }
                                                                        }
                                                                    }}
                                                                /> : <div className='text-center'>No Data to display graph</div>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-4 col-12'>
                                                <div className='card'>
                                                    <div className='card-body px-0'>
                                                        <h5 className='card-title text-center'>Subscriptions</h5>
                                                        {isLoadingTransaction ? <Loader /> :
                                                            isRecurringStickyIOGraphExist === true ?
                                                                <Chart
                                                                    width='100%'
                                                                    height='300px'
                                                                    chartType='PieChart'
                                                                    loader={<Loader />}
                                                                    data={recurringTransactionsForStickyIo}
                                                                    options={{
                                                                        slices: {
                                                                            0: { color: '#00bb00' },
                                                                            1: { color: '#bb0000' }
                                                                        },
                                                                        backgroundColor: bgColor,
                                                                        legend: {
                                                                            textStyle: {
                                                                                color: fontColor
                                                                            }
                                                                        }
                                                                    }}
                                                                /> : <div className='text-center'>No Data to display graph</div>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-4 col-12'>
                                                <div className='card'>
                                                    <div className='card-body px-0'>
                                                        <h5 className='card-title text-center'>Unlocks, Tips</h5>
                                                        {isLoadingTransaction ? <Loader /> :
                                                            isCBPTStickyIOGraphExist === true ?
                                                                <Chart
                                                                    width='100%'
                                                                    height='300px'
                                                                    chartType='PieChart'
                                                                    loader={<Loader />}
                                                                    data={cbptTransactionsForStickyIo}
                                                                    options={{
                                                                        slices: {
                                                                            0: { color: '#00bb00' },
                                                                            1: { color: '#bb0000' }
                                                                        },
                                                                        backgroundColor: bgColor,
                                                                        legend: {
                                                                            textStyle: {
                                                                                color: fontColor
                                                                            }
                                                                        }
                                                                    }}
                                                                /> : <div className='text-center'>No Data to display graph</div>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                    }
                </div>
                <div className={classNames('tab-pane fade', { 'show active': activeTab === 'ccbill_transaction' })}>
                    {
                        isLoading ? <Loader /> :
                            <>
                                {activeTab === 'ccbill_transaction' &&
                                    <div className='row my-3'>
                                        <div className='col-md-3'>
                                            <Domain
                                                onDomainChange={handleChange}
                                                websiteStore={websiteStore}
                                                defaultDomain={filter.domain}
                                                loading={isLoading}
                                                multiSelect={false}
                                            />
                                        </div>
                                        <div className='col-md-3'>
                                            <Select
                                                name={'Transaction Type'}
                                                options={transactionType}
                                                onChange={(e) => changeTransactionType(e)}
                                                defaultValue={filter.transactionType}
                                                isDisabled={isLoading}
                                                isMulti={false}
                                            />
                                        </div>
                                    </div>
                                }
                                <div className='row mt-4'>
                                    <div className='col-lg-6'>
                                        <div className='card'>
                                            <div className='card-header'>Recent Subscriptions</div>
                                            <div className='card-body'>
                                                {
                                                    lastSubscriptionTransaction.length > 0 ?
                                                        <div className='table-responsive' >
                                                            <Table
                                                                unique_key='_id'
                                                                columns={[
                                                                    { name: 'domain', title: 'Domain', component: tableCellDomainLink },
                                                                    { name: 'amount', title: 'Amount', component: ccbillAmountCell },
                                                                    { name: 'type', title: 'Transaction Type', component: ccbillTransactionTypeCell },
                                                                    { name: 'created_at', title: 'Transaction Time', component: tableCellTimeAgo }
                                                                ]}
                                                                data={lastSubscriptionTransaction}
                                                            ></Table>
                                                        </div>
                                                        : <div className='text-center'>No Data to display</div>
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    <div className='col-lg-6'>
                                        <div className='card'>
                                            <div className='card-header'>Recent Unlocks, Tips</div>
                                            <div className='card-body'>
                                                {
                                                    isLoading ? <Loader /> :
                                                        lastCbptTransaction.length > 0 ?
                                                            <div className='table-responsive' >
                                                                <Table
                                                                    unique_key='_id'
                                                                    columns={[
                                                                        { name: 'domain', title: 'Domain', component: tableCellDomainLink },
                                                                        { name: 'amount', title: 'Amount', component: ccbillAmountCell },
                                                                        { name: 'type', title: 'Transaction Type', component: ccbillTransactionTypeCell },
                                                                        { name: 'created_at', title: 'Transaction Time', component: tableCellTimeAgo }
                                                                    ]}
                                                                    data={lastCbptTransaction}
                                                                ></Table>
                                                            </div>
                                                            : <div className='text-center'>No Data to display</div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='d-flex justify-content-center align-items-center mt-3'>
                                    <div className='col-auto'>
                                        <div className='card'>
                                            <div className='card-body text-center p-3'>
                                                <h5 className='mb-2'>Daily running total CCBill</h5>
                                                <h4 className='mb-0'>{formatAmount(Number(ccbillTotalEarning))}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                    }
                </div>
                <div className={classNames('tab-pane fade', { 'show active': activeTab === 'sticky_io_transaction' })}>
                    {
                        isLoading ? <Loader /> :
                            <>
                                {activeTab === 'sticky_io_transaction' &&
                                    <div className='row my-3'>
                                        <div className='col-md-3'>
                                            <Domain
                                                onDomainChange={handleChange}
                                                websiteStore={websiteStore}
                                                defaultDomain={filter.domain}
                                                loading={isLoading}
                                                multiSelect={false}
                                            />
                                        </div>
                                        <div className='col-md-3'>
                                            <Select
                                                name={'Transaction Type'}
                                                options={transactionType}
                                                onChange={(e) => changeTransactionType(e)}
                                                defaultValue={filter.transactionType}
                                                isDisabled={isLoading}
                                                isMulti={false}
                                            />
                                        </div>
                                    </div>
                                }
                                <div className='row mt-4'>
                                    <div className='col-lg-6'>
                                        <div className='card'>
                                            <div className='card-header'>Recent Subscriptions</div>
                                            <div className='card-body'>
                                                {
                                                    isLoading ? <Loader /> :
                                                        recentStickyIoSubscriptions.length > 0 ?
                                                            <div className='table-responsive' >
                                                                <Table
                                                                    unique_key='_id'
                                                                    columns={[
                                                                        { name: 'domain', title: 'Domain', component: tableCellDomainLink },
                                                                        { name: 'request_data', title: 'Amount', component: StickyIoAmountCell },
                                                                        { name: 'type', title: 'Transaction Type', component: StickyIoTransactionTypeCell },
                                                                        { name: 'createdAt', title: 'Transaction Time', component: tableCellTimeAgo }
                                                                    ]}
                                                                    data={recentStickyIoSubscriptions}
                                                                ></Table>
                                                            </div>
                                                            : <div className='text-center'>No Data to display</div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div className='col-lg-6'>
                                        <div className='card'>
                                            <div className='card-header'>Recent Unlocks, Tips</div>
                                            <div className='card-body'>
                                                {
                                                    isLoading ? <Loader /> :
                                                        recentStickyIoContentPurchase.length > 0 ?
                                                            <div className='table-responsive' >
                                                                <Table
                                                                    unique_key='_id'
                                                                    columns={[
                                                                        { name: 'domain', title: 'Domain', component: tableCellDomainLink },
                                                                        { name: 'request_data', title: 'Amount', component: StickyIoAmountCell },
                                                                        { name: 'type', title: 'Transaction Type', component: StickyIoTransactionTypeCell },
                                                                        { name: 'createdAt', title: 'Transaction Time', component: tableCellTimeAgo }
                                                                    ]}
                                                                    data={recentStickyIoContentPurchase}
                                                                ></Table>
                                                            </div>
                                                            : <div className='text-center'>No Data to display</div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='d-flex justify-content-center align-items-center mt-3'>
                                    <div className='col-auto'>
                                        <div className='card'>
                                            <div className='card-body text-center p-3'>
                                                <h5 className='mb-2'>Daily running total Sticky.IO</h5>
                                                <h4 className='mb-0'>{formatAmount(Number(stickyIoTotalEarning))}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                    }
                </div>
                <div className={classNames('tab-pane fade', { 'show active': activeTab === 'hourly_transaction' || activeTab === 'transactions_count' })}>
                    <div className='row my-3'>
                        <div className='col-md-3 col-12'>
                            <div className='d-flex justify-space-between'>
                                <label className='mb-2'>Date Range</label>
                                <span className='ms-auto d-inline-block'>
                                    <ResetLink className='p-0 text-primary'
                                        isLoad={activeTab === 'hourly_transaction' ? isLoadingHourlyTransaction : isLoadingTransactionsCount}
                                        onClick={handleResetDate}>
                                        Reset
                                    </ResetLink>
                                </span>
                            </div>
                            <DateInput
                                name='date_range'
                                id='date_range'
                                className='form-control mb-3 col-md-4'
                                data-target='#datePicker'
                                readOnly={true}
                                value={lineChartDateInputValue}
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                loading={activeTab === 'hourly_transaction' ? isLoadingHourlyTransaction : isLoadingTransactionsCount}
                            />
                            {showDatePicker &&
                                <div className='card text-right position-absolute collapsed' id='datePicker' style={{ zIndex: 1 }}>
                                    <div className='card-body'>
                                        <DateRangePicker
                                            className='border'
                                            data-toggle='collapse'
                                            scroll={{ enabled: false }}
                                            direction='horizontal'
                                            ranges={[activeTab === 'hourly_transaction' ? filter.hourly_transactions_date_range : filter.transactions_count_date_range]}
                                            onChange={handleDateChange} />
                                    </div>
                                    <div className='card-footer text-end'>
                                        <button className='btn btn-outline-secondary me-2' onClick={() => setShowDatePicker(!showDatePicker)}>Close</button>
                                        <button className='btn btn-outline-primary' onClick={handleDate} >Apply</button>
                                    </div>
                                </div>
                            }
                        </div>
                        <div className='col-md-3'>
                            <label className='mb-2'>Domain</label>
                            {activeTab === 'hourly_transaction' &&
                                <Domain
                                    onDomainChange={handleChange}
                                    websiteStore={websiteStore}
                                    defaultDomain={filter.hourlyTransactionDomain}
                                    loading={isLoadingHourlyTransaction}
                                    multiSelect={false}
                                />
                            }
                            {activeTab === 'transactions_count' &&
                                <Domain
                                    onDomainChange={handleChange}
                                    websiteStore={websiteStore}
                                    defaultDomain={filter.transactionsCountDomain}
                                    loading={isLoadingTransactionsCount}
                                    multiSelect={false}
                                />
                            }
                        </div>
                        <div className='col-md-3 pt-4 mt-2'>
                            <button type='button'
                                className='btn btn-primary'
                                onClick={handleLineChart}
                                disabled={activeTab === 'hourly_transaction' ? isLoadingHourlyTransaction : isLoadingTransactionsCount}>
                                Apply Filter
                            </button>
                        </div>
                    </div>
                    {(activeTab === 'hourly_transaction' ? isLoadingHourlyTransaction : isLoadingTransactionsCount) ?
                        <Loader />
                        :
                        <div className='row mt-4'>
                            <div className='col-lg-12'>
                                {isApiError && <p className='text-danger'>{apiErrorMessage}</p>}
                                <Chart
                                    width='100%'
                                    height='400px'
                                    chartType='LineChart'
                                    loader={<Loader />}
                                    data={activeTab === 'hourly_transaction' ? hourlyTransactionCount : transactionsCount}
                                    options={activeTab === 'hourly_transaction' ? hourlyTransactionOptions : transactionsCountOptions}
                                    legendToggle
                                />
                            </div>
                        </div>
                    }
                </div>
                <div className='tab-content mb-4'>
                    <div className={classNames('tab-pane fade',
                        { 'show active': activeTab === 'universal_transaction_count' })}
                    >
                        {isLoadingUniversalLoginTransactions ?
                            <Loader />
                            :
                            <>
                                <div className='row my-3'>
                                    <div className='col-md-3 col-12'>
                                        <DateRange
                                            title='Date Range'
                                            id='date_range'
                                            name='date_range'
                                            startDate={startDateInLocalString}
                                            endDate={endDateInLocalString}
                                            onDateChange={onDatePickerChange}
                                        // className='bg-dark text-light'
                                        />
                                    </div>
                                    <div className='col-md-3'>
                                        <label className='me-2 mb-2'>Domain</label>
                                        <Domain
                                            onDomainChange={handleChange}
                                            websiteStore={websiteStore}
                                            defaultDomain={universalLoginTransactionsFilter.domain}
                                            loading={isLoading}
                                            multiSelect={false}
                                        />
                                    </div>
                                    <div className='col-md-3 pt-4 mt-2'>
                                        <button type='button'
                                            className='btn btn-primary'
                                            onClick={setUniversalTransactionCount}
                                            disabled={isLoadingUniversalLoginTransactions}>
                                            Apply Filter
                                        </button>
                                    </div>
                                </div>
                                <div className='row mt-4'>
                                    <div className='col-lg-4'>
                                        <div className='card'>
                                            <div className='card-body'>
                                                <h5 className='card-title text-center'>
                                                    Non Universal Users Earnings
                                                </h5>
                                                <h3 className='text-center'>
                                                    ${nonUniversalLoginUsersEarnings.toFixed(2)}
                                                    {
                                                        nonUniversalLoginUsersEarnings > 0 &&
                                                        <small className='ms-2'>({((nonUniversalLoginUsersEarnings * 100) / totalEarnings).toFixed(2)}%)</small>
                                                    }
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='col-lg-4'>
                                        <div className='card'>
                                            <div className='card-body'>
                                                <h5 className='card-title text-center'>
                                                    Universal Users Earnings
                                                </h5>
                                                <h3 className='text-center'>
                                                    ${universalLoginUsersEarnings.toFixed(2)}
                                                    {
                                                        universalLoginUsersEarnings > 0 &&
                                                        <small className='ms-2'>({((universalLoginUsersEarnings * 100) / totalEarnings).toFixed(2)}%)</small>
                                                    }
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='col-lg-4'>
                                        <div className='card'>
                                            <div className='card-body'>
                                                <h5 className='card-title text-center'>
                                                    Total Earnings
                                                </h5>
                                                <h3 className='text-center'>
                                                    ${totalEarnings.toFixed(2)}
                                                    {
                                                        totalEarnings > 0 &&
                                                        <small className='ms-2'>({((totalEarnings * 100) / totalEarnings).toFixed(2)}%)</small>
                                                    }
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='row mt-4'>
                                    <div className='col-lg-12'>
                                        {isApiError && <p className='text-danger'>{apiErrorMessage}</p>}
                                        <Chart
                                            width='100%'
                                            height='400px'
                                            chartType='ColumnChart'
                                            loader={<Loader />}
                                            data={universalLoginTransactionCounts}
                                            options={countChartOptions}
                                            legendToggle
                                        />
                                    </div>
                                </div>
                            </>
                        }
                    </div>
                </div>
            </div>
        </>
    </Container>
}

export default observer(DashboardPage)
