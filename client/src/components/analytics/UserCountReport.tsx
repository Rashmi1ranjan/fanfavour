import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import { Cell } from './../table/Definations'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import moment from 'moment'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

const TableCellCount: React.FC<Cell> = (props) => {
    const count: string | number = props.value || 0
    return (count)
}

const TableCellDate: React.FC<Cell> = (props) => {
    const date: string = moment(props.value).format('DD-MM-YYYY')
    return (date)
}

const TableCellAmount: React.FC<Cell> = (props) => {
    const amount: any = `$${props.value}`
    return (amount)
}

const UserCountReport: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, UserCountAnalyticsStore } = rootStore
    const { setUserCountAnalytics, clearData, isLoading, userCountDetail, totalPage, currentPage, totalRows, limit, filter } = UserCountAnalyticsStore
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDate, setStartDate] = useState<Date | undefined>(new Date())
    const [endDate, setEndDate] = useState<Date | undefined>(new Date())
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')

    const changePage = (pageNUM: number) => {
        setUserCountAnalytics(pageNUM)
    }

    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })

    useEffect(() => {
        clearData()
        setUserCountAnalytics(1)
        setInitialDates()
    }, [clearData, setUserCountAnalytics])

    const setInitialDates = () => {
        const yesterdayDate = moment().subtract(1, 'days').format('MM/DD/YYYY')

        setStartDate(new Date(yesterdayDate))
        setEndDate(new Date(yesterdayDate))

        setStartDateInLocalString(yesterdayDate)
        setEndDateInLocalString(yesterdayDate)
        filter.start_date = yesterdayDate
        filter.end_date = yesterdayDate
    }

    const handleDomainChange = (selectedOption: OptionType, e: any) => {
        const name = e.name

        if (name === 'domain') {
            filter.domain = selectedOption.value
        }
        setUserCountAnalytics(1)
    }

    const openCloseDatePicker = () => {
        setShowDatePicker(!showDatePicker)
    }

    const handleChange = (ranges: RangeKeyDict) => {
        setRange(ranges['selection'])
    }

    const handleOnClick = () => {
        setStartDate(range.startDate)
        setEndDate(range.endDate)
        const startDate = moment(range.startDate).format('MM/DD/YYYY')
        const endDate = moment(range.endDate).format('MM/DD/YYYY')
        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        filter.start_date = startDate
        filter.end_date = endDate
        openCloseDatePicker()
        setUserCountAnalytics(1)
    }

    const handleSubmit = () => {
        if (startDate === undefined || endDate === undefined) {
            alert('Please select date')
        } else {
            setUserCountAnalytics(1)
        }
    }


    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <form>
            <div className='row'>
                <div className='col-3'>
                    <label>Date Range</label>
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
                                        onChange={handleChange}
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
                <div className='col-3'>
                    <label>Domain</label>
                    <Domain
                        onDomainChange={handleDomainChange}
                        websiteStore={websiteStore}
                        loading={isLoading}
                        defaultDomain={filter.domain}
                        multiSelect={false}
                    />
                </div>
            </div>
        </form>
        <div className="card mt-4">
            <div className="card-header">
                {isLoading ? 'Loading...' : 'Analytics: User count'}
            </div>
            <div className="card-body">
                {isLoading ?
                    'Loading..'
                    :
                    <>
                        <div className='table-responsive mt-3'>
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'website.website_id', title: 'Id' },
                                    { name: 'domain', title: 'Website' },
                                    { name: 'date', title: 'Date', component: TableCellDate },
                                    { name: 'registration', title: 'Registration', component: TableCellCount },
                                    { name: 'subscription', title: 'Subscription', component: TableCellCount },
                                    { name: 'cancellation', title: 'Cancellation', component: TableCellCount }
                                ]}
                                data={userCountDetail}
                            ></Table>
                        </div>
                        {
                            userCountDetail.length > 0 ?
                                <Pagination
                                    totalPages={totalPage}
                                    currentPage={currentPage}
                                    totalItems={totalRows}
                                    itemsPerPage={limit}
                                    onItemClick={changePage}
                                ></Pagination>
                                : null
                        }
                    </>
                }
            </div>
        </div>
    </Container >
}

export default observer(UserCountReport)
