import React, { useState, useMemo, SyntheticEvent } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import { Cell } from '../table/Definations'
import styled from 'styled-components'
import moment from 'moment'
import _ from 'lodash'

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

const UserLookup: React.FC<Props> = ({ rootStore }) => {
    const { UserLookupStore } = rootStore
    const { getUserLookupData, usersList, isLoading, websites, checkedSiteNumber, otherType, isCheckingOtherField, apiCallStartDateTime, apiCallEndDateTime, userListDomains } = UserLookupStore
    const [type, setType] = useState('email')
    const [text, setText] = useState('')

    const filterRecords = (e: SyntheticEvent) => {
        e.preventDefault()
        if (text === '') {
            return alert('Please enter email or card id.')
        }
        const data = {
            type,
            text
        }
        getUserLookupData(data)
    }

    const SubscriptionStatus: React.FC<Cell> = (props) => {
        return (
            <>
                {props.value === '2' ? 'Active' : props.value === '1' ? 'Active-Cancelled' : 'In Active'}
            </>
        )
    }

    const CardId: React.FC<Cell> = (data) => {
        let cards = data.value
        if (!_.isArray(cards)) {
            cards = [cards]
        }
        return (
            // TODO : assign type
            cards.length > 0 && cards.map((card: any, index: number) => {
                return (
                    <div key={index} className='mb-2'>
                        {card}
                    </div>
                )
            })
        )
    }

    const amountSpent: React.FC<Cell> = (data) => {
        return (
            <div className='text-end'>
                ${parseFloat(data.value).toFixed(2)}
            </div>
        )
    }

    const refundAmount: React.FC<Cell> = (data) => {
        return (
            <div className='text-end'>
                ${parseFloat(data.value).toFixed(2)}
            </div>
        )
    }

    const time = useMemo(() => {
        const endDate = moment(apiCallEndDateTime)
        const startDate = moment(apiCallStartDateTime)
        const duration = moment.duration(endDate.diff(startDate))
        return Math.floor(duration.asMinutes())
    }, [apiCallStartDateTime, apiCallEndDateTime])

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className='card-title'>User Lookup</h4>
        <div className='card'>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <form onSubmit={filterRecords}>
                            <div className='row'>
                                <div className='col-md-2 col-12'>
                                    <label className='me-2 mt-2 mb-2'>Lookup By</label>
                                    <div>
                                        <div className='form-check form-check-inline'>
                                            <input className='form-check-input' type='radio' name='lookup_by' id='lookup_by_email' value='email' onChange={() => setType('email')} defaultChecked={true} />
                                            <label className='form-check-label' htmlFor='lookup_by_email'>Email</label>
                                        </div>
                                        <div className='form-check form-check-inline'>
                                            <input className='form-check-input' type='radio' name='lookup_by' id='lookup_by_card' value='card' onChange={() => setType('card')} />
                                            <label className='form-check-label' htmlFor='lookup_by_card'>Card</label>
                                        </div>
                                    </div>
                                </div>
                                <div className='col-md-4 col-12'>
                                    <label className='me-2 mb-2'>{type === 'card' ? 'Card Id' : 'Email'}</label>
                                    <input
                                        name='field'
                                        type='text'
                                        className='form-control'
                                        onChange={(e) => setText(e.target.value.trim())}
                                        placeholder={type === 'card' ? 'Card Id' : 'Email'}
                                    />
                                </div>
                                <div className='col-md-4 mt-2 col-12'>
                                    <button type='submit'
                                        className='btn btn-primary mt-4'
                                        disabled={isLoading}
                                    >
                                        {isLoading === true &&
                                            <span className='spinner-border spinner-border-sm me-1' role='status' aria-hidden='true'></span>}
                                        Lookup</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div className='card-body py-0'>
            <div className='row mt-3 justify-content-center align-items-center'>
                {
                    websites.length > 0
                        ?
                        <>
                            <div className='col-lg-3'>
                                <div className='card'>
                                    <div className='card-body'>
                                        <h5 className='card-title text-center'>Total Sites</h5>
                                        <h1 className='text-center'>{websites.length}</h1>
                                    </div>
                                </div>
                            </div>
                            <div className='col-lg-3'>
                                <div className='card'>
                                    <div className='card-body'>
                                        <h5 className='card-title text-center'>Records Found From</h5>
                                        <h1 className='text-center'>{userListDomains.length} Sites</h1>
                                    </div>
                                </div>
                            </div>
                            <div className='col-lg-3'>
                                <div className='card'>
                                    <div className='card-body'>
                                        <h5 className='card-title text-center'>Total Users</h5>
                                        <h1 className='text-center text-success'>{usersList.length}</h1>
                                    </div>
                                </div>
                            </div>
                            <div className='col-lg-3'>
                                <div className='card'>
                                    <div className='card-body'>
                                        <h5 className='card-title text-center'>Total Time Consume</h5>
                                        {isLoading ? <div className='text-center'>
                                            <div className='spinner-border' role='status' style={{ color: '#c6c6c6' }}>
                                                <span className='sr-only'></span>
                                            </div>
                                        </div>
                                            :
                                            <h1 className='text-center'>{time} Minutes</h1>
                                        }
                                    </div>
                                </div>
                            </div>
                        </>
                        : null
                }
            </div>
        </div>
        <div className='row mt-3'>
            <div className='col-lg-12'>
                {isLoading &&
                    <div className='text-center mb-2'>
                        <div className='spinner-border' role='status' style={{ color: '#c6c6c6' }}>
                            <span className='sr-only'></span>
                        </div>
                        <div>
                            <>
                                {isCheckingOtherField === true ?
                                    `Checking user for ${otherType}. Progress ${checkedSiteNumber} out of ${websites.length}. `
                                    :
                                    `Progress ${checkedSiteNumber} out of ${websites.length}. `
                                }
                            </>
                            Please wait few minutes. do not refresh page.
                        </div>
                    </div>
                }
                <>
                    <div className='table-responsive'>
                        <Table
                            unique_key='_id'
                            columns={[
                                { name: 'domain', title: 'Domain' },
                                { name: 'name', title: 'Name' },
                                { name: 'email', title: 'Email' },
                                { name: 'card_id', title: 'Card ID', component: CardId },
                                { name: 'subscription_status', title: 'Subscription Status', component: SubscriptionStatus },
                                { name: 'user_amount_spent', title: 'Amount Spent', component: amountSpent },
                                { name: 'user_total_refund', title: 'Total void/refund/chargeback Amount', component: refundAmount },
                                { name: 'is_blocked', title: 'Is Blocked' }
                            ]}
                            data={usersList}
                        ></Table>
                    </div>
                </>
            </div>
        </div>
    </Container>
}

export default observer(UserLookup)
