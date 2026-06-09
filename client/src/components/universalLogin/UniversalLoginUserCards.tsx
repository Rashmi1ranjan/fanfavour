import React, { useEffect } from 'react'
import { observer } from 'mobx-react'
import moment from 'moment'
import _ from 'lodash'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import Domain from '../layout/Domain'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { Cell } from './../table/Definations'

interface Props {
    rootStore: RootStore
}

const UniversalLoginCards: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, UniversalLoginStore } = rootStore
    const {
        UniversalLoginCardDetails,
        isLoading,
        cardDetailsFilter,
        limit,
        currentPage,
        totalPage,
        totalRows,
        getUniversalCardDetails
    } = UniversalLoginStore

    useEffect(() => {
        const queryString = window.location.search
        // Parse the query string
        const params = new URLSearchParams(queryString)
        const email = _.defaultTo(params.get('email'), '')
        if (email !== '') {
            cardDetailsFilter.email = email
        }
        getUniversalCardDetails(1)
        if (window.location.search) {
            // Create a new URL without the query string
            const newUrl = window.location.origin + window.location.pathname

            // Replace the current URL in the browser's history with the new URL
            window.history.replaceState({}, document.title, newUrl)
        }
    }, [])

    const changePage = (pageNum: number) => {
        cardDetailsFilter.page = pageNum
        getUniversalCardDetails(pageNum)
    }

    const applyFilter = () => {
        cardDetailsFilter.page = 1
        getUniversalCardDetails(1)
    }

    const TableCellWebsiteLink = (objData: object) => {
        const website = _.get(objData, 'domain', '')
        const url = `https://${website}`
        return (<a href={url} target='_blank' rel='noreferrer'>{website}</a>)
    }


    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const dateFormat = moment(data.value).format('MM/DD/YYYY')
        const timeToShow: any = `${dateFormat} (${timeAgo})`
        return (timeToShow)
    }

    const TableCellUserDetails = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return (<>
            <strong>Email:&nbsp;</strong>{jsonData.email}<br />
            <strong>Domain:&nbsp;</strong>{TableCellWebsiteLink(jsonData)}
        </>)
    }

    const TableCellCardDetails = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const isCardPrimary = _.get(jsonData, 'is_primary', false)
        const isCardDeleted = _.get(jsonData, 'is_deleted', false)
        return (<>
            <strong>Name:</strong> {jsonData.card_holder_name}<br />
            <strong>Type:</strong> {jsonData.card_type}<br />
            <strong>Last Four Digit:</strong> {jsonData.card_last_four_digits}<br />
            <strong>Expire Date:</strong> {jsonData.card_expiration_month_year}<br />
            <strong>Country:</strong> {jsonData.country}<br />
            <strong>Card Id:</strong> {jsonData.card_id}<br />
            {isCardPrimary && <div><span className='badge text-bg-primary'>Primary</span></div>}
            {isCardDeleted && <div><span className='badge text-bg-danger'>Deleted</span></div>}
        </>)
    }

    const onPaymentGatewayChange = (e: any) => {
        const value = e.target.value
        cardDetailsFilter.payment_gateway = value
    }

    const onDomainChange = (value: { label: string, value: string }[]) => {
        const domainList = []
        for (const domain of value) {
            domainList.push(domain.value)
        }
        cardDetailsFilter.domain = domainList
    }

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <h4 className='card-title'>Universal Login Cards</h4>
            <div className='card'>
                <div className='card-body'>
                    <div className='row'>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Domain</label>
                            <Domain
                                onDomainChange={onDomainChange}
                                websiteStore={websiteStore}
                                loading={isLoading}
                                defaultDomain={cardDetailsFilter.domain}
                                multiSelect={true}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='mb-2'>Email</label>
                            <input
                                className='form-control mb-3'
                                value={cardDetailsFilter.email}
                                name='email'
                                onChange={(e) => { cardDetailsFilter.email = e.target.value }}
                                disabled={isLoading}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='mb-2'>Card Id</label>
                            <input
                                className='form-control mb-3'
                                value={cardDetailsFilter.card_id}
                                name='card_id'
                                onChange={(e) => { cardDetailsFilter.card_id = e.target.value }}
                                disabled={isLoading}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='mb-2'>Subscription Id</label>
                            <input
                                className='form-control mb-3'
                                value={cardDetailsFilter.subscription_id}
                                name='subscription_id'
                                onChange={(e) => { cardDetailsFilter.subscription_id = e.target.value }}
                                disabled={isLoading}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='mb-2'>Sticky IO Order Id</label>
                            <input
                                className='form-control mb-3'
                                value={cardDetailsFilter.sticky_io_order_id}
                                name='sticky_io_order_id'
                                onChange={(e) => { cardDetailsFilter.sticky_io_order_id = e.target.value }}
                                disabled={isLoading}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='mb-2'>Last 4</label>
                            <input
                                className='form-control mb-3'
                                value={cardDetailsFilter.card_last_four_digits}
                                name='card_last_four_digits'
                                onChange={(e) => { cardDetailsFilter.card_last_four_digits = e.target.value }}
                                disabled={isLoading}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='mb-2'>Card Holder Name</label>
                            <input
                                className='form-control mb-3'
                                value={cardDetailsFilter.card_holder_name}
                                name='card_holder_name'
                                onChange={(e) => { cardDetailsFilter.card_holder_name = e.target.value }}
                                disabled={isLoading}
                            />
                        </div>
                        <div className='col-md-3 mt-2'>
                            <label>Payment Gateway</label>
                            <div>
                                <div className='form-check form-check-inline'>
                                    <input
                                        className='form-check-input'
                                        type='radio'
                                        name='payment_gateway'
                                        id='payment_gateway_all'
                                        value=''
                                        onChange={onPaymentGatewayChange}
                                        defaultChecked={cardDetailsFilter.payment_gateway === '' && true}
                                        disabled={isLoading}
                                    />
                                    <label
                                        className='form-check-label'
                                        htmlFor='payment_gateway_all'
                                    >
                                        All
                                    </label>
                                </div>
                                <div className='form-check form-check-inline'>
                                    <input
                                        className='form-check-input'
                                        type='radio'
                                        name='payment_gateway'
                                        id='ccbill'
                                        value='ccbill'
                                        onChange={onPaymentGatewayChange}
                                        defaultChecked={cardDetailsFilter.payment_gateway === 'ccbill' && true}
                                        disabled={isLoading}
                                    />
                                    <label className='form-check-label' htmlFor='ccbill'>
                                        CCBill
                                    </label>
                                </div>
                                <div className='form-check form-check-inline'>
                                    <input
                                        className='form-check-input'
                                        type='radio'
                                        name='payment_gateway'
                                        id='sticky.io'
                                        value='sticky.io'
                                        onChange={onPaymentGatewayChange}
                                        defaultChecked={cardDetailsFilter.payment_gateway === 'sticky.io' && true}
                                        disabled={isLoading}
                                    />
                                    <label className='form-check-label' htmlFor='sticky.io'>
                                        Sticky.io
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className='col-md-3 mt-2'>
                            <button
                                className='btn btn-block bg-primary text-light mb-1 me-3 mt-2'
                                onClick={() => applyFilter()}
                                disabled={isLoading}
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className='table-responsive mt-3'>
                <Table
                    unique_key='_id'
                    columns={[
                        { name: 'user_details', title: 'User Details', component: TableCellUserDetails },
                        { name: 'card_id', title: 'Card Details', component: TableCellCardDetails },
                        { name: 'subscription_id', title: 'Subscription Id' },
                        { name: 'sticky_io_order_id', title: 'Sticky.Io Order Id'},
                        { name: 'payment_gateway', title: 'Payment Gateway'},
                        { name: 'createdAt', title: 'Date', component: TableCellTimeAgo}
                    ]}
                    data={UniversalLoginCardDetails}
                    isLoading={isLoading}
                ></Table>
            </div>
            {(UniversalLoginCardDetails.length > 0 && isLoading === false) &&
                <Pagination
                    totalPages={totalPage}
                    currentPage={currentPage}
                    totalItems={totalRows}
                    itemsPerPage={limit}
                    onItemClick={changePage}
                ></Pagination>
            }
        </Container>
    )

}

export default observer(UniversalLoginCards)
