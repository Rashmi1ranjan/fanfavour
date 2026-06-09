import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faWindowClose } from '@fortawesome/free-solid-svg-icons'
import Select from 'react-select'
import { ActionMeta, ValueType } from 'react-select/src/types'
import moment from 'moment'
import { Cell } from './../table/Definations'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import styled from 'styled-components'
import Domain from '../layout/Domain'
import { OptionType, StickyIoTransactionInfo } from '../../types/types'

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

const StickyIoSuccessErrorLogs: React.FC<Props> = ({ rootStore }) => {
    const { StickyIoLogs, websiteStore } = rootStore
    const { getStickyIoLogsList, filter, stickyIoLogsData, currentPage, totalPage, limit, totalRows, viewLogData, setCcbillErrorDetailById, isLoading, getAllStickyIoPaymentGateways, paymentGateways } = StickyIoLogs
    const [showViewModel, setShowViewModel] = useState(false)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })
    useEffect(() => {
        getAllStickyIoPaymentGateways()
        getStickyIoLogsList(1)
    }, [getStickyIoLogsList])

    const viewDetail = (data: object) => {
        setCcbillErrorDetailById(data)
        setShowViewModel(true)
    }

    const changePage = (pageNum: number) => {
        getStickyIoLogsList(pageNum)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return (<>
            <div onClick={() => {
                viewDetail(jsonData)
            }}>
                <FontAwesomeIcon icon={faInfoCircle} />
            </div>
        </>)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value

        if (name === 'limit') {
            filter.limit = parseInt(value)
        } else if (name === 'is_recurring') {
            filter.is_recurring = value
        } else if (name === 'transaction_status') {
            filter.transaction_status = value
        } else if (name === 'transaction_for') {
            filter.transaction_for = value
        } else if (name === 'user_id') {
            filter.user_id = value.trim()
        } else if (name === 'ip_address') {
            filter.ip_address = value.trim()
        } else if (name === 'transaction_id') {
            filter.transaction_id = value.trim()
        } else if (name === 'auth_id') {
            filter.auth_id = value.trim()
        } else if (name === 'order_id') {
            filter.order_id = value.trim()
        } else if (name === 'gateway_id') {
            filter.gateway_id = value
        } else if (name === 'is_unique') {
            filter.is_unique = (e.target as HTMLInputElement).checked
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
        { label: 'SUCCESS', value: 'SUCCESS' },
        { label: 'FAILURE', value: 'FAILURE' }
    ]

    const transactionStatusOptions = transactionStatus.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const transactionType = [
        { label: 'All', value: 'all' },
        { label: 'SUCCESS', value: 'SUCCESS' },
        { label: 'FAILURE', value: 'FAILURE' }
    ]

    const transactionTypeOptions = transactionType.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const transactionFor = [
        { label: 'All', value: 'all' },
        { label: 'Feed Unlock', value: 'feed_unlock' },
        { label: 'Chat Unlock', value: 'chat_unlock' },
        { label: 'Tip', value: 'tip' },
        { label: 'Subscription', value: 'subscription' },
        { label: 'Cancel Subscription', value: 'cancel_subscription' },
        { label: 'Void Transaction', value: 'void_transaction' },
        { label: 'Refund Transaction', value: 'refund_transaction' },
        { label: 'Pay Per Message', value: 'chat_pay_per_message' }
    ]

    const transactionForOptions = transactionFor.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const paymentGatewayOption = [
        { label: 'All', value: 'all' }
    ]
    const paymentGateway = paymentGateways.map((gateway: { gateway_alias: string, gateway_id: string }) => (
        { label: gateway.gateway_alias, value: gateway.gateway_id }
    ))
    paymentGatewayOption.push(...paymentGateway)

    const paymentGatewayOptions = paymentGatewayOption.map((option: { label: string, value: string }) => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const timeToShow = `${data.value} (${timeAgo})`
        return (timeToShow)
    }

    const TableCellErrorMessage: React.FC<Cell> = (dataObject: { data: StickyIoTransactionInfo }) => {
        const data = dataObject.data
        if (data.transaction_status === 'SUCCESS') {
            return <></>
        }
        const stickyIoResponse = data.sticky_io_response
        if (stickyIoResponse.response_message !== undefined) {
            return (stickyIoResponse.response_message)
        }
        return (stickyIoResponse.error_message !== undefined ? stickyIoResponse.error_message : '')
    }

    const TableCellPaymentGatewayInfo: React.FC<Cell> = (dataObject: { data: StickyIoTransactionInfo }) => {
        const data = dataObject.data
        if (data.transaction_status !== 'SUCCESS' && (data.transaction_type !== 'subscription_order' && data.transaction_type !== 'order_by_previous_order_id')) {
            return <></>
        }

        const stickyIoResponse = data.sticky_io_response
        let gatewayAlias = ''
        if (stickyIoResponse.gateway_id !== undefined) {
            const findGatewayAlias = paymentGateway.filter((gateway: { label: string, value: string }) => gateway.value === stickyIoResponse.gateway_id)
            gatewayAlias = findGatewayAlias.length > 0 ? findGatewayAlias[0].label : ''
        }

        return (
            <>
                <div><strong>Transaction Id: </strong>{stickyIoResponse.transactionID}</div>
                <div><strong>Auth Id: </strong>{stickyIoResponse.authId}</div>
                <div><strong>Order Id: </strong>{stickyIoResponse.order_id}</div>
                <div><strong>Payment Gateway: </strong>{gatewayAlias}</div>
            </>
        )
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
        getStickyIoLogsList(1)
    }

    const TableCellErrorProviderInfo: React.FC<Cell> = (dataObject: { data: StickyIoTransactionInfo }) => {
        const data = dataObject.data
        if (data.transaction_status === 'SUCCESS') {
            return <></>
        }
        const stickyIoResponse = data.sticky_io_response
        return (
            <>
                <div><strong>Provider Type: </strong>{stickyIoResponse.provider_type}</div>
                <div><strong>Provider Name: </strong>{stickyIoResponse.provider_name}</div>
            </>
        )
    }

    const TableCellWebsiteLink: React.FC<Cell> = (data) => {
        const url = `https://${data.value}`
        return (<a href={url} target='_blank' rel='noreferrer'>{data.value}</a>)
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
                                        id='is_recurring'
                                        name='is_recurring'
                                        onChange={onChange}>
                                        {selectIsRecurringOptions}
                                    </select>
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>Transaction Status</label>
                                    <select
                                        className='form-control form-select'
                                        id='transaction_status'
                                        name='transaction_status'
                                        onChange={onChange}>
                                        {transactionStatusOptions}
                                    </select>
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>Transaction For</label>
                                    <select
                                        className='form-control form-select'
                                        id='transaction_for'
                                        name='transaction_for'
                                        onChange={onChange}>
                                        {transactionForOptions}
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
                                    <label className='me-2 mb-2'>IP Address</label>
                                    <input
                                        name='ip_address'
                                        type='text'
                                        className='form-control'
                                        onChange={onChange}
                                    />
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>Transaction Id</label>
                                    <input
                                        name='transaction_id'
                                        type='text'
                                        className='form-control'
                                        onChange={onChange}
                                    />
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>Auth Id</label>
                                    <input
                                        name='auth_id'
                                        type='text'
                                        className='form-control'
                                        onChange={onChange}
                                    />
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>Order Id</label>
                                    <input
                                        name='order_id'
                                        type='text'
                                        className='form-control'
                                        onChange={onChange}
                                    />
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>Payment Gateway</label>
                                    <select
                                        className='form-control form-select'
                                        id='gateway_id'
                                        name='gateway_id'
                                        onChange={onChange}>
                                        {paymentGatewayOptions}
                                    </select>
                                </div>
                                <div className='col-md-2'>
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
            <div className='card-header'>Sticky Io Transaction Logs</div>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <div className='table-responsive mt-3'>
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'domain', title: 'DOMAIN', component: TableCellWebsiteLink },
                                    { name: 'user_id', title: 'USER ID' },
                                    { name: 'transaction_status', title: 'TRANSACTION STATUS' },
                                    { name: 'transaction_for', title: 'TRANSACTION FOR' },
                                    { name: 'is_recurring', title: 'IS RECURRING' },
                                    { name: 'ip_address', title: 'IP ADDRESS' },
                                    { name: 'sticky_io_response', title: 'Payment Gateway Info', component: TableCellPaymentGatewayInfo },
                                    { name: 'createdAt', title: 'DATE', component: TableCellTimeAgo },
                                    { name: 'sticky_io_response.response_message', title: 'ERROR MESSAGE', component: TableCellErrorMessage },
                                    { name: 'sticky_io_response.response_message', title: 'ERROR PROVIDER', component: TableCellErrorProviderInfo },
                                    { name: 'action', title: 'VIEW', component: tableCellButton }
                                ]}
                                data={stickyIoLogsData}
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
        {showViewModel ?
            <div className='modal fade show' role='dialog' style={{ display: 'block', backgroundColor: '#00000080' }
            }>
                <div className='modal-dialog modal-dialog-scrollable modal-lg'>
                    <div className='modal-content'>
                        <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                            <h5 className='modal-title'>Sticky Io Transaction Log</h5>
                            <div onClick={() => setShowViewModel(false)} style={{ cursor: 'pointer' }}>
                                <FontAwesomeIcon icon={faWindowClose} />
                            </div>
                        </div>
                        <div className='modal-body'>
                            <div className='container'>
                                <div className='row mt-3'>
                                    <div className='col-md-4'>
                                        Domain:
                                    </div>
                                    <div className='col-md-8'>
                                        <span>
                                            {viewLogData.domain}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        User Id:
                                    </div>
                                    <div className='col-md-8'>
                                        <span>
                                            {viewLogData.user_id}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        Transaction Type:
                                    </div>
                                    <div className='col-md-8'>
                                        <span>
                                            {viewLogData.transaction_type}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        Is Recurring:
                                    </div>
                                    <div className='col-md-8'>
                                        <span>
                                            {viewLogData.is_recurring?.toString()}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        URL:
                                    </div>
                                    <div className='col-md-8'>
                                        <span className={'text-break'}>
                                            {viewLogData.request_url}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        Request Data:
                                    </div>
                                    <div className='col-md-8'>
                                        <span className={'text-break'}>
                                            {JSON.stringify(viewLogData.request_data)}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        Transaction Status:
                                    </div>
                                    <div className='col-md-8'>
                                        <span>
                                            {viewLogData.transaction_status}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        Response:
                                    </div>
                                    <div className='col-md-8'>
                                        <span className={'text-break'}>
                                            {JSON.stringify(viewLogData.sticky_io_response)}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        Transaction For:
                                    </div>
                                    <div className='col-md-8'>
                                        <span>
                                            {viewLogData.transaction_for}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                            </div>
                        </div>
                    </div>
                </div>
            </div > : null}
    </Container>

}

export default observer(StickyIoSuccessErrorLogs)
