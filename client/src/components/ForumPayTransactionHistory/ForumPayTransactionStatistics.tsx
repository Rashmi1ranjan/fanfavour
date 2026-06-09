import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import _ from 'lodash'
import { ActionMeta, ValueType } from 'react-select/src/types'
import DateRange from './../utils/DateRange'
import { ToastContainer } from 'react-toastify'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const ForumPayTransactionHistory: React.FC<Props> = ({ rootStore }) => {
    const { ForumPayTransactionStatisticsStore, websiteStore } = rootStore
    const {
        getForumpayTransactionStatisticsList,
        filter,
        balance,
        isLoading
    } = ForumPayTransactionStatisticsStore

    useEffect(() => {
        getForumpayTransactionStatisticsList()
    }, [getForumpayTransactionStatisticsList])

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value.trim()
        _.set(filter, name, value)
    }

    const handleChange = (value: ValueType<OptionType, false>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')
        if (name === 'domain') {
            filter.domain = selectedValue
        }
    }

    const filterRecords = () => {
        getForumpayTransactionStatisticsList()
    }

    const onDateChange = (start_date: string, end_date: string) => {
        filter.start_date = start_date
        filter.end_date = end_date
    }

    const formatAmount = (amount: number) => {
        const formatAmount = amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        return '$ ' + formatAmount
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='card mt-4'>
            <div className='card-body'>
                <ToastContainer
                    position='top-right'
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
                <form>
                    <div className='row'>
                        <div className='col-md-3'>
                            <DateRange
                                title='Date Range'
                                id='date_range'
                                name='date_range'
                                startDate={''}
                                endDate={''}
                                onDateChange={onDateChange}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Website</label>
                            <Domain
                                onDomainChange={handleChange}
                                websiteStore={websiteStore}
                                defaultDomain={filter.domain}
                                loading={isLoading}
                                multiSelect={false}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>User Id</label>
                            <input
                                name='user_id'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3 mt-3'>
                            <button type='button'
                                className='btn btn-primary mt-3 me-2'
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
        <h4 className='mt-3 mb-2'>ForumPay Transaction Stat</h4>
        <div className='row mt-2'>
            <div className='col-12'>
                <div className='row'>
                    <div className='col-md-4'>
                        <div className='card'>
                            <div className='card-body pb-0 d-flex'>
                                <h4 className='mb-2 me-2'>Total Credit: </h4>
                                <h4 className='pe-2 text-success'>{formatAmount(Number(balance.total_credit))} </h4>
                            </div>
                        </div>
                    </div>
                    <div className='col-md-4'>
                        <div className='card'>
                            <div className='card-body pb-0 d-flex'>
                                <h4 className='mb-2 me-2'>Total Debit: </h4>
                                <h4 className='pe-2 text-danger'>{formatAmount(Number(balance.total_debit))} </h4>
                            </div>
                        </div>
                    </div>
                    <div className='col-md-4'>
                        <div className='card'>
                            <div className='card-body pb-0 d-flex'>
                                <h4 className='mb-2 me-2'>Available Balance: </h4>
                                <h4 className='pe-2 text-primary'>{formatAmount(Number(balance.total_balance))} </h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Container>
}

export default observer(ForumPayTransactionHistory)
