import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { Chart } from 'react-google-charts'
import _ from 'lodash'
import Select from 'react-select'
import { ActionMeta, ValueType } from 'react-select/src/types'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import moment from 'moment'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const HybridTransactionCountLogs: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, HybridTransactionStore } = rootStore
    const { filter, setTransactionCountData, transactionCountData, isLoading, transactionAmountData } = HybridTransactionStore
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')

    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })

    useEffect(() => {
        if (isDataLoading) {
            setInitialDates()
            setTransactionCountData()
            setIsDataLoading(false)
        }
    }, [setTransactionCountData])

    const setInitialDates = () => {
        const startDate = moment().subtract(7, 'days').format('MM/DD/YYYY')
        const endDate = moment().format('MM/DD/YYYY')

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

    const Loader = () => {
        return <div className='text-center'>
            <div className='spinner-border' role='status' style={{ color: '#c6c6c6' }}>
                <span className='sr-only'>Loading...</span>
            </div>
        </div>
    }

    const filterRecords = () => {
        setTransactionCountData()
    }

    const countChartOptions = {
        hAxis: {
            title: 'Date'
        },
        vAxis: {
            title: 'Counts',
            viewWindowMode: 'explicit'
        },
        series: {
            0: { curveType: 'function', color: '#00bb00' },
            1: { curveType: 'function', color: '#FFA500' },
            2: { curveType: 'function', color: '#bb0000' },
            3: { curveType: 'function', color: '#FF0000' }
        },
        legend: {
            position: 'top',
            alignment: 'center',
            maxLines: 4
        },
        pointSize: 5
    }

    const amountChartOptions = {
        hAxis: {
            title: 'Date'
        },
        vAxis: {
            title: 'Amounts ($)',
            viewWindowMode: 'explicit'
        },
        series: {
            0: { curveType: 'function', color: '#00bb00' },
            1: { curveType: 'function', color: '#FFA500' },
            2: { curveType: 'function', color: '#bb0000' }
        },
        legend: {
            position: 'top',
            alignment: 'center',
            maxLines: 4
        },
        pointSize: 5
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className='mt-2 mb-3'>Hybrid Transaction Logs</h4>
        <div className='row'>
            <div className='col-3'>
                <label className='me-2 mb-2'>Date Range</label>
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
            <div className='col-md-3'>
                <label className='me-2 mb-2'>Domain</label>
                <Domain
                    onDomainChange={handleChange}
                    websiteStore={websiteStore}
                    loading={isLoading}
                    defaultDomain={filter.domain}
                    multiSelect={false}
                />
            </div>
            <div className='col-md-3 mt-2'>
                <button type='button'
                    className='btn btn-primary mt-4'
                    onClick={filterRecords}
                    disabled={isLoading}>
                    {isLoading === true &&
                        <span className='spinner-border spinner-border-sm me-1' role='status' aria-hidden='true'></span>}
                    Apply Filter</button>
            </div>
        </div>
        <div className='row mt-3'>
            <div className='col-12'>
                <h5 className='mt-2 mb-3'>Transaction Counts</h5>
                <div className='card'>
                    <div className='card-body px-0'>
                        {
                            isLoading ? <Loader /> : <Chart
                                width='100%'
                                height='400px'
                                chartType='LineChart'
                                loader={<Loader />}
                                data={transactionCountData}
                                options={countChartOptions}
                            />}
                    </div>
                </div>
            </div>
            <div className='col-12'>
                <h5 className='my-3'>Transaction Amounts</h5>
                <div className='card'>
                    <div className='card-body px-0'>
                        {
                            isLoading ? <Loader /> : <Chart
                                width='100%'
                                height='400px'
                                chartType='LineChart'
                                loader={<Loader />}
                                data={transactionAmountData}
                                options={amountChartOptions}
                            />}
                    </div>
                </div>
            </div>
        </div>
    </Container >
}
export default observer(HybridTransactionCountLogs)
