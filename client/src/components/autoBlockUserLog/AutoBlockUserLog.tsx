import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import moment from 'moment'
import { Cell } from './../table/Definations'
import { toJS } from 'mobx'
import Button from '../utils/Button'
import styled from 'styled-components'
import Badge from './../utils/Badge'
import { ActionMeta, ValueType } from 'react-select/src/types'
import DateRange from './../utils/DateRange'
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

const AutoBlockUserLog: React.FC<Props> = ({ rootStore }) => {
    const { AutoBlockUserLogStore, websiteStore } = rootStore
    const { getAutoBlockUserLog, filter, autoBlockUserList, currentPage, totalPage, limit, totalRows, isLoading, markLogProcessed } = AutoBlockUserLogStore
    useEffect(() => {
        getAutoBlockUserLog(1)
    }, [getAutoBlockUserLog])

    const changePage = (pageNum: number) => {
        getAutoBlockUserLog(pageNum)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value.trim()
        _.set(filter, name, value)
    }

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name as string
        const selectedValue = _.get(value, 'value', '')
        _.set(filter, name, selectedValue)
    }

    const subscriptionStatus = [
        { label: 'All', value: '' },
        { label: 'Inactive', value: '0' },
        { label: 'Cancelled', value: '1' },
        { label: 'Active', value: '2' }
    ]

    const subscriptionStatusOption = subscriptionStatus.map((option: OptionType) => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const timeToShow = `${data.value} (${timeAgo})`
        return (timeToShow)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { is_processed: boolean, _id: string }
        const jsonData = toJS(data)

        return (<Button
            disabled={data.is_processed}
            type='button'
            title={jsonData.is_processed === false ? 'Mark Processed' : 'Processed'}
            classes='btn-primary btn-sm'
            loading={isLoading}
            onClick={() => markProcessed(jsonData._id)}
        />)
    }

    const markProcessed = (logId: string) => {
        markLogProcessed(logId)
    }

    const TableCellSubscriptionStatus = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { user_subscription_status: string }
        const jsonData = toJS(data)
        const { user_subscription_status } = jsonData

        let badge = <Badge title='Inactive' bgColorClass='text-bg-secondary' />
        if (user_subscription_status === '2') {
            badge = <Badge title='Active' bgColorClass='text-bg-success' />
        }
        if (user_subscription_status === '1') {
            badge = <Badge title='Cancelled' bgColorClass='text-bg-warning' />
        }

        return (badge)
    }

    const onDateChange = (start_date: string, end_date: string) => {
        filter.start_date = start_date
        filter.end_date = end_date
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className='mt-2 mb-3'>Auto Block User Log</h4>
        <div className='card'>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <div className='row'>
                            <div className='col-md-3 mt-2'>
                                <DateRange
                                    title='Date Range'
                                    id='date_range'
                                    name='date_range'
                                    startDate={''}
                                    endDate={''}
                                    onDateChange={onDateChange}
                                />
                            </div>
                            <div className='col-md-3 mt-2'>
                                <label className='me-2 mb-2'>API End Point</label>
                                <input
                                    name='api_end_point'
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
                                <label className='me-2 mb-2'>Subscription Id</label>
                                <input
                                    name='subscription_id'
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
                                <label className='me-2 mb-2'>Subscription Status</label>
                                <select
                                    className='form-control form-select'
                                    id='subscription_status'
                                    name='subscription_status'
                                    onChange={onChange}>
                                    {subscriptionStatusOption}
                                </select>
                            </div>
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
                            <div className='col-md-3 mt-2'>
                                <label className='me-2 mb-2'>Payment Gateway</label>
                                <div>
                                    <div className='form-check form-check-inline'>
                                        <input className='form-check-input' type='radio' name='payment_gateway' id='payment_gateway_all' value='' defaultChecked={true} onChange={onChange} />
                                        <label className='form-check-label' htmlFor='payment_gateway_all'>All</label>
                                    </div>
                                    <div className='form-check form-check-inline'>
                                        <input className='form-check-input' type='radio' name='payment_gateway' id='ccbill' value='ccbill' onChange={onChange} />
                                        <label className='form-check-label' htmlFor='ccbill'>CCBill</label>
                                    </div>
                                    <div className='form-check form-check-inline'>
                                        <input className='form-check-input' type='radio' name='payment_gateway' id='sticky.io' value='sticky.io' onChange={onChange} />
                                        <label className='form-check-label' htmlFor='sticky.io'>Sticky.io</label>
                                    </div>
                                </div>
                            </div>
                            <div className='col-md-2 mt-2'>
                                <label className='me-2 mb-2'>Is Processed?</label>
                                <div>
                                    <div className='form-check form-check-inline'>
                                        <input className='form-check-input' type='radio' name='is_processed' id='processed_yes' value='true' onChange={onChange} />
                                        <label className='form-check-label' htmlFor='processed_yes'>Yes</label>
                                    </div>
                                    <div className='form-check form-check-inline'>
                                        <input className='form-check-input' type='radio' name='is_processed' id='processed_no' value='false' onChange={onChange} defaultChecked={true} />
                                        <label className='form-check-label' htmlFor='processed_no'>No</label>
                                    </div>
                                </div>
                            </div>
                            <div className='col-md-3'>
                                <Button disabled={isLoading} type='button' title='Apply Filter' classes='btn-primary mt-4' loading={isLoading} onClick={() => getAutoBlockUserLog(1)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className='row my-4'>
            <div className='col-12 col-md-12'>
                <div className='table-responsive'>
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'domain', title: 'Domain' },
                            { name: 'api_end_point', title: 'Api End Point' },
                            { name: 'user_id', title: 'User id' },
                            { name: 'user_subscription_status', title: 'Subscription Status', component: TableCellSubscriptionStatus },
                            { name: 'subscription_id', title: 'Subscription Id' },
                            { name: 'payment_gateway', title: 'Payment Gateway' },
                            { name: 'ip_address', title: 'IP Address' },
                            { name: 'createdAt', title: 'Date', component: TableCellTimeAgo },
                            { name: 'action', title: 'Action', component: tableCellButton }
                        ]}
                        data={autoBlockUserList}
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
    </Container>
}

export default observer(AutoBlockUserLog)
