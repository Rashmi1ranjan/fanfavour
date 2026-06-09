import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import Table from '../table/Table'
import Select from 'react-select'
import { ActionMeta, ValueType } from 'react-select/src/types'
import Pagination from '../table/Pagination'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faWindowClose } from '@fortawesome/free-solid-svg-icons'
import _ from 'lodash'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { Cell } from './../table/Definations'
import moment from 'moment'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const CCbillSuccessErrorLogs: React.FC<Props> = ({ rootStore }) => {
    const { ccbillErrorStore, websiteStore, declineCodeDescriptionStore, ccbillErrorCodeDescriptionStore } = rootStore
    const { setCcbillErrorDetails, ccbillError, filter, isLoading, currentPage, totalPage, limit, totalRows, viewCcbillErrorLogDetail, setCcbillErrorDetailById } = ccbillErrorStore
    const [showViewModel, setShowViewModel] = useState(false)
    const { getAllDeclineCodeOptions, allDeclineCodeOptions } = declineCodeDescriptionStore
    const { getAllCCBillErrorCodeOptions, allCCBillErrorCodeOptions } = ccbillErrorCodeDescriptionStore

    const changePage = (pageNUM: number) => {
        setCcbillErrorDetails(pageNUM)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value

        if (name === 'error_type') {
            filter.error_type = value
        } else if (name === 'limit') {
            filter.limit = parseInt(value)
        } else if (name === 'is_ccbill_error') {
            filter.is_ccbill_error = value
        } else if (name === 'is_recurring') {
            filter.is_recurring = value
        } else if (name === 'is_unique') {
            filter.is_unique = (e.target as HTMLInputElement).checked
        }
        setCcbillErrorDetails(1)
    }

    useEffect(() => {
        setCcbillErrorDetails(1)
        getAllDeclineCodeOptions()
        getAllCCBillErrorCodeOptions()
    }, [setCcbillErrorDetails, getAllDeclineCodeOptions, getAllCCBillErrorCodeOptions])

    const limitOptions = [
        { label: '50', value: 50 },
        { label: '100', value: 100 },
        { label: '500', value: 500 },
        { label: '1000', value: 1000 }
    ]

    const selectLimitOptions = limitOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.value}
        </option>
    ))

    const filterOptions = [
        { label: 'Charge by previous', value: 'Charge By Previous' },
        { label: 'Cancel subscription', value: 'Cancel Subscription' },
        { label: 'Get experation date cron', value: 'Get expiration date cron' }
    ]

    const selectOptions = filterOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const isCcbillErrorOptions = [
        { label: 'All', value: 'all' },
        { label: 'false', value: 'false' },
        { label: 'true', value: 'true' }
    ]

    const selectCcbillErrorOptions = isCcbillErrorOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

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

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedvalue = _.get(value, 'value', '')
        if (name === 'domain') {
            filter.domain = selectedvalue
        } else if (name === 'decline_code') {
            filter.decline_code = selectedvalue
        } else if (name === 'ccbill_error_code') {
            filter.ccbill_error_code = selectedvalue
        }
        setCcbillErrorDetails(1)
    }

    const viewDetail = (id: string) => {
        setCcbillErrorDetailById(id)
        setShowViewModel(true)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return (<>
            <div onClick={() => {
                viewDetail(jsonData._id)
            }}>
                <FontAwesomeIcon icon={faInfoCircle} />
            </div>
        </>)
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        return (timeAgo)
    }

    const handleEditDialogClose = () => {
        setShowViewModel(false)
    }

    const doptions: OptionType[] = [
        { label: 'All', value: '' }
    ]
    const dCOptions: OptionType[] = allDeclineCodeOptions.map(option => (
        { label: option.decline_code || '', value: option.decline_code || '' }
    ))
    doptions.push(...dCOptions)

    const selecteddOption = _.find(doptions, (item: OptionType) => {
        return item.value === filter.decline_code
    })

    const coptions: OptionType[] = [
        { label: 'All', value: '' }
    ]
    const CEOptions: OptionType[] = allCCBillErrorCodeOptions.map(option => (
        { label: option.ccbill_error_code || '', value: option.ccbill_error_code || '' }
    ))
    coptions.push(...CEOptions)

    const selectedCOption = _.find(coptions, (item: OptionType) => {
        return item.value === filter.ccbill_error_code
    })

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>

        <div className='card mt-4'>
            <div className='card-header'>
                CCbill Error Log
            </div>
            <div className='card-body'>
                <form>
                    <div className='row'>
                        <div className='col-md-2'>
                            <label className='me-2 mb-2'>Records Limit</label>
                            <select
                                className='form-control form-select mb-3'
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
                            <label className='me-2 mb-2'>Type</label>
                            <select
                                className='form-control form-select mb-3'
                                id='error_type'
                                name='error_type'
                                onChange={onChange}>
                                {selectOptions}
                            </select>
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Is CCBill Error</label>
                            <select
                                className='form-control form-select mb-3'
                                id='is_ccbill_error'
                                name='is_ccbill_error'
                                onChange={onChange}>
                                {selectCcbillErrorOptions}
                            </select>
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Decline Code</label>
                            <Select
                                name='decline_code'
                                value={selecteddOption}
                                onChange={handleChange}
                                options={doptions}
                                isMulti={false}
                                className='mb-3'
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>CCBill Error Code</label>
                            <Select
                                name='ccbill_error_code'
                                value={selectedCOption}
                                onChange={handleChange}
                                options={coptions}
                                isMulti={false}
                                className='mb-3'
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Is Recurring</label>
                            <select
                                className='form-control form-select mb-3'
                                id='is_recurring'
                                name='is_recurring'
                                onChange={onChange}>
                                {selectIsRecurringOptions}
                            </select>
                        </div>
                        <div className='col-md-2'>
                            <div className='form-check form-switch mt-4'>
                                <input className='form-check-input' type='checkbox' id='is_unique' defaultChecked={true} onChange={onChange} name='is_unique' />
                                <label className='form-check-label' htmlFor='is_unique'>Is Unique?</label>
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
                                    { name: 'domain', title: 'DOMAIN' },
                                    { name: 'error_from', title: 'ERROR FROM' },
                                    { name: 'ccbill_error_code', title: 'CCBILL ERROR CODE' },
                                    { name: 'decline_code', title: 'DECLINE CODE' },
                                    { name: 'is_ccbill_error', title: 'IS CCBILL ERROR' },
                                    { name: 'approved', title: 'APPROVED' },
                                    { name: 'is_recurring', title: 'IS RECURRING' },
                                    { name: 'created_at', title: 'DATE' },
                                    { name: 'created_at', title: 'TIME AGO', component: TableCellTimeAgo },
                                    { name: 'action', title: 'VIEW', component: tableCellButton }
                                ]}
                                data={ccbillError}
                            ></Table>
                        </div>
                        <Pagination
                            totalPages={totalPage}
                            currentPage={currentPage}
                            totalItems={totalRows}
                            itemsPerPage={limit}
                            onItemClick={changePage}
                        ></Pagination>
                    </>
                }
            </div>
        </div>
        {showViewModel ?
            <div className='modal fade show' role='dialog' style={{ display: 'block', backgroundColor: '#00000080' }
            } >
                <div className='modal-dialog modal-dialog-centered modal-lg'>
                    <div className='modal-content'>
                        <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                            <h5 className='modal-title'>CCBill Error Log Detail</h5>
                            <div onClick={() => {
                                handleEditDialogClose()
                            }} style={{ cursor: 'pointer' }}>
                                <FontAwesomeIcon icon={faWindowClose} />
                            </div>
                        </div>
                        <div className='modal-body' style={{ display: 'contents', lineHeight: 'normal' }}>
                            <div className='container'>
                                <div className='row mt-3'>
                                    <div className='col-md-4'>
                                        domain:
                                    </div>
                                    <div className='col-md-8'>
                                        <span>
                                            {viewCcbillErrorLogDetail.domain}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        error from:
                                    </div>
                                    <div className='col-md-8'>
                                        <span>
                                            {viewCcbillErrorLogDetail.error_from}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        Approved:
                                    </div>
                                    <div className='col-md-8'>
                                        <span>
                                            {viewCcbillErrorLogDetail.approved}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        Is CCBill Error:
                                    </div>
                                    <div className='col-md-8'>
                                        <span>
                                            {viewCcbillErrorLogDetail.is_ccbill_error?.toString()}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        url:
                                    </div>
                                    <div className='col-md-8'>
                                        <span className={'text-break'}>
                                            {viewCcbillErrorLogDetail.url}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        response:
                                    </div>
                                    <div className='col-md-8'>
                                        <span className={'text-break'}>
                                            {viewCcbillErrorLogDetail.response}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        ccbill error code:
                                    </div>
                                    <div className='col-md-8'>
                                        <span>
                                            {viewCcbillErrorLogDetail.ccbill_error_code}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>
                                        decline code:
                                    </div>
                                    <div className='col-md-8'>
                                        <span>
                                            {viewCcbillErrorLogDetail.decline_code}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                            </div>
                        </div>
                    </div>
                </div>
            </div > : null}
    </Container >
}

export default observer(CCbillSuccessErrorLogs)
