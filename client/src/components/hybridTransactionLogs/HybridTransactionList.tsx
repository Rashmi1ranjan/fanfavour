import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import Select from 'react-select'
import { ActionMeta, ValueType } from 'react-select/src/types'
import moment from 'moment'
import { Cell } from './../table/Definations'
import { DateRangePicker, RangeKeyDict, Range } from 'react-date-range'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faWindowClose } from '@fortawesome/free-solid-svg-icons'
import Badge from './../utils/Badge'
import { toJS } from 'mobx'
import Domain from '../layout/Domain'
import { OptionType, CountryDetails, HybridTransactionLog } from '../../types/types'

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

const HybridTransactionList: React.FC<Props> = ({ rootStore }) => {
    const { HybridTransactionLogListStore, websiteStore, CCBillRestApiAddCardLogStore } = rootStore
    const { getHybridTransactionLogsList, filter, hybridTransactionLogsData, currentPage, totalPage, limit, totalRows, isLoading, setHybridLogDetails, logDetails } = HybridTransactionLogListStore
    const { countryList, getCountryList } = CCBillRestApiAddCardLogStore
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const [showViewModel, setShowViewModel] = useState(false)
    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })
    useEffect(() => {
        getCountryList()
        setInitialDates()
        getHybridTransactionLogsList(1)
    }, [getHybridTransactionLogsList])

    const setInitialDates = () => {
        const startDate = moment().format('MM/DD/YYYY')
        const endDate = moment().format('MM/DD/YYYY')

        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        filter.start_date = startDate
        filter.end_date = endDate
    }

    const changePage = (pageNum: number) => {
        getHybridTransactionLogsList(pageNum)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value.trim()

        if (name === 'is_unique') {
            filter.is_unique = (e.target as HTMLInputElement).checked
            return
        }
        _.set(filter, name, value)
    }

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name as string
        const selectedValue = _.get(value, 'value', '')
        _.set(filter, name, selectedValue)
    }

    const isRecurringOptions = [
        { label: 'All', value: 'all' },
        { label: 'false', value: 'false' },
        { label: 'true', value: 'true' }
    ]

    const selectIsRecurringOptions = isRecurringOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const transactionStatus = [
        { label: 'All', value: 'all' },
        { label: 'SUCCESS', value: 'true' },
        { label: 'FAILURE', value: 'false' }
    ]

    const transactionStatusOptions = transactionStatus.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const paymentGatewayOption = [
        { label: 'All', value: 'all' },
        { label: 'Sticky.io', value: 'sticky.io' },
        { label: 'CCBill', value: 'ccbill' }
    ]

    const paymentGatewayOptions = paymentGatewayOption.map((option: { label: string, value: string }) => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const transactionType = [
        { label: 'All', value: 'all' },
        { label: 'Subscription', value: 'subscription' },
        { label: 'Chat Content Purchase', value: 'chat' },
        { label: 'Tip Payment', value: 'tips' },
        { label: 'Blog Content Purchase', value: 'blog' }
    ]

    const transactionTypeOption = transactionType.map((option: { label: string, value: string }) => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const countries: OptionType[] = [
        { label: 'All', value: 'all' }
    ]
    const countriesOptions: OptionType[] = countryList.map((option: CountryDetails) => (
        { label: `${option.name} (${option.iso2})`, value: option.iso2 }
    ))
    countries.push(...countriesOptions)

    const isCascadeTransaction = [
        { label: 'All', value: 'all' },
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' }
    ]

    const isCascadeOption = isCascadeTransaction.map((option: { label: string, value: string }) => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
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
        getHybridTransactionLogsList(1)
    }

    const TableCellWebsiteLink: React.FC<Cell> = (data) => {
        const url = `https://${data.value}`
        return (<a href={url} target='_blank' rel='noreferrer'>{data.value}</a>)
    }

    const tableCellButton = (objData: any) => {
        const data = objData.data
        const jsonData = toJS(data)
        return (<>
            <div
                onClick={() => {
                    viewDetail(jsonData)
                }}
                style={{ cursor: 'pointer' }}
            >
                <FontAwesomeIcon icon={faInfoCircle} />
            </div>
        </>)
    }

    const TableCellAmount = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { amount: number, transaction_type: string }
        const jsonData = toJS(data)
        const { amount, transaction_type } = jsonData

        return (<>${amount} <Badge title={transaction_type} bgColorClass='text-bg-secondary' /></>)
    }

    const TableCellBoolean: React.FC<Cell> = (data) => {
        const type: any = data.value === 'true' ? 'Yes' : 'No'
        return (type)
    }

    const TableCellTransactionGateway = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { payment_gateways: string[], final_payment_gateway: string }
        const jsonData = toJS(data)

        const primary_gateway = jsonData.payment_gateways[0] === 'sticky.io' ? <Badge title='Sticky.io' bgColorClass='text-bg-primary' /> : <Badge title='CCBill' bgColorClass='text-bg-secondary' />
        const processed_gateway = jsonData.final_payment_gateway === 'sticky.io' ? <Badge title='Sticky.io' bgColorClass='text-bg-primary' /> : <Badge title='CCBill' bgColorClass='text-bg-secondary' />

        return (<>{primary_gateway} / {processed_gateway}</>)
    }

    const TableCellTransactionTags = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { recurring: string, is_cascade_transaction: boolean, is_unique: boolean, is_success: boolean }
        const jsonData = toJS(data)

        const recurring = jsonData.recurring === 'true' && <Badge title='Recurring' bgColorClass='text-bg-primary' />
        const is_cascade_transaction = jsonData.is_cascade_transaction === true ? <Badge title='Cascade' bgColorClass='text-bg-warning' /> : <Badge title='Normal' bgColorClass='text-bg-secondary' />
        const is_unique = jsonData.is_unique === true && <Badge title='Unique' bgColorClass='text-bg-info' />
        const is_success = jsonData.is_success === true ? <Badge title='Success' bgColorClass='text-bg-success' /> : <Badge title='Failed' bgColorClass='text-bg-danger' />


        return (<>{recurring} {is_cascade_transaction} {is_unique} {is_success}</>)
    }

    const TableCellTransactionCascadeType = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { recurring: string, is_cascade_transaction: boolean, cascade_type: number }
        const jsonData = toJS(data)

        const { recurring, is_cascade_transaction, cascade_type } = jsonData
        if (recurring === 'true' && is_cascade_transaction === true && cascade_type === 1) {
            return (<>Subscription</>)
        }

        if (recurring === 'false' && is_cascade_transaction === true && cascade_type === 2) {
            return (<>Purchase - Added Same Primary card</>)
        }

        if (recurring === 'false' && is_cascade_transaction === true && cascade_type === 3) {
            return (<>Purchase - Added Different card</>)
        }

        return (<></>)
    }

    const TableCellUserAndTransactionId = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { user_id: string, pcp_transaction_id: string }
        const jsonData = toJS(data)
        const { user_id, pcp_transaction_id } = jsonData
        return (<>{user_id} <br /> {pcp_transaction_id}</>)
    }

    const TableCellIpAndCountry = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { ip_address: string, country: string }
        const jsonData = toJS(data)
        const { ip_address, country } = jsonData
        return (<>{ip_address} / {country}</>)
    }

    const viewDetail = (data: HybridTransactionLog) => {
        setHybridLogDetails(data)
        setShowViewModel(true)
    }

    const msToTime: React.FC<Cell> = (data) => {
        const time = moment.duration(data.value)
        return <>{time.hours() !== 0 ? `${time.hours()}hrs` : ''} {time.minutes() !== 0 ? `${time.minutes()}mins` : ''} {time.seconds() !== 0 ? `${time.seconds()}secs` : ''} {time.milliseconds() !== 0 ? `${time.milliseconds()}ms` : ''}</>
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
                                    <label className='me-2 mb-2'>Domain</label>
                                    <Domain
                                        onDomainChange={handleChange}
                                        websiteStore={websiteStore}
                                        loading={isLoading}
                                        defaultDomain={filter.domain}
                                        multiSelect={false}
                                    />
                                </div>
                                <div className='col-md-3'>
                                    <label className='me-2 mb-2'>Is Recurring</label>
                                    <select
                                        className='form-control form-select'
                                        id='recurring'
                                        name='recurring'
                                        onChange={onChange}>
                                        {selectIsRecurringOptions}
                                    </select>
                                </div>
                                <div className='col-md-3'>
                                    <label className='me-2 mb-2'>Transaction Status</label>
                                    <select
                                        className='form-control form-select'
                                        id='is_success'
                                        name='is_success'
                                        onChange={onChange}>
                                        {transactionStatusOptions}
                                    </select>
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>Transaction Id</label>
                                    <input
                                        name='pcp_transaction_id'
                                        type='text'
                                        className='form-control'
                                        onChange={onChange}
                                    />
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>IP Address</label>
                                    <input
                                        name='ip_address'
                                        type='text'
                                        className='form-control'
                                        onChange={onChange}
                                    />
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>Country</label>
                                    <Select
                                        name='country'
                                        options={countries}
                                        onChange={handleChange}
                                        className='mb-3'
                                    />
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>Payment Gateway</label>
                                    <select
                                        className='form-control form-select'
                                        id='final_payment_gateway'
                                        name='final_payment_gateway'
                                        onChange={onChange}>
                                        {paymentGatewayOptions}
                                    </select>
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>Transaction Type</label>
                                    <select
                                        className='form-control form-select'
                                        id='transaction_type'
                                        name='transaction_type'
                                        onChange={onChange}>
                                        {transactionTypeOption}
                                    </select>
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>Is Cascade?</label>
                                    <select
                                        className='form-control form-select'
                                        id='is_cascade_transaction'
                                        name='is_cascade_transaction'
                                        onChange={onChange}>
                                        {isCascadeOption}
                                    </select>
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
                                    <label className='me-2 mb-2'>Processed by</label>
                                    <div>
                                        <div className='form-check form-check-inline'>
                                            <input className='form-check-input' type='radio' name='by_primary_gateway' id='by_primary_gateway_all' value='all' onChange={onChange} defaultChecked={true} />
                                            <label className='form-check-label' htmlFor='by_primary_gateway_all'>All</label>
                                        </div>
                                        <div className='form-check form-check-inline'>
                                            <input className='form-check-input' type='radio' name='by_primary_gateway' id='by_primary_gateway_true' value='true' onChange={onChange} />
                                            <label className='form-check-label' htmlFor='by_primary_gateway_true'>Primary Gateway</label>
                                        </div>
                                        <div className='form-check form-check-inline'>
                                            <input className='form-check-input' type='radio' name='by_primary_gateway' id='by_primary_gateway_false' value='false' onChange={onChange} />
                                            <label className='form-check-label' htmlFor='by_primary_gateway_false'>Secondary Gateway</label>
                                        </div>
                                    </div>
                                </div>
                                <div className='col-md-3'>
                                    <label className='me-2 mt-2 mb-2'>Is Hybrid enabled?</label>
                                    <div>
                                        <div className='form-check form-check-inline'>
                                            <input className='form-check-input' type='radio' name='is_cascade_enabled' id='is_cascade_enabled_all' value='all' onChange={onChange} defaultChecked={true} />
                                            <label className='form-check-label' htmlFor='is_cascade_enabled_all'>All</label>
                                        </div>
                                        <div className='form-check form-check-inline'>
                                            <input className='form-check-input' type='radio' name='is_cascade_enabled' id='is_cascade_enabled_yes' value='true' onChange={onChange} />
                                            <label className='form-check-label' htmlFor='is_cascade_enabled_yes'>Yes</label>
                                        </div>
                                        <div className='form-check form-check-inline'>
                                            <input className='form-check-input' type='radio' name='is_cascade_enabled' id='is_cascade_enabled_no' value='false' onChange={onChange} />
                                            <label className='form-check-label' htmlFor='is_cascade_enabled_no'>No</label>
                                        </div>
                                    </div>
                                </div>
                                <div className='col-md-2 mt-2'>
                                    <div className='form-check form-switch mt-4'>
                                        <input className='form-check-input' type='checkbox' id='is_unique' defaultChecked={true} onChange={onChange} name='is_unique' />
                                        <label className='form-check-label' htmlFor='is_unique'>Is Unique?</label>
                                    </div>
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
            <div className='card-header'>Hybrid Transaction Logs</div>
            <div className='card-body'>
                {/* {isLoading === true &&
                    <Loader>
                        <div className='spinner-border' role='status'>
                            <span className='sr-only'>Loading...</span>
                        </div>
                    </Loader>
                } */}
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <div className='table-responsive mt-3'>
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'domain', title: 'Domain', component: TableCellWebsiteLink },
                                    { name: 'final_payment_gateway', title: 'Primary/Processed Gateway', component: TableCellTransactionGateway },
                                    { name: 'user_id', title: 'User Id / Transaction Id', component: TableCellUserAndTransactionId },
                                    { name: 'ip_address', title: 'Ip Address / Country', component: TableCellIpAndCountry },
                                    { name: 'is_success', title: 'Transaction Info', component: TableCellTransactionTags },
                                    { name: 'cascade_with_same_card', title: 'Cascade Type', component: TableCellTransactionCascadeType },
                                    { name: 'amount', title: 'Amount', component: TableCellAmount },
                                    { name: 'transaction_date', title: 'Transaction Date', component: TableCellTimeAgo },
                                    { name: 'transaction_execution_time', title: 'Transaction Execution Time', component: msToTime },
                                    { name: 'action', title: 'VIEW', component: tableCellButton }
                                ]}
                                data={hybridTransactionLogsData}
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
        {showViewModel &&
            <div className='modal fade show' role='dialog' style={{ display: 'block', backgroundColor: '#00000080' }}>
                <div className='modal-dialog modal-dialog-scrollable modal-lg'>
                    <div className='modal-content'>
                        <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                            <h5 className='modal-title'>Transaction Log</h5>
                            <div onClick={() => setShowViewModel(false)} style={{ cursor: 'pointer' }}>
                                <FontAwesomeIcon icon={faWindowClose} />
                            </div>
                        </div>
                        <div className='modal-body'>
                            <div className='container'>
                                <div className='row mt-3'>
                                    <div className='col-md-4'>Domain</div>
                                    <div className='col-md-8'><span>{logDetails.domain}</span></div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-4'>User Id</div>
                                    <div className='col-md-8'><span>{logDetails.user_id}</span></div>
                                </div>
                                <hr />

                                <div className='row mt-3'>
                                    <div className='col-md-4'>Is Transaction Success?</div>
                                    <div className='col-md-8'><span>{logDetails.is_success?.toString()}</span></div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-4'>Is Recurring Transaction?</div>
                                    <div className='col-md-8'><span>{logDetails.recurring?.toString()}</span></div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-4'>Country/IP Address</div>
                                    <div className='col-md-8'><span>{logDetails.country}/{logDetails.ip_address}</span></div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-4'>Amount</div>
                                    <div className='col-md-8'><span>{logDetails.amount}</span></div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-4'>Transaction Type</div>
                                    <div className='col-md-8'><span>{logDetails.transaction_type}</span></div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-4'>Transaction Date</div>
                                    <div className='col-md-8'><span>{logDetails.transaction_date}</span></div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-4'>Last Payment Gateway</div>
                                    <div className='col-md-8'><span>{logDetails.final_payment_gateway}</span></div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-4'>Transaction Response</div>
                                    <div className='col-md-8'><span style={{ overflowWrap: 'break-word' }}>{JSON.stringify(logDetails.response)}</span></div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-4'>Payment Gateways</div>
                                    <div className='col-md-8'><span>{JSON.stringify(logDetails.payment_gateways)}</span></div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-4'>Is Cascade Transaction?</div>
                                    <div className='col-md-8'><span>{logDetails.is_cascade_transaction?.toString()}</span></div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-4'>Cascade Transaction Response</div>
                                    <div className='col-md-8' style={{ overflowWrap: 'break-word' }}><span>{JSON.stringify(logDetails.cascade)}</span></div>
                                </div>
                                <hr />
                            </div>
                        </div>
                    </div>
                </div>
            </div>}
    </Container>
}

export default observer(HybridTransactionList)
