import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import { ActionMeta, ValueType } from 'react-select/src/types'
import moment from 'moment'
import { Cell } from './../table/Definations'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import styled from 'styled-components'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const Loader = styled.div`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 9;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(255,255,255,0.8);
`

const ChargebackBlockUserLogs: React.FC<Props> = ({ rootStore }) => {
    const { ChargebackBlockUserLogStore, websiteStore } = rootStore
    const { getChargebackBlockUserLogList, chargebackBlockUserLogData, filter, currentPage, totalPage, limit, totalRows, isLoading } = ChargebackBlockUserLogStore
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })
    useEffect(() => {
        getChargebackBlockUserLogList(1)
    }, [getChargebackBlockUserLogList])

    const changePage = (pageNum: number) => {
        getChargebackBlockUserLogList(pageNum)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value

        if (name === 'limit') {
            filter.limit = parseInt(value)
        } else if (name === 'user_id') {
            filter.user_id = value
        } else if (name === 'email') {
            filter.email = value
        } else if (name === 'subscription_id') {
            filter.subscription_id = value
        }
    }

    const limitOptions = [
        { label: '50', value: 50 },
        { label: '100', value: 100 },
        { label: '200', value: 200 },
        { label: '1000', value: 1000 }
    ]

    const selectLimitOptions = limitOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.value}
        </option>
    ))

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')
        if (name === 'domain') {
            filter.domain = selectedValue
        }
    }

    const TableCellTimeAgo : React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const timeToShow = `${data.value} (${timeAgo})`
        return (timeToShow)
    }

    const handleDatePickerChange = (ranges: RangeKeyDict) => {
        setRange(ranges['selection'])
    }

    const handleOnClick = () => {
        const startDate = moment(range.startDate).format('MM/DD/YYYY')
        const endDate = moment(range.endDate).format('MM/DD/YYYY')
        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        filter.start_date = startDate
        filter.end_date = endDate
        setShowDatePicker(!showDatePicker)
    }

    const filterRecords = () => {
        getChargebackBlockUserLogList(1)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='card'>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <form>
                            <div className='row'>
                                <div className='col-md-3'>
                                    <label className='me-2 mb-2'>Date Range</label>
                                    <input
                                        name='date_range'
                                        id='date_range'
                                        className='form-control'
                                        data-target='#datePicker'
                                        readOnly={true}
                                        value={startDateInLocalString + ' - ' + endDateInLocalString}
                                        onClick={() => setShowDatePicker(!showDatePicker)}
                                        style={{ backgroundColor: '#fff' }}
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
                                                        onChange={handleDatePickerChange} />
                                                </div>
                                                <div className='card-footer text-end'>
                                                    <button className='btn btn-outline-secondary me-2'
                                                        onClick={() => setShowDatePicker(!showDatePicker)}
                                                    >Close</button>
                                                    <button className='btn btn-outline-primary' onClick={handleOnClick} >Apply</button>
                                                </div>
                                            </div>
                                        )
                                        : null
                                    }
                                </div>
                                <div className='col-md-3'>
                                    <label className='me-2 mb-2'>Records Limit</label>
                                    <select
                                        className='form-control form-select'
                                        id='limit'
                                        name='limit'
                                        value={filter.limit}
                                        onChange={onChange}>
                                        {selectLimitOptions}
                                    </select>
                                </div>
                                <div className='col-md-3'>
                                    <label className="me-2 mb-2">Domain</label>
                                    <Domain
                                        onDomainChange={handleChange}
                                        websiteStore={websiteStore}
                                        loading={isLoading}
                                        defaultDomain={filter.domain}
                                        multiSelect={false}
                                    />
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>User Id</label>
                                    <input
                                        name='user_id'
                                        type='text'
                                        className='form-control'
                                        onChange={onChange}
                                    />
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>Email</label>
                                    <input
                                        name='email'
                                        type='text'
                                        className='form-control'
                                        onChange={onChange}
                                    />
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>Subscription Id</label>
                                    <input
                                        name='subscription_id'
                                        type='text'
                                        className='form-control'
                                        onChange={onChange}
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
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div className='card mt-4'>
            <div className='card-header'>Blocked Users From Chargeback</div>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <div className='table-responsive mt-3'>
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'domain', title: 'Domain' },
                                    { name: 'user_id', title: 'User Id' },
                                    { name: 'email', title: 'Email' },
                                    { name: 'subscription_id', title: 'Subscription Id' },
                                    { name: 'chargeback_reason', title: 'Chargeback Reason' },
                                    { name: 'chargeback_date', title: 'Chargeback Date', component: TableCellTimeAgo },
                                    { name: 'createdAt', title: 'DATE', component: TableCellTimeAgo }
                                ]}
                                data={chargebackBlockUserLogData}
                                isLoading={isLoading}
                            ></Table>
                        </div>
                        <Pagination
                            totalPages={totalPage}
                            currentPage={currentPage}
                            totalItems={totalRows}
                            itemsPerPage={limit}
                            onItemClick={changePage}
                        ></Pagination>
                    </div>
                </div>
            </div>
        </div>
    </Container>

}

export default observer(ChargebackBlockUserLogs)
