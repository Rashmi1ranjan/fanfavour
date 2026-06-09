import { observer } from 'mobx-react'
import React, { useState, useEffect } from 'react'
import moment from 'moment'
import _ from 'lodash'
import { ActionMeta, ValueType } from 'react-select/src/types'
import styled from 'styled-components'
import { toJS } from 'mobx'

import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faTimes } from '@fortawesome/free-solid-svg-icons'

import RootStore from '../../store/Root'

import Container from '../layout/Container'
import Pagination from '../table/Pagination'
import Table from '../table/Table'
import Button from '../utils/Button'
import Domain from '../layout/Domain'
import { OptionType, ResubscriptionOfferDetail } from '../../types/types'

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

const ResubscriptionReport: React.FC<Props> = ({ rootStore }) => {

    const { ResubscriptionReport, websiteStore } = rootStore

    const {
        filter,
        currentPage,
        totalPage,
        limit,
        totalRows,
        isLoading,
        resubscriptionReport,
        resubscriptionOfferDetail,
        setResubscriptionOfferDetail,
        getResubscriptionReport
    } = ResubscriptionReport

    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const [showViewModel, setShowViewModel] = useState(false)
    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })

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

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name as string
        const selectedValue = _.get(value, 'value', '')
        _.set(filter, name, selectedValue)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value.trim()
        _.set(filter, name, value)
    }

    const changePage = (pageNum: number) => {
        getResubscriptionReport(pageNum)
    }

    useEffect(() => {
        getResubscriptionReport(1)
    }, [])

    const subscriptionDetail = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { subscription_detail: { recurring_price: number, initial_price: number } }
        const jsonData = toJS(data)
        return (<>
            <b>Recurring price</b>:<br />${jsonData.subscription_detail.recurring_price.toFixed(2)} <br />
            <b>Initial price</b>:<br />${jsonData.subscription_detail.initial_price.toFixed(2)}
        </>)
    }

    const userDetail = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { domain: string, user_id: string, name: string, email: string, subscription_payment_gateway: string, total_amount_spent: number, total_amount_spent_since_last_subscription: number }
        const jsonData = toJS(data)
        const websiteUrl = (/(http(s?)):\/\//i.test(jsonData.domain)) === true ? jsonData.domain : `https://${jsonData.domain}`
        const userChatId = `${websiteUrl}/private-chat/${jsonData.user_id}`
        const totalAmountSpent = _.get(jsonData, 'total_amount_spent', '')
        const totalAmountSpentSinceLastSubscription = _.get(jsonData, 'total_amount_spent_since_last_subscription', '')
        return (<>
            <b>ID</b>: <a href={userChatId} target='_blank' rel='noreferrer'>{jsonData.user_id}</a> <br />
            <b>Name</b>: {jsonData.name}<br />
            <b>Email</b>: {jsonData.email}<br />
            <b>Subscription payment gateway</b>: {jsonData.subscription_payment_gateway}<br />
            {totalAmountSpent !== '' &&
                <><b>Total Amount Spent </b>: ${totalAmountSpent.toFixed(2)}<br /></>
            }
            {totalAmountSpentSinceLastSubscription !== '' &&
                <><b>Total Amount Spent Since Last Subscription</b>: ${totalAmountSpentSinceLastSubscription.toFixed(2)}<br /></>
            }
        </>)
    }

    const viewDetail = (objData: object | ResubscriptionOfferDetail) => {
        setResubscriptionOfferDetail(objData as ResubscriptionOfferDetail)
        setShowViewModel(true)
    }

    const resubscriptionOffer = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { resubscription_offer_detail: { title: '' } }
        const jsonData = toJS(data)
        const resubscriptionOfferDetail = jsonData.resubscription_offer_detail
        return (<>
            <b>Offer Title:</b><br />{resubscriptionOfferDetail.title}&nbsp;&nbsp;
            <div className='d-inline-block' onClick={() => viewDetail(resubscriptionOfferDetail)}><FontAwesomeIcon icon={faInfoCircle} /></div>
        </>)
    }

    const formateTime = (date: string) => {
        const timeAgo = moment.utc(date).fromNow()
        const dateFormat = moment.utc(date).format('MMMM Do YYYY hh:mm:ss a')
        return (<>{dateFormat} ({timeAgo})</>)
    }

    const registrationDate = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { registration_date: string, subscription_date: string }
        const jsonData = toJS(data)
        return (<>
            <b>Registration Date</b>:<br />{formateTime(jsonData.registration_date)}<br />
            <b>Subscription Date</b>:<br />{formateTime(jsonData.subscription_date)}<br />
        </>)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className='card-title'>Resubscription Report</h4>
        <div className='card'>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <form>
                            <div className='row'>
                                <div className='col-md-3'>
                                    <label className='me-2 mb-2'>Created Date Range</label>
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
                                    <label className='me-2 mb-2'>Email</label>
                                    <input
                                        name='email'
                                        type='text'
                                        className='form-control'
                                        onChange={onChange}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className='col-md-3'>
                                    <label className='me-2 mb-2'>User ID</label>
                                    <input
                                        name='user_id'
                                        type='text'
                                        className='form-control'
                                        onChange={onChange}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className='col-md-3 mt-3'>
                                    <label className='me-2 mb-2'>Offer ID</label>
                                    <input
                                        name='offer_id'
                                        type='text'
                                        className='form-control'
                                        onChange={onChange}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className='col-md-3' style={{ marginTop: '47px' }}>
                                    <Button disabled={isLoading} type='button' title='Apply Filter' classes='btn-primary' loading={isLoading} onClick={() => getResubscriptionReport(1)} />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div >
        <div className='mt-4'>
            <div>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <div className='table-responsive mt-3'>
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'domain', title: 'Domain' },
                                    { name: 'user detail', title: 'User Detail', component: userDetail },
                                    { name: 'subscription_detail', title: 'Subscription Detail', component: subscriptionDetail },
                                    { name: 'registration_date', title: 'Date', component: registrationDate },
                                    { name: 'resubscription_offer_detail', title: 'Resubscription Offer Detail', component: resubscriptionOffer }
                                ]}
                                isLoading={isLoading}
                                data={resubscriptionReport}
                            ></Table>
                        </div>
                        <Pagination
                            totalPages={totalPage}
                            currentPage={currentPage}
                            totalItems={totalRows}
                            itemsPerPage={limit}
                            onItemClick={changePage}
                            isLoading={isLoading}
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
                            <h5 className='modal-title' style={{ cursor: 'pointer' }}>Resubscription Offer Detail</h5>
                            <div onClick={() => setShowViewModel(false)} style={{ marginRight: '10px', cursor: 'pointer' }}>
                                <FontAwesomeIcon icon={faTimes} />
                            </div>
                        </div>
                        <div className='modal-body'>
                            <div className='container'>
                                <div className='row mt-3'>
                                    <div className='col-md-6'>
                                        Id:
                                    </div>
                                    <div className='col-md-6'>
                                        <span>
                                            {resubscriptionOfferDetail.id}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-6'>
                                        Title:
                                    </div>
                                    <div className='col-md-6'>
                                        <span>
                                            {resubscriptionOfferDetail.title}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-6'>
                                        User should be active for at least:
                                    </div>
                                    <div className='col-md-6'>
                                        <span>
                                            {resubscriptionOfferDetail.user_min_active_month} {resubscriptionOfferDetail.user_min_active_month > 1 ? 'Months' : 'Month'}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-6'>
                                        Recurring price:
                                    </div>
                                    <div className='col-md-6'>
                                        <span>
                                            ${resubscriptionOfferDetail.recurring_price}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-6'>
                                        User should spend this amount at least:
                                    </div>
                                    <div className='col-md-6'>
                                        <span>
                                            ${resubscriptionOfferDetail.user_min_amount_spend ? resubscriptionOfferDetail.user_min_amount_spend : '0.00'}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row mt-3'>
                                    <div className='col-md-6'>
                                        Give free months of subscription:
                                    </div>
                                    <div className='col-md-6'>
                                        <span>
                                            {resubscriptionOfferDetail.give_free_month_subscription > 1 ? `${resubscriptionOfferDetail.give_free_month_subscription} Months` : (resubscriptionOfferDetail.give_free_month_subscription === -1 ? 'Life time Free' : `${resubscriptionOfferDetail.give_free_month_subscription} Month`)}
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

export default observer(ResubscriptionReport)
