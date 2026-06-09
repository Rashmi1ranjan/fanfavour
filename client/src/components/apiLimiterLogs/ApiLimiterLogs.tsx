import React, { useEffect, useState, useRef } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import Pagination from '../table/Pagination'
import moment from 'moment'
import _ from 'lodash'
import styled from 'styled-components'
import { ActionMeta, ValueType } from 'react-select/src/types'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

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
interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const ApiLimiter: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, ApiLimiterReport } = rootStore
    const { getApiLimiterLogsList, apiLimiterData, currentPage, totalPage, limit, totalRows, filter } = ApiLimiterReport
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [userId, setUserId] = useState('')
    const [ipAddress, setIpAddress] = useState('')
    const [apiEndPoint, setApiEndPoint] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const [domain, setDomain] = useState('')

    useEffect(() => {
        getApiLimiterLogsList(1, () => {
            setIsLoading(false)
        })
    }, [getApiLimiterLogsList])

    const changePage = (pageNum: number) => {
        setIsLoading(true)
        getApiLimiterLogsList(pageNum, () => {
            setIsLoading(false)
        })
    }

    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })

    const setInitialDates = () => {
        const yesterdayDate = moment().subtract(1, 'days').format('MM/DD/YYYY')

        setStartDate(yesterdayDate)
        setEndDate(yesterdayDate)

        setStartDateInLocalString(yesterdayDate)
        setEndDateInLocalString(yesterdayDate)
        filter.start_date = yesterdayDate
        filter.end_date = yesterdayDate
    }

    const handleDomainChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')
        if (name === 'domain') {
            filter.domain = selectedValue
        }
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value
        if (name === 'user_id') {
            setUserId(value)
        }
        if (name === 'ip_address') {
            setIpAddress(value)
        }
        if (name === 'api_end_point') {
            setApiEndPoint(value)
        }
    }

    const openCloseDatePicker = () => {
        setShowDatePicker(!showDatePicker)
    }

    const handleChange = (ranges: RangeKeyDict) => {
        setRange(ranges['selection'])
    }

    const handleOnClick = () => {
        setStartDate(moment(range.startDate).format('MM/DD/YYYY'))
        setEndDate(moment(range.endDate).format('MM/DD/YYYY'))
        const startDate = moment(range.startDate).format('YYYY-MM-DDT00:00:00')
        const endDate = moment(range.endDate).format('YYYY-MM-DDT23:59:59')
        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        filter.start_date = startDate
        filter.end_date = endDate
        openCloseDatePicker()
    }

    const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
        setIsLoading(true)
        e.preventDefault()
        if (startDate === undefined || endDate === undefined) {
            alert('Please select date')
            setIsLoading(false)
        } else {
            filter.user_id = userId
            filter.ip_address = ipAddress
            filter.api_end_point = apiEndPoint
            getApiLimiterLogsList(1, () => {
                setIsLoading(false)
            })
            setIsLoading(true)
        }
    }

    const handleReset = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        filter.start_date = ''
        filter.end_date = ''
        filter.user_id = ''
        filter.domain = ''
        filter.ip_address = ''
        filter.api_end_point = ''
        setDomain('All')
        setStartDate('')
        setEndDate('')
        setUserId('')
        setIpAddress('')
        setApiEndPoint('')
        getApiLimiterLogsList(1, () => {
            setIsLoading(false)
        })
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='card mt-4'>
            <div className='card-header'>
                API Limiter Report List
            </div>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12'>
                        <form>
                            <div className='row'>
                                <div className='col-md-4 col-12'>
                                    <label className='mb-2'>Date Range</label>
                                    <input
                                        name='date_range'
                                        id='date_range'
                                        className='form-control mb-3'
                                        data-target='#datePicker'
                                        readOnly={true}
                                        value={(startDate === '' && endDate === '') ? '-' : startDateInLocalString + ' - ' + endDateInLocalString}
                                        onClick={openCloseDatePicker}
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
                                                        onChange={handleChange} />

                                                </div>
                                                <div className='card-footer text-end'>
                                                    <button className='btn btn-outline-secondary me-2' onClick={openCloseDatePicker}>Close</button>
                                                    <button className='btn btn-outline-primary' onClick={handleOnClick} >Apply</button>
                                                </div>
                                            </div>
                                        )
                                        : null
                                    }
                                </div>
                                <div className='col-md-4 col-12'>
                                    <label className='me-2 mb-2'>Domain</label>
                                    <Domain
                                        onDomainChange={handleDomainChange}
                                        websiteStore={websiteStore}
                                        loading={isLoading}
                                        defaultDomain={filter.domain}
                                        multiSelect={false}
                                    />
                                </div>
                                <div className='col-md-4 col-12'>
                                    <label className='mb-2'>User Id</label>
                                    <input type='text' className='form-control mb-3' autoComplete={'off'} value={userId} name='user_id' onChange={onChange} id='user_id' />
                                </div>
                                <div className='col-md-4 col-12'>
                                    <label className='mb-2'>IP Address</label>
                                    <input type='text' className='form-control mb-3' autoComplete={'off'} value={ipAddress} name='ip_address' onChange={onChange} id='ip_address' />
                                </div>
                                <div className='col-md-4 col-12'>
                                    <label className='mb-2'>API End Point</label>
                                    <input type='text' className='form-control mb-3' autoComplete={'off'} value={apiEndPoint} name='api_end_point' onChange={onChange} id='api_end_point' />
                                </div>
                                <div className='col-md-4 col-12 mt-auto'>
                                    <button className='btn btn-block bg-primary text-light mb-3 me-3'
                                        onClick={(e) => handleSubmit(e)}
                                        disabled={isLoading}
                                    >Submit</button>
                                    <button className='btn btn-block bg-primary text-light mb-3'
                                        onClick={(e) => handleReset(e)}
                                        disabled={isLoading}
                                    >Reset</button>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className='col-12 card-body px-0'>
                        <div className='table-responsive mt-3'>
                            {isLoading === true &&
                                <Loader>
                                    <div className='spinner-border' role='status'>
                                        <span className='sr-only'>Loading...</span>
                                    </div>
                                </Loader>
                            }
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'user_id', title: 'User Id' },
                                    { name: 'domain', title: 'Domain Name' },
                                    { name: 'ip_address', title: 'Ip Address' },
                                    { name: 'created_at', title: 'Date and Time' },
                                    { name: 'api_end_point', title: 'Api End Point' }
                                ]}
                                data={apiLimiterData}
                            ></Table>
                        </div>
                        <Pagination
                            totalPages={totalPage}
                            currentPage={currentPage}
                            totalItems={totalRows}
                            itemsPerPage={limit}
                            isLoading={isLoading}
                            onItemClick={changePage}
                        ></Pagination>
                    </div>
                </div>
            </div>
        </div>
    </Container>

}

export default observer(ApiLimiter)
