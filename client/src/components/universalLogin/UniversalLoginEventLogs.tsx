import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import moment from 'moment'
import _ from 'lodash'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import Domain from '../layout/Domain'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import DateRange from '../utils/DateRange'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import styled from 'styled-components'
import Select from 'react-select'
import JsonView from 'react18-json-view'

import {
    ADD_ACCOUNT,
    ADD_NEW_CARD,
    ADD_NEW_CARD_ERROR,
    CHANGE_PAYMENT_METHOD,
    CHANGE_PAYMENT_METHOD_ERROR,
    ERROR_WHILE_FETCHING_CARD_DETAILS,
    REGISTER,
    REGISTER_ERROR,
    REMOVE_CARD,
    REMOVE_CARD_ERROR,
    RESET_PASSWORD,
    RESET_PASSWORD_ERROR,
    UPDATE_PASSWORD,
    UPDATE_PASSWORD_ERROR,
    MERGE_ACCOUNT,
    LOGIN_MERGE,
    UPDATE_PRIMARY_CARD,
    UPDATE_PRIMARY_CARD_ERROR,
    UPDATE_USER_DETAILS_IN_WEBSITE_ERROR,
    UPDATE_EMAIL,
    UPDATE_EMAIL_ERROR,
    MERGE_ACCOUNT_FROM_RESET_PASSWORD,
    GET_USER_DETAIL_ERROR,
    UPDATE_BLOCK_STATUS,
    UPDATE_BLOCK_STATUS_ERROR,
    DELETE_USER,
    DELETE_USER_ERROR,
    BLOCK_UNIVERSALLY,
    BLOCK_UNIVERSALLY_ERROR
} from '../../utils/constant'

interface Props {
    rootStore: RootStore
}

const StyledTable = styled.table`
    min-width:350px;
`
const StyledTd = styled.td`
    vertical-align: top;
    padding-left:5px;
    padding-right:2rem;
`
const ModalBody = styled.div`
    max-height: 80vh;
    overflow-y: scroll;
`

const EventFilter = (props: any) => {
    const { filter, eventsList, loading } = props
    const selectedOptions = filter.event
    let defaultValue = null

    if (selectedOptions.length > 0) {
        defaultValue = []
        eventsList.map((event: any) => {
            if (selectedOptions.includes(event.value)) {
                defaultValue.push(event)
            }
        })
    }
    const onChange = (selectedOptions: any) => {
        filter.event = selectedOptions.map((event: { label: string, value: string }) => event.value)
    }

    return (
        <Select
            defaultValue={defaultValue}
            onChange={onChange}
            options={eventsList}
            isMulti={true}
            isDisabled={loading}
        />
    )
}

const UniversalLoginEventLogs: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, UniversalLoginLogsStore } = rootStore
    const [userLog, setUserLog] = useState<{ meta: object, event: string, domain: string, email: string, createdAt: string }>({ meta: {}, domain: '', email: '', event: '', createdAt: '' })
    const [showEventDetails, setShowEventDetails] = useState(false)
    const {
        isLoading,
        filter,
        dataRow,
        limit,
        currentPage,
        totalPage,
        totalRows,
        isApiError,
        getEventLogs
    } = UniversalLoginLogsStore

    const eventsList = [
        { label: 'Register', value: REGISTER },
        { label: 'Register (Error)', value: REGISTER_ERROR },
        { label: 'Login (Merge)', value: LOGIN_MERGE },
        { label: 'Update Password', value: UPDATE_PASSWORD },
        { label: 'Update Password (Error)', value: UPDATE_PASSWORD_ERROR },
        { label: 'Reset Password', value: RESET_PASSWORD },
        { label: 'Reset Password (Error)', value: RESET_PASSWORD_ERROR },
        { label: 'Merge Account', value: MERGE_ACCOUNT },
        { label: 'Add Account', value: ADD_ACCOUNT },
        { label: 'Add New Card', value: ADD_NEW_CARD },
        { label: 'Add New Card (Error)', value: ADD_NEW_CARD_ERROR },
        { label: 'Change Payment Method', value: CHANGE_PAYMENT_METHOD },
        { label: 'Change Payment Method (Error)', value: CHANGE_PAYMENT_METHOD_ERROR },
        { label: 'Update Primary Card', value: UPDATE_PRIMARY_CARD },
        { label: 'Update Primary Card (Error)', value: UPDATE_PRIMARY_CARD_ERROR },
        { label: 'Remove Card', value: REMOVE_CARD },
        { label: 'Remove Card (Error)', value: REMOVE_CARD_ERROR },
        { label: 'Get Card Details (Error)', value: ERROR_WHILE_FETCHING_CARD_DETAILS },
        { label: 'Update user details in website (Error)', value: UPDATE_USER_DETAILS_IN_WEBSITE_ERROR },
        { label: 'Update Email', value: UPDATE_EMAIL },
        { label: 'Update Email (Error)', value: UPDATE_EMAIL_ERROR },
        { label: 'Merge Account (Reset Password)', value: MERGE_ACCOUNT_FROM_RESET_PASSWORD },
        { label: 'Get User Details (Error)', value: GET_USER_DETAIL_ERROR },
        { label: 'Update User Block Status', value: UPDATE_BLOCK_STATUS },
        { label: 'Update User Block Status (Error)', value: UPDATE_BLOCK_STATUS_ERROR },
        { label: 'Delete User Account', value: DELETE_USER },
        { label: 'Delete User Account (Error)', value: DELETE_USER_ERROR },
        { label: 'Block User Universally', value: BLOCK_UNIVERSALLY },
        { label: 'Block User Universally (Error)', value: BLOCK_UNIVERSALLY_ERROR }
    ]

    useEffect(() => {
        const queryString = window.location.search
        // Parse the query string
        const params = new URLSearchParams(queryString)
        const email = _.defaultTo(params.get('email'), '')
        if (email !== '') {
            filter.email = email
        }
        getEventLogs()
        if (window.location.search) {
            // Create a new URL without the query string
            const newUrl = window.location.origin + window.location.pathname

            // Replace the current URL in the browser's history with the new URL
            window.history.replaceState({}, document.title, newUrl)
        }
    }, [])

    const onDateChange = (start_date: string, end_date: string) => {
        filter.start_date = moment(start_date).format('MM/DD/YYYY')
        filter.end_date = moment(end_date).format('MM/DD/YYYY')
    }

    const onDomainChange = (value: any) => {
        const domains = []
        for (const domain of value) {
            domains.push(domain.value)
        }
        filter.domain = domains
    }

    const changePage = (pageNum: number) => {
        filter.page = pageNum
        getEventLogs()
    }

    const applyFilter = () => {
        filter.page = 1
        getEventLogs()
    }

    const TableCellWebsiteLink = (objData: object) => {
        const website = _.get(objData, 'value', '')
        const url = `https://${website}`
        return (<a href={url} target='_blank' rel='noreferrer'>{website}</a>)
    }

    const TableCellFormatEvent = (objData: { value: string }) => {
        const event = _.get(objData, 'value', '')
        const _eventsList = eventsList.filter(eventObject => eventObject.value === event)
        return (<> {_eventsList[0] ? _eventsList[0].label : event}</>)
    }

    const TableCellFormatDate = (objData: object) => {
        const date = _.get(objData, 'value', '')
        if (date === '') {
            return (<></>)
        }
        const formatDate = moment(date).format('MM/DD/YYYY HH:mm:ss')
        return (<>{formatDate} ({moment(date).fromNow()})</>)
    }

    const TableCellEventDetails = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        if (!jsonData.meta) {
            return <></>
        }
        return (<span className='px-1' style={{ cursor: 'pointer' }} onClick={() => { viewDetail(jsonData) }}>
            <FontAwesomeIcon icon={faInfoCircle} />
        </span>)
    }

    const viewDetail = (data: any) => {
        document.body.style.overflow = 'hidden'
        setUserLog(data)
        setShowEventDetails(true)
    }

    const getUserDetails = () => {
        const { email, event, domain, createdAt } = userLog
        const _eventsList = eventsList.filter(eventObject => eventObject.value === event)
        return <>
            <div className="row text-muted mb-3 px-1">
                <div className='col-auto' >
                    <b>Email :</b> <br />
                    <b>Event :</b><br />
                    <b>Domain :</b><br />
                    <b>Date :</b><br />
                </div>
                <div className='col-auto' >
                    <span>{email}</span><br />
                    <span>{_eventsList[0] ? _eventsList[0].label : event}</span><br />
                    <span>{domain}</span><br />
                    <span>{moment(createdAt).format('MM/DD/YYYY HH:mm:ss')}({moment(createdAt).fromNow()})</span>
                </div>
            </div>
        </>
    }

    const popupMetaDataDetails = Object.entries(userLog.meta).map((data, index) => {
        const metaData = _.isObject(data[1]) ? <JsonView enableClipboard={false} src={data[1]} /> : data[1].toString()
        return (
            <tr key={data[0]}>
                <StyledTd>{data[0]}</StyledTd>
                <StyledTd>{metaData}</StyledTd>
            </tr>
        )
    })

    const eventsOptions = eventsList.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <h4 className='card-title'>Universal Login Logger</h4>
            <div className='card'>
                <div className='card-body'>
                    <div className='row'>
                        <div className='col-md-3'>
                            <DateRange
                                title='Date Range'
                                id='date_range'
                                name='date_range'
                                startDate={filter.start_date}
                                endDate={filter.end_date}
                                onDateChange={onDateChange}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Domain</label>
                            <Domain
                                onDomainChange={onDomainChange}
                                websiteStore={websiteStore}
                                loading={isLoading}
                                defaultDomain={filter.domain}
                                multiSelect={true}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='mb-2'>Email</label>
                            <input
                                className='form-control mb-3'
                                value={filter.email}
                                name='email'
                                onChange={(e) => { filter.email = e.target.value }}
                                disabled={isLoading}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Events</label>
                            <EventFilter
                                filter={filter}
                                eventsList={eventsList}
                                loading={isLoading}
                            ></EventFilter>
                        </div>

                        <div className='col-md-3'>
                            <button
                                className='btn btn-block bg-primary text-light mb-1 me-3 mt-2'
                                onClick={() => applyFilter()}
                                disabled={isLoading}
                            >
                                Apply Filter
                            </button>
                            {/* TODO:Add option to export csv of filtered results */}
                        </div>
                    </div>
                </div>
            </div>
            {isApiError ?
                <div className='responsive alert alert-danger p-3 my-3 rounded'>
                    Error while getting universal login event logs
                </div>
                :
                <>
                    <div className='table-responsive mt-3'>
                        <Table
                            unique_key='_id'
                            columns={[
                                { name: 'domain', title: 'Domain', component: TableCellWebsiteLink },
                                { name: 'email', title: 'Email' },
                                { name: 'event', title: 'Event', component: TableCellFormatEvent },
                                { name: 'createdAt', title: 'Date', component: TableCellFormatDate },
                                { name: 'details', title: 'Log Details', component: TableCellEventDetails }
                            ]}
                            data={dataRow}
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
                </>
            }
            {showEventDetails &&
                <div className='modal fade show' style={{ display: 'block', backgroundColor: '#00000080', overflow: 'hidden' }}>
                    <div className='modal-dialog modal-dialog-centered justify-content-center'>
                        <div className='modal-content' style={{ width: 'max-content', margin: 'auto' }}>
                            <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                                <b>Log Details</b>
                                <div style={{ cursor: 'pointer' }} className='p-1' onClick={() => {
                                    document.body.style.overflow = 'scroll'
                                    setShowEventDetails(false)
                                }}>
                                    <FontAwesomeIcon icon={faXmark} />
                                </div>
                            </div>
                            <ModalBody className='modal-body'>
                                {getUserDetails()}
                                <StyledTable className="table table-bordered table-hover table-sm">
                                    {popupMetaDataDetails}
                                </StyledTable>
                            </ModalBody>
                        </div>
                    </div>
                </div>
            }
        </Container>
    )
}

export default observer(UniversalLoginEventLogs)
