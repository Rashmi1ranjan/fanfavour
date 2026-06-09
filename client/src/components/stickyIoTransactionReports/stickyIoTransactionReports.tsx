import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faWindowClose } from '@fortawesome/free-solid-svg-icons'
import { ActionMeta, ValueType } from 'react-select/src/types'
import moment from 'moment'
import { Cell } from './../table/Definations'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import styled from 'styled-components'
import Button from './../utils/Button'
import { Controller, useForm } from 'react-hook-form'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Domain from '../layout/Domain'
import { StickyIoTransactionReport } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type OptionType = {
    value: string
    label: string
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

const StickyIoTransactionReports: React.FC<Props> = ({ rootStore }) => {
    const { StickyIoTransactionReportsStore, websiteStore, StickyIoLogs } = rootStore
    const { getStickyIoTransactionReportsList, filter, StickyIoTransactionReportsData, currentPage, totalPage, limit, totalRows, isLoading, setTransactionDetails, transactionDetails, markTransactionAsChargeback } = StickyIoTransactionReportsStore
    const { getAllStickyIoPaymentGateways, paymentGateways } = StickyIoLogs
    const [showViewModel, setShowViewModel] = useState(false)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })
    const { register, handleSubmit, formState: { errors }, control, setValue } = useForm()
    const [selectedDate, setSelectedDate] = useState(new Date())
    useEffect(() => {
        getAllStickyIoPaymentGateways()
        getStickyIoTransactionReportsList(1)
    }, [getStickyIoTransactionReportsList, getAllStickyIoPaymentGateways])

    const changePage = (pageNum: number) => {
        getStickyIoTransactionReportsList(pageNum)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value

        if (name === 'limit') {
            filter.limit = parseInt(value.trim())
        } else if (name === 'is_recurring') {
            filter.is_recurring = value.trim()
        } else if (name === 'transaction_type') {
            filter.transaction_type = value.trim()
        } else if (name === 'campaign_id') {
            filter.campaign_id = value.trim()
        } else if (name === 'order_id') {
            filter.order_id = value.trim()
        } else if (name === 'email') {
            filter.email = value.trim()
        } else if (name === 'user_id') {
            filter.user_id = value.trim()
        } else if (name === 'transaction_id') {
            filter.transaction_id = value.trim()
        } else if (name === 'pcp_transaction_type') {
            filter.pcp_transaction_type = value.trim()
        } else if (name === 'gateway_id') {
            filter.gateway_id = value
        } else if (name === 'payment_transaction_id') {
            filter.payment_transaction_id = value.trim()
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
            filter.website_url = selectedValue
        }
    }

    const isRecurringOptions = [
        { label: 'All', value: 'all' },
        { label: 'Yes', value: 'YES' },
        { label: 'No', value: 'NO' }
    ]

    const selectIsRecurringOptions = isRecurringOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const transactionType = [
        { label: 'All', value: 'all' },
        { label: 'NEW', value: 'NEW' },
        { label: 'REBILL', value: 'REBILL' },
        { label: 'REFUND', value: 'REFUND' },
        { label: 'VOID', value: 'VOID' },
        { label: 'CHARGEBACK', value: 'CHARGEBACK' },
        { label: 'DECLINED', value: 'DECLINED' }
    ]

    const transactionTypeOptions = transactionType.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const pcpTransactionTypeOptions = [
        { label: 'All', value: 'all' },
        { label: 'Subscription', value: 'subscription' },
        { label: 'Tip', value: 'tip' },
        { label: 'Feed Unlock', value: 'feed_unlock' },
        { label: 'Chat Unlock', value: 'chat_unlock' },
        { label: 'Chat Booking', value: 'chat_booking' },
        { label: 'Pay Per Message', value: 'pay_per_message' },
        { label: 'shop', value: 'shop' }
    ]

    const selectPcpTransactionTypeOptions = pcpTransactionTypeOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const paymentGatewayOption = [
        { label: 'All', value: 'all' }
    ]
    const paymentGateway = paymentGateways.map((gateway: { gateway_alias: string; gateway_id: string }) => (
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
        const dateFormat = moment(data.value).format('MM/DD/YYYY')
        const timeToShow = `${dateFormat} (${timeAgo})`
        return (timeToShow)
    }

    const TableCellTransactionAmount: React.FC<Cell> = (data) => {
        const amount = `$${parseFloat(data.value).toFixed(2)}`
        return (amount)
    }

    const TableCellStickyIoInfo: React.FC<Cell> = (dataObject: { data: StickyIoTransactionReport }) => {
        const data = dataObject.data
        return (
            <>
                <div onClick={() => copyToClipboard(data.campaign_id)}><strong>Campaign Id:</strong> {data.campaign_id}</div>
                <div><strong>Product Id:</strong> {data.product_id}</div>
                <div onClick={() => copyToClipboard(data.order_id)}><strong>Order Id:</strong> {data.order_id}</div>
                <div onClick={() => copyToClipboard(data.transaction_payment_gateway)}><strong>Payment Gateway:</strong> {data.transaction_payment_gateway}</div>
            </>
        )
    }

    const TableCellUserInfo: React.FC<Cell> = (dataObject: { data: StickyIoTransactionReport }) => {
        const data = dataObject.data
        return (
            <>
                <div onClick={() => copyToClipboard(data.pcp_user_id)}><strong>User Id:</strong> {data.pcp_user_id}</div>
                <div><strong>Name:</strong> {data.first_name} {data.last_name}</div>
                <div onClick={() => copyToClipboard(data.email)}><strong>Email:</strong> {data.email}</div>
            </>
        )
    }

    const TableCellPaymentInfo: React.FC<Cell> = (dataObject: { data: StickyIoTransactionReport }) => {
        const data = dataObject.data
        return (
            <>
                <div onClick={() => copyToClipboard(data.transaction_number)}><strong>Transaction Id:</strong> {data.transaction_number}</div>
                <div onClick={() => copyToClipboard(data.auth_number)}><strong>Auth Id:</strong> {data.auth_number}</div>
                <div onClick={() => copyToClipboard(data.pcp_transaction_id)}><strong>PCP Transaction Id:</strong> {data.pcp_transaction_id}</div>
            </>
        )
    }

    const TableCellAction: React.FC<Cell> = (dataObject: { data: StickyIoTransactionReport }) => {
        const data = dataObject.data
        if (data.transaction_type === 'NEW' || data.transaction_type === 'REBILL') {
            return data.has_chargeback === false ? <Button
                type='button'
                title='Mark Chargeback'
                classes='btn-primary btn-sm'
                disabled={data.has_chargeback}
                loading={isLoading}
                onClick={() => { setShowViewModel(true); setTransactionDetails(data) }}
            /> : <>Chargeback: {data.notes}</>
        }
        return <></>
    }

    const copyToClipboard = (value: string) => {
        navigator.clipboard.writeText(value)
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
        getStickyIoTransactionReportsList(1)
    }

    const onSubmit = async (data: { notes: string, chargeback_date: Date }) => {
        if (window.confirm('Are you sure to mark this transaction as Chargeback?') === true) {
            transactionDetails.notes = data.notes.trim()
            transactionDetails.chargeback_date = moment(data.chargeback_date).format('MM/DD/yyyy')
            const response = await markTransactionAsChargeback(transactionDetails)
            alert(response.message)
            if (response.status === true) {
                setShowViewModel(false)
                getStickyIoTransactionReportsList(currentPage)
            }
        }
    }

    const TableCellWebsiteLink: React.FC<Cell> = (data) => {
        const url = `https://${data.value}`
        return (<a href={url} target='_blank' rel='noreferrer'>{data.value}</a>)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
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
                            <label className='me-2 mb-2'>Campaign Id</label>
                            <input
                                name='campaign_id'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3 mt-2'>
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
                            <label className='me-2 mb-2'>Transaction Type</label>
                            <select
                                className='form-control form-select'
                                id='transaction_type'
                                name='transaction_type'
                                onChange={onChange}>
                                {transactionTypeOptions}
                            </select>
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
                            <label className='me-2 mb-2'>PCP Transaction Id</label>
                            <input
                                name='transaction_id'
                                type='text'
                                className='form-control'
                                onChange={onChange}
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
                            <label className='me-2 mb-2'>PCP Transaction Type</label>
                            <select
                                className='form-control form-select'
                                id='pcp_transaction_type'
                                name='pcp_transaction_type'
                                onChange={onChange}>
                                {selectPcpTransactionTypeOptions}
                            </select>
                        </div>
                        <div className='col-md-3 mt-2'>
                            <label className='me-2 mb-2'>Payment Transaction Id</label>
                            <input
                                name='payment_transaction_id'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3 mt-2'>
                            <label className='me-2 mb-2'>Payment Auth Id</label>
                            <input
                                name='payment_auth_id'
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
                                value={filter.gateway_id}
                                onChange={onChange}>
                                {paymentGatewayOptions}
                            </select>
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
        <div className='card mt-4'>
            <div className='card-header'>
                Sticky Io Transaction Report List
            </div>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <div className='table-responsive mt-3'>
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'website_url', title: 'website', component: TableCellWebsiteLink },
                                    { name: 'transaction_type', title: 'Transaction Type' },
                                    { name: 'campaign_id', title: 'Sticky.io Info', component: TableCellStickyIoInfo },
                                    { name: 'amount', title: 'Amount', component: TableCellTransactionAmount },
                                    { name: 'first_name', title: 'User Info', component: TableCellUserInfo },
                                    { name: 'is_recurring', title: 'IS RECURRING' },
                                    { name: 'transaction_number', title: 'Payment Info', component: TableCellPaymentInfo },
                                    { name: 'pcp_transaction_type', title: 'PCP Transaction Type' },
                                    { name: 'transaction_date', title: 'DATE', component: TableCellTimeAgo },
                                    { name: '_id', title: 'Action', component: TableCellAction }
                                ]}
                                data={StickyIoTransactionReportsData}
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
                            <h5 className='modal-title'>Mark Transaction as chargeback</h5>
                            <div onClick={() => setShowViewModel(false)} style={{ cursor: 'pointer' }}>
                                <FontAwesomeIcon icon={faWindowClose} />
                            </div>
                        </div>
                        <div className='modal-body'>
                            <div className='container'>
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <div className='form-group mb-3'>
                                        <label className='mb-2'>Chargeback Date</label>
                                        <Controller
                                            name='chargeback_date'
                                            ref={register({ required: 'Please select Chargeback Date' })}
                                            control={control}
                                            defaultValue={selectedDate}
                                            render={({ onChange, value }) => (
                                                <DatePicker
                                                    selected={selectedDate}
                                                    className='form-control'
                                                    onChange={(selected: Date) => {
                                                        setValue('chargeback_date', new Date(selected))
                                                        setSelectedDate(new Date(selected))
                                                    }}
                                                />
                                            )}
                                        />
                                        {(errors.chargeback_date) && <p className='text-danger mb-0'>{errors.chargeback_date.message}</p>}
                                    </div>
                                    <div className='form-group mb-3'>
                                        <label className='mb-2'>Notes</label>
                                        <input
                                            name='notes'
                                            type='text'
                                            className='form-control'
                                            placeholder='Chargeback Notes'
                                            ref={register()}
                                        />
                                        {(errors.notes) && <p className='text-danger mb-0'>{errors.notes.message}</p>}
                                    </div>
                                    <Button disabled={isLoading} type='submit' title='Save' classes='btn-primary me-2' loading={isLoading} />
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>}
    </Container>
}

export default observer(StickyIoTransactionReports)
