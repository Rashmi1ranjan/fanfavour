import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import Table from '../table/Table'
import Select from 'react-select'
import { ActionMeta, ValueType } from 'react-select/src/types'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { Cell } from './../table/Definations'
import moment from 'moment'
import { DateRangePicker, RangeKeyDict, Range } from 'react-date-range'
import styled from 'styled-components'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

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

const CCBillTransactionReports: React.FC<Props> = ({ rootStore }) => {
    const { CCBillTransactionReportsStore, websiteStore } = rootStore
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const { transactionReportList, totalPage, isLoading, currentPage, totalRows, getTransactionReports, filter } = CCBillTransactionReportsStore
    const { allWebsitesOptions } = websiteStore
    const [selectedWebsite, setSelectedWebsite] = useState<string>('')

    const changePage = (pageNUM: number) => {
        getTransactionReports(pageNUM, filter)
    }

    useEffect(() => {
        getTransactionReports(1, filter)
    }, [getTransactionReports])

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value
        if (name === 'email') {
            filter.email = value.trim().toLowerCase()
        }
        if (name === 'subscription_id') {
            filter.subscription_id = value.trim()
        }
    }

    const onTransactionTypeChange = (value: ValueType<OptionType, true>, actions: any) => {
        const countries = []
        if (value) {
            for (const country of value) {
                countries.push(country.value)
            }
        }
        filter.transaction_type = countries
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const formattedTime = moment.utc(data.value).format('YYYY-MM-DD HH:mm:ss')
        const timeToShow = `${formattedTime} (${timeAgo})`
        return (timeToShow)
    }

    const TableCellUserInfo = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return (<>{jsonData.first_name} {jsonData.last_name}<br />{jsonData.email_address}</>)
    }

    const AmountTableCell = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return <>${parseFloat(jsonData.accounting_amount).toFixed(2)}</>
    }

    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })

    const handleOnClick = () => {
        const startDate = moment(range.startDate).format('MM/DD/YYYY')
        const endDate = moment(range.endDate).format('MM/DD/YYYY')
        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        filter.start_date = startDate
        filter.end_date = endDate
        openCloseDatePicker()
    }

    const openCloseDatePicker = () => {
        setShowDatePicker(!showDatePicker)
    }

    const handleDatePickerChange = (ranges: RangeKeyDict) => {
        setRange(ranges['selection'])
    }

    const transactionTypeOptions = [
        { label: 'NEW', value: 'NEW' },
        { label: 'REBILL', value: 'REBILL' },
        { label: 'REFUND', value: 'REFUND' },
        { label: 'VOID', value: 'VOID' },
        { label: 'CHARGEBACK', value: 'CHARGEBACK' }
    ]

    const handleChange = (value: ValueType<OptionType, false>, action: ActionMeta<OptionType>) => {
        const selectedValue = _.get(value, 'value', '')
        if (selectedValue === '') {
            filter.domain_sub_account_array = []
        } else {
            const domainData = allWebsitesOptions.filter(website => website.website_url === selectedValue)
            filter.domain_sub_account_array = [domainData[0].subscription_sub_account, domainData[0].shop_sub_account, domainData[0].tip_sub_account]
        }
        setSelectedWebsite(selectedValue)
    }

    const onClickFilter = () => {
        const emailFormat = new RegExp('^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$')
        if (filter.email !== '' && !filter.email.match(emailFormat)) {
            return alert('Please enter valid email.')
        }
        const ac = new RegExp('^[0-9]{19}$')
        if (filter.subscription_id !== '' && !filter.subscription_id.match(ac)) {
            return alert('Please enter valid subscription id.')
        }
        getTransactionReports(1, filter)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className='card-title'>CCBill Transactions</h4>
        <div className='card'>
            <div className='card-body'>
                <form>
                    <div className='row'>
                        <div className='col-md-3'>
                            <label>Date Range</label>
                            <input
                                name='date_range'
                                id='date_range'
                                className='form-control'
                                data-target='#datePicker'
                                readOnly={true}
                                value={startDateInLocalString + ' - ' + endDateInLocalString}
                                onClick={openCloseDatePicker}
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
                                            <button className='btn btn-outline-secondary me-2' onClick={openCloseDatePicker}>Close</button>
                                            <button className='btn btn-outline-primary' onClick={handleOnClick} >Apply</button>
                                        </div>
                                    </div>
                                )
                                : null
                            }
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2'>Domain</label>
                            <Domain
                                onDomainChange={handleChange}
                                websiteStore={websiteStore}
                                loading={isLoading}
                                defaultDomain={selectedWebsite}
                                multiSelect={false}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2'>Transaction Type</label>
                            <Select
                                id='transaction_type'
                                name='transaction_type'
                                onChange={onTransactionTypeChange}
                                options={transactionTypeOptions}
                                isMulti
                            >
                            </Select>
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2'>Email</label>
                            <input
                                name='email'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2'>Subscription Id</label>
                            <input
                                name='subscription_id'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3'>
                            <button type='button' className='btn btn-primary mt-4' disabled={isLoading} onClick={onClickFilter}>
                                {isLoading === true && <span className='spinner-border spinner-border-sm me-1'></span>} Apply Filter
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <div className='py-3'>
            <div className='table-responsive'>
                <Table
                    unique_key='_id'
                    columns={[
                        { name: 'type', title: 'Transaction Type' },
                        { name: 'client_sub_account', title: 'Sub Account' },
                        { name: 'subscription_id', title: 'Subscription Id' },
                        { name: 'accounting_amount', title: 'Amount', component: AmountTableCell },
                        { name: 'first_name', title: 'Customer Info', component: TableCellUserInfo },
                        { name: 'pcp_transaction_date', title: 'Date', component: TableCellTimeAgo }
                    ]}
                    data={transactionReportList}
                    isLoading={isLoading}
                ></Table>
            </div>
            {totalRows > 20 &&
                <Pagination
                    totalPages={totalPage}
                    currentPage={currentPage}
                    totalItems={totalRows}
                    itemsPerPage={20}
                    onItemClick={changePage}
                ></Pagination>
            }
        </div>
    </Container >
}

export default observer(CCBillTransactionReports)
