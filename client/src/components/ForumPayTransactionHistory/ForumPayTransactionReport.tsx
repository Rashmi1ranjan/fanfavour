import React, { useState, useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import styled from 'styled-components'
import { ActionMeta, ValueType } from 'react-select/src/types'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import Table from '../table/Table'
import moment from 'moment'
import { toJS } from 'mobx'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const Loader = styled.div`
    position: absolute
    top: 0
    bottom: 0
    left: 0
    right: 0
    z-index: 9
    display: flex
    justify-content: center
    align-items: center
    background: rgba(255,255,255,0.8)
`
const ForumPayTransactionReports: React.FC<Props> = ({ rootStore }) => {
    const { ForumPayTransactionReportStore, websiteStore } = rootStore
    const { getForumPayTransactionReportList, forumpayTransactionList, filter, limit, totalPage, currentPage, totalRows, isLoading } = ForumPayTransactionReportStore

    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')

    useEffect(() => {
        getForumPayTransactionReportList(1)
    }, [getForumPayTransactionReportList])

    const changePage = (pageNum: number) => {
        getForumPayTransactionReportList(pageNum)
    }

    const filterRecords = () => {
        getForumPayTransactionReportList(1)
    }

    const limitOptions = [
        { label: 20, value: 20 },
        { label: 50, value: 50 },
        { label: 100, value: 100 },
        { label: 200, value: 200 },
        { label: 1000, value: 1000 }
    ]

    const selectedLimitOption = limitOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')
        if (name === 'domain') {
            filter.website_url = selectedValue
        }
    }

    const transactionTypeOptions = [
        { label: 'All', value: 'all' },
        { label: 'TIPS', value: 'tip' },
        { label: 'SUBSCRIPTION', value: 'subscription' },
        { label: 'CHAT', value: 'chat_unlock' },
        { label: 'REBILL', value: 'rebill' },
        { label: 'EXCLUSIVE CONTENT', value: 'feed_unlock' },
        { label: 'PAY PER MESSAGE', value: 'pay_per_message' }
    ]

    const selectedTransactionType = transactionTypeOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value.trim()

        _.set(filter, name, value)
    }

    const TableCellTransactionDate = (data: { value: string }) => {
        const timeAgo = moment(data.value).fromNow()
        const dateFormat = moment(data.value).format('MM/DD/YYYY')
        const timeToShow = `${dateFormat} (${timeAgo})`
        return (timeToShow)
    }

    const TableCellTransactionType = (dataObject: { data: { transaction_type: string, pcp_transaction_type: string } }) => {
        const data = dataObject.data
        const jsonData = toJS(data)
        const transaction_type = _.get(jsonData, 'transaction_type', '')
        if (transaction_type === 'REBILL') {
            jsonData.pcp_transaction_type = 'rebill'
        }
        const pcp_transaction_type = getTransactionType(_.get(jsonData, 'pcp_transaction_type', ''))
        return <> {pcp_transaction_type}</>
    }

    const getTransactionType = (type: string) => {
        switch (type) {
        case 'add_fund':
            return 'Add Fund'
        case 'subscription':
            return 'Subscription'
        case 'feed_unlock':
            return 'Exclusive Content'
        case 'chat_unlock':
            return 'Message Unlock'
        case 'tip':
            return 'Tips'
        case 'rebill':
            return 'Rebill'
        case 'pay_per_message':
            return 'Pay Per Message'
        default:
            break
        }
    }

    const TableCellAmount = (dataObject: { data: { amount: string } }) => {
        const data = dataObject.data
        const amount = Number(data.amount)
        return <div>${amount.toFixed(2)}</div>
    }

    const handleDatePicker = (ranges: RangeKeyDict) => {
        setRange(ranges['selection'])
    }

    const handleClick = () => {
        const startDate = moment(range.startDate).format('MM/DD/YYYY')
        const endDate = moment(range.endDate).format('MM/DD/YYYY')
        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        filter.start_date = startDate
        filter.end_date = endDate
        setShowDatePicker(!showDatePicker)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4>
            Wallet Transaction Report
        </h4>
        <div className='card mt-4'>
            <div className='card-body'>
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
                            {showDatePicker &&
                                (
                                    <div className='card text-right position-absolute collapsed' id='datePicker' style={{ zIndex: 1 }}>
                                        <div className='card-body'>
                                            <DateRangePicker
                                                className='border'
                                                data-toggle='collapse'
                                                scroll={{ enabled: false }}
                                                direction='horizontal'
                                                ranges={[range]}
                                                onChange={handleDatePicker}
                                            />
                                        </div>
                                        <div className='card-footer text-end'>
                                            <button className='btn btn-outline-secondary me-2'
                                                onClick={() => setShowDatePicker(!showDatePicker)}
                                            >Close</button>
                                            <button className='btn btn-outline-primary' onClick={handleClick} >Apply</button>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Website</label>
                            <Domain
                                onDomainChange={handleChange}
                                websiteStore={websiteStore}
                                loading={isLoading}
                                defaultDomain={filter.website_url}
                                multiSelect={false}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Records Limit</label>
                            <select
                                className='form-control form-select'
                                id='limit'
                                name='limit'
                                value={filter.limit}
                                onChange={onChange}
                            >{selectedLimitOption}</select>
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>PCP Transaction Id</label>
                            <input
                                className='form-control'
                                id='pcp_transaction_id'
                                name='pcp_transaction_id'
                                value={filter.pcp_transaction_id}
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3 mt-4'>
                            <label className='me-2 mb-2'>PCP Transaction Type</label>
                            <select
                                className='form-control form-select'
                                id='pcp_transaction_type'
                                name='pcp_transaction_type'
                                value={filter.pcp_transaction_type}
                                onChange={onChange}
                            >{selectedTransactionType}</select>
                        </div>
                        <div className='col-md-3 mt-4'>
                            <label className='me-2 mb-2'>Email</label>
                            <input
                                name='email'
                                id='email'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3 mt-4'>
                            <label className='me-2 mb-2'>Transaction Id</label>
                            <input
                                name='transaction_id'
                                id='transaction_id'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3 mt-4'>
                            <label className='me-2 mb-2'>User Id</label>
                            <input
                                name='user_id'
                                id='user_id'
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
        <div className='mt-4'>
            <div className='table-responsive mt-3'>
                <Table
                    unique_key='_id'
                    columns={[
                        { name: 'website_url', title: 'website' },
                        { name: 'transaction_id', title: 'Transaction Id' },
                        { name: 'amount', title: 'Amount', component: TableCellAmount },
                        { name: 'email', title: 'Email' },
                        { name: 'transaction_date', title: 'Transaction Date', component: TableCellTransactionDate },
                        { name: 'pcp_transaction_type', title: 'PCP Transaction Type', component: TableCellTransactionType },
                        { name: 'pcp_user_id', title: 'PCP User Id' },
                        { name: 'pcp_transaction_id', title: 'PCP Transaction Id' }
                    ]}
                    data={forumpayTransactionList}
                    isLoading={isLoading}
                ></Table>
            </div>
            {totalRows > 0 &&
                <Pagination
                    totalPages={totalPage}
                    currentPage={currentPage}
                    totalItems={totalRows}
                    itemsPerPage={limit}
                    onItemClick={changePage}
                ></Pagination>
            }
        </div>
    </Container>
}

export default observer(ForumPayTransactionReports)
