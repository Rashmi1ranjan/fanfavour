import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { Chart } from 'react-google-charts'
import _ from 'lodash'
import { ValueType } from 'react-select/src/types'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import moment from 'moment'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import Table from '../table/Table'
import classNames from 'classnames'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Badge from './../utils/Badge'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const EarningDashboard: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, EarningDashboardStore, authStore } = rootStore
    const {
        filter,
        setDashboardEarningData,
        earningData,
        isLoading,
        isLoadingChart,
        earningRows,
        setDashboardEarningReport,
        earningReportDate,
        getLastTransactionReportDate,
        transactionCountData
    } = EarningDashboardStore
    const { theme, bgColor, fontColor } = authStore
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const [activeTab, setActiveTab] = useState('showTable')
    const [selectedDate, setSelectedDate] = useState(new Date())

    useEffect(() => {
        // Do nothing
    }, [theme])

    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })

    useEffect(() => {
        initData()
    }, [setDashboardEarningData, getLastTransactionReportDate])

    useEffect(() => {
        setSelectedDate(new Date(`${earningReportDate} UTC`))
    }, [earningReportDate])

    const initData = async () => {
        await getLastTransactionReportDate()
        if (isDataLoading) {
            setInitialDates()
            if (activeTab === 'showChart') {
                setDashboardEarningData()
            } else if (activeTab === 'showTable') {
                setDashboardEarningReport(selectedDate, true)
            }
            setIsDataLoading(false)
        }
    }

    const setInitialDates = () => {
        const startDate = moment().subtract(7, 'days').format('MM/DD/YYYY')
        const endDate = moment().subtract(1, 'days').format('MM/DD/YYYY')

        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        filter.start_date = startDate
        filter.end_date = endDate
    }

    const openCloseDatePicker = () => {
        setShowDatePicker(!showDatePicker)
    }

    const onDatePickerChange = (ranges: RangeKeyDict) => {
        setRange(ranges['selection'])
    }

    const handleOnClick = () => {
        const startDate = moment(range.startDate).format('MM/DD/YYYY')
        const endDate = moment(range.endDate).format('MM/DD/YYYY')
        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        filter.start_date = startDate
        filter.end_date = endDate
        openCloseDatePicker()
    }

    const handleChange = (value: ValueType<OptionType, IsMulti>) => {
        const selectedValue = _.get(value, 'value', '')
        filter.domain = selectedValue
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value

        if (name === 'payment_gateway') {
            filter.payment_gateway = value
        }
    }

    const Loader = () => {
        return <div className='text-center'>
            <div className='spinner-border' role='status' style={{ color: '#c6c6c6' }}>
                <span className='sr-only'>Loading...</span>
            </div>
        </div>
    }

    const filterRecords = () => {
        if (activeTab === 'showChart') {
            setDashboardEarningData()
        } else if (activeTab === 'showTable') {
            setDashboardEarningReport(selectedDate, false)
            setSelectedDate(new Date(`${selectedDate}`))
        }
    }

    const handleDateChange = (date: Date) => {
        setSelectedDate(date)
    }
    const amountChartOptions = {
        hAxis: {
            title: 'Date',
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
        series: {
            0: { color: '#00bb00' },
            1: { color: '#FFA500' },
            2: { color: '#FFD300' },
            3: { color: '#bb0000' }
        },
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

    const countChartOptions = {
        hAxis: {
            title: 'Date',
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        vAxis: {
            title: 'No. of Transaction',
            viewWindowMode: 'explicit',
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        focusTarget: 'category',
        colors: ['#00bb00', '#FFA500', '#FFD300', '#bb0000'],
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

    const paymentGateway = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const paymentGateway = _.get(jsonData, 'payment_gateway.payment_gateway', '')
        let payment_gateway_color = ''
        let title = paymentGateway

        if (paymentGateway === 'sticky.io') {
            title = `${paymentGateway}/${jsonData.payment_gateway.sticky_io_payment_gateway}`
        }

        if (paymentGateway === 'Total') {
            return <span style={{ fontWeight: 'bold' }}>{paymentGateway}</span>
        }
        if (paymentGateway !== 'Total') {
            payment_gateway_color = paymentGatewayBadgeColor(title)
        }
        return <span style={{ fontSize: '18px' }}>
            <Badge title={title} bgColorClass={payment_gateway_color} />
        </span>
    }

    const paymentGatewayBadgeColor = (payment_gateway: string) => {
        switch (payment_gateway) {
        case 'sticky.io/ecsuite':
            return 'text-bg-primary'
        case 'sticky.io/spoton':
            return 'text-bg-success'
        case 'forumpay':
            return 'text-bg-warning'
        default:
            return 'text-bg-secondary'
        }
    }

    const amountData = (objData: object, amount_key: string, percentage_key = '') => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const paymentGateway = _.get(jsonData, 'payment_gateway.payment_gateway', '')

        const amount = _.get(jsonData, amount_key, '$0')
        const percentage = _.get(jsonData, percentage_key, '0')
        if (paymentGateway === 'Total') {
            return <span style={{ fontWeight: 'bold' }}>{amount}</span>
        }
        return <>{amount} {(percentage_key !== '') && (`(${percentage})`)}</>
    }

    const newTransactionAmount = (objData: object) => {
        return amountData(objData, 'new_transaction', 'percentage')
    }

    const refundAmount = (objData: object) => {
        return amountData(objData, 'refund')
    }

    const voidAmount = (objData: object) => {
        return amountData(objData, 'void')
    }

    const chargeBackAmount = (objData: object) => {
        return amountData(objData, 'chargeback')
    }

    const netProfitData = (objData: object) => {
        return amountData(objData, 'netProfit', 'netProfitPercentage')
    }

    const paymentGatewayChargeData = (objData: object) => {
        return amountData(objData, 'payment_gateway_charge')
    }

    const revenueCollectedData = (objData: object) => {
        return amountData(objData, 'revenue_collected')
    }

    const modelEarningData = (objData: object) => {
        return amountData(objData, 'model_earning')
    }

    const stickyIoTransactionCostData = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const paymentGateway = _.get(jsonData, 'payment_gateway.payment_gateway', '')

        const amount = _.get(jsonData, 'sticky_io_transaction_cost', '$0')
        const percentage = _.get(jsonData, 'stickyIoPercentage', '0')
        if (paymentGateway === 'Total') {
            return <span style={{ fontWeight: 'bold' }}>{amount} ({percentage})</span>
        }
        return <>{amount} ({percentage})</>
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className="mt-2 mb-3">Earning Dashboard</h4>
        <div className='btn-group'>
            <button type='button'
                className={classNames('btn', { 'btn-primary': activeTab === 'showTable', 'btn-outline-primary': activeTab !== 'showTable' })}
                onClick={() => {
                    setActiveTab('showTable')
                    setDashboardEarningReport(selectedDate, true)
                }}
            >Show As Table</button>
            <button type='button'
                className={classNames('btn', { 'btn-primary': activeTab === 'showChart', 'btn-outline-primary': activeTab !== 'showChart' })}
                onClick={() => {
                    setActiveTab('showChart')
                    setDashboardEarningData()
                }}
            >Show As Chart</button>
        </div>
        <div className='row'>
            {activeTab === 'showChart' ?
                <div className='col-3'>
                    <label className='me-2 mb-2 mt-2'>Date Range</label>
                    <input
                        name='date_range'
                        id='date_range'
                        className='form-control'
                        data-target='#datePicker'
                        readOnly={true}
                        value={startDateInLocalString + ' - ' + endDateInLocalString}
                        onClick={openCloseDatePicker}
                    />
                    {showDatePicker ?
                        (
                            <div className='card text-right position-absolute collapsed' id='datePicker' style={{ zIndex: 1 }}>
                                <div className='card-body'>
                                    <DateRangePicker
                                        className='border'
                                        data-toggle='collapse'
                                        scroll={{ enabled: false }}
                                        direction='horizontal'
                                        ranges={[range]}
                                        onChange={onDatePickerChange}
                                    />

                                </div>
                                <div className='card-footer text-end'>
                                    <button className='btn btn-outline-secondary me-2' onClick={openCloseDatePicker}>Close</button>
                                    <button className='btn btn-outline-primary' onClick={handleOnClick} >Apply</button>
                                </div>
                            </div>
                        )
                        : null
                    }
                </div>
                : <div className='col-md-3 mt-2'>
                    <label className='me-2 mb-2'>Date</label><br />
                    <DatePicker
                        selected={selectedDate}
                        className='form-control form-select'
                        onChange={handleDateChange}
                    />
                </div>
            }
            <div className='col-md-3 mt-2'>
                <label className='me-2 mb-2'>Domain</label>
                <Domain
                    onDomainChange={handleChange}
                    websiteStore={websiteStore}
                    loading={isLoading}
                    defaultDomain={filter.domain}
                    multiSelect={false}
                />
            </div>
            {activeTab === 'showChart' &&
                <div className='col-md-3 mt-3' style={{ paddingRight: 0 }}>
                    <label className='me-2 mb-2'>Payment Gateway</label>
                    <div>
                        <div className="form-check form-check-inline">
                            <input className="form-check-input" type="radio" name="payment_gateway" id="payment_gateway_all" value="" defaultChecked={filter.payment_gateway === ''} onChange={onChange} />
                            <label className="form-check-label" htmlFor="payment_gateway_all">All</label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input className="form-check-input" type="radio" name="payment_gateway" id="ccbill" value="ccbill" onChange={onChange} defaultChecked={filter.payment_gateway === 'ccbill'} />
                            <label className="form-check-label" htmlFor="ccbill">CCBill</label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input className="form-check-input" type="radio" name="payment_gateway" id="sticky.io" value="sticky.io" onChange={onChange} defaultChecked={filter.payment_gateway === 'sticky.io'} />
                            <label className="form-check-label" htmlFor="sticky.io">Sticky.io</label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input className="form-check-input" type="radio" name="payment_gateway" id="forumpay" value="forumpay" onChange={onChange} defaultChecked={filter.payment_gateway === 'forumpay'} />
                            <label className="form-check-label" htmlFor="forumpay">ForumPay</label>
                        </div>
                    </div>
                </div>
            }
            <div className='col-md-3 mt-2'>
                <button type="button"
                    className="btn btn-primary mt-4"
                    onClick={filterRecords}
                    disabled={isLoadingChart}>
                    {isLoadingChart === true &&
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                    Apply Filter</button>
            </div>
        </div>
        <div className='row mt-3'>
            <div className='col-12'>
                {activeTab === 'showChart' &&
                    <div className="px-0">
                        {isLoadingChart ? <Loader />
                            : <>
                                <h4>Earnings</h4>
                                <Chart
                                    width='100%'
                                    height='400px'
                                    chartType="LineChart"
                                    loader={<Loader />}
                                    data={earningData}
                                    options={amountChartOptions}
                                    legendToggle
                                />
                                <h4>Transactions counts</h4>
                                <Chart
                                    width='100%'
                                    height='400px'
                                    chartType='ColumnChart'
                                    loader={<Loader />}
                                    data={transactionCountData}
                                    options={countChartOptions}
                                    legendToggle
                                />
                            </>
                        }
                    </div>
                }
                {activeTab === 'showTable' &&
                    <>
                        {
                            isLoading ? <Loader /> :
                                <div className='table-responsive mt-3' >
                                    <Table
                                        unique_key='_id'
                                        columns={[
                                            { name: 'Info', title: 'Payment Gateway', component: paymentGateway },
                                            { name: 'date', title: 'Date' },
                                            { name: 'new_transaction', title: 'Gross', component: newTransactionAmount },
                                            { name: 'refund', title: 'Refund', component: refundAmount },
                                            { name: 'void', title: 'Void', component: voidAmount },
                                            { name: 'chargeback', title: 'Chargeback', component: chargeBackAmount },
                                            { name: 'netProfit', title: 'Net Revenue', component: netProfitData },
                                            { name: 'payment_gateway_charge', title: 'Gateway Fees', component: paymentGatewayChargeData },
                                            { name: 'sticky_io_transaction_cost', title: 'Sticky.io Fees', component: stickyIoTransactionCostData },
                                            { name: 'revenue_collected', title: 'Profit', component: revenueCollectedData },
                                            { name: 'model_earning', title: 'Model Earning', component: modelEarningData }
                                        ]}
                                        data={earningRows}
                                    ></Table>
                                </div>
                        }
                    </>
                }
            </div>
        </div>
    </Container >
}
export default observer(EarningDashboard)
