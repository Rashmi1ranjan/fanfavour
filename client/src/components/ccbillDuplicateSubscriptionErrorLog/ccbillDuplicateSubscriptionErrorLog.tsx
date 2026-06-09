import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import Table from '../table/Table'
import { ActionMeta, ValueType } from 'react-select/src/types'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { Cell } from './../table/Definations'
import moment from 'moment'
import classNames from 'classnames'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

const CCbillSubscriptionErrorLog: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, CCBillDuplicateSubscriptionLogStore } = rootStore

    const [selectedWebsite, setSelectedWebsite] = useState<string>('')
    const [cardId, setCardId] = useState<string>('')
    const [userId, setUserId] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [isProcessed, setIsProcessed] = useState<string>('false')
    const [paymentGateway, setPaymentGateway] = useState<string>('')

    const filter = {
        domain: selectedWebsite,
        email: email,
        card_id: cardId,
        user_id: userId,
        is_processed: isProcessed,
        payment_gateway: paymentGateway
    }
    const { logList, totalPage, apiErrorMessage, isApiError, isLoading, currentPage, totalRows, getDuplicateSubscription, markLogProcessed } = CCBillDuplicateSubscriptionLogStore

    const changePage = (pageNUM: number) => {
        getDuplicateSubscription(pageNUM, filter)
    }

    useEffect(() => {
        getDuplicateSubscription(1, filter)
    }, [getDuplicateSubscription])

    const handleChange = (value: ValueType<OptionType, false>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')
        if (name === 'domain') {
            filter.domain = selectedValue
        }
        setSelectedWebsite(selectedValue)
        getDuplicateSubscription(1, filter)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value
        if (name === 'card_id') {
            filter.card_id = value
            setCardId(value)
        }
        if (name === 'user_id') {
            filter.user_id = value
            setUserId(value)
        }
        if (name === 'is_processed') {
            filter.is_processed = value
            setIsProcessed(value)
        }
        if (name === 'email') {
            filter.email = value
            setEmail(value)
        }
        if (name === 'payment_gateway') {
            filter.payment_gateway = value
            setPaymentGateway(value)
        }
        getDuplicateSubscription(1, filter)
    }


    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const timeToShow = `${data.value} (${timeAgo})`
        return (timeToShow)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { is_processed: boolean, _id: string }
        return (<>
            <button disabled={data.is_processed} className='btn btn-sm btn-primary' onClick={() => { markProcessed(data._id) }}>
                {data.is_processed === false && 'Mark'} Processed
            </button>
        </>)
    }

    const TableCellRequestFrom: React.FC<Cell> = (props: { value: string }) => {
        if (props.value !== '') {
            const badgeClass = props.value === 'Subscription' ? 'text-bg-info' : 'text-bg-warning'
            return (<span className={classNames('badge bg-pill', badgeClass)}>{props.value}</span>)
        }
        return (<></>)
    }

    const TableCellUserInfo = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return (<>{jsonData.user_id}<br />{jsonData.email}</>)
    }

    const markProcessed = (logId: string) => {
        markLogProcessed(logId, filter)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>

        <div className='card mt-4'>
            <div className='card-header'>
                Duplicate Subscription Error Log
            </div>
            <div className='card-body'>
                <form>
                    <div className='row'>
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
                            <label className='me-2 mb-2'>Card Id</label>
                            <input
                                name='card_id'
                                type='text'
                                className='form-control mb-3'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-2'>
                            <label className='me-2 mb-2'>Email</label>
                            <input
                                name='email'
                                type='text'
                                className='form-control mb-3'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-2'>
                            <label className='me-2 mb-2'>User Id</label>
                            <input
                                name='user_id'
                                type='text'
                                className='form-control mb-3'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-2'>
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
                        <div className='col-md-2 mt-2'>
                            <label className='me-2'>Payment Gateway</label>
                            <div>
                                <div className='form-check form-check-inline'>
                                    <input className='form-check-input' type='radio' name='payment_gateway' id='all' value='' onChange={onChange} defaultChecked={true} />
                                    <label className='form-check-label' htmlFor='all'>All</label>
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
                    </div>
                </form>
                {isLoading ?
                    'Loading..'
                    :
                    <>
                        <div className='table-responsive mt-3'>
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'domain', title: 'Domain' },
                                    { name: 'user_id', title: 'User Id, Email', component: TableCellUserInfo },
                                    { name: 'card_id', title: 'Card Id' },
                                    { name: 'card_last_four_digits', title: 'Card-Last Four digit' },
                                    { name: 'exist_in_collection', title: 'Exist in collection' },
                                    { name: 'card_decline_reason', title: 'Reason for log' },
                                    { name: 'payment_gateway', title: 'Payment Gateway' },
                                    { name: 'request_from', title: 'Request from', component: TableCellRequestFrom },
                                    { name: 'createdAt', title: 'Date', component: TableCellTimeAgo },
                                    { name: '_id', title: 'Action', component: tableCellButton }
                                ]}
                                data={logList}
                            ></Table>
                        </div>
                        <Pagination
                            totalPages={totalPage}
                            currentPage={currentPage}
                            totalItems={totalRows}
                            itemsPerPage={20}
                            onItemClick={changePage}
                        ></Pagination>
                    </>
                }
            </div>
        </div>
    </Container >
}

export default observer(CCbillSubscriptionErrorLog)
