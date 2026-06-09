import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import Table from '../table/Table'
import { Cell } from './../table/Definations'
import { ActionMeta, ValueType } from 'react-select/src/types'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import moment from 'moment'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import styled from 'styled-components'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

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

const CCBillRestApiReportingByDomain: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, CCBillRestApiReportingByDomainStore } = rootStore
    const [selectedWebsite, setSelectedWebsite] = useState<string>('')
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const { logList, isLoading, getCCBillRestApiReportingByDomain, filter } = CCBillRestApiReportingByDomainStore

    useEffect(() => {
        setInitialDates()
        getCCBillRestApiReportingByDomain(filter)
    }, [getCCBillRestApiReportingByDomain])

    const TableCellNumberToString: React.FC<Cell> = (data) => {
        const count = data.value.toString()
        return count
    }

    const handleChange = (value: ValueType<OptionType, false>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')
        if (name === 'domain') {
            filter.domain = selectedValue
        }
        setSelectedWebsite(selectedValue)
        getCCBillRestApiReportingByDomain(filter)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value
        if (name === 'is_unique') {
            filter.is_unique = e.target.checked
        }
        if (name === 'payment_gateway') {
            filter.payment_gateway = value
        }
        getCCBillRestApiReportingByDomain(filter)
    }

    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })

    const setInitialDates = () => {
        const startDate = moment().format('MM/DD/YYYY')
        const endDate = moment().format('MM/DD/YYYY')
        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        filter.start_date = startDate
        filter.end_date = endDate
        setRange({
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            key: 'selection'
        })
    }

    const handleOnClick = () => {
        const startDate = moment(range.startDate).format('MM/DD/YYYY')
        const endDate = moment(range.endDate).format('MM/DD/YYYY')
        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        filter.start_date = startDate
        filter.end_date = endDate
        openCloseDatePicker()
        getCCBillRestApiReportingByDomain(filter)
    }

    const openCloseDatePicker = () => {
        setShowDatePicker(!showDatePicker)
    }

    const handleDatePickerChange = (ranges: RangeKeyDict) => {
        setRange(ranges['selection'])
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='card'>
            <div className='card-body'>
                <form>
                    <div className='row'>
                        <div className='col-md-3'>
                            <label className='mb-2'>Date Range</label>
                            <input
                                name='date_range'
                                id='date_range'
                                className='form-control mb-3'
                                data-target='#datePicker'
                                readOnly={true}
                                value={startDateInLocalString + ' - ' + endDateInLocalString}
                                onClick={openCloseDatePicker}
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
                                            <button className='btn btn-outline-secondary me-2' onClick={openCloseDatePicker}>Close</button>
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
                            <div className='form-check form-switch mt-4'>
                                <input className='form-check-input' type='checkbox' id='is_unique' defaultChecked={true} onChange={onChange} name='is_unique' />
                                <label className='form-check-label' htmlFor='is_unique'>Is Unique?</label>
                            </div>
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mt-2'>Payment Gateway</label>
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
            </div>
        </div>
        <div className='card mt-4'>
            <div className='card-header'>CCBill Rest API Reporting By Domain</div>
            <div className='card-body'>
                <div className='table-responsive mt-3'>
                    <Table
                        unique_key='domain'
                        columns={[
                            { name: 'domain', title: 'Domain' },
                            { name: 'total', title: 'Total Transaction', component: TableCellNumberToString },
                            { name: 'success', title: 'Success Transaction', component: TableCellNumberToString },
                            { name: 'error', title: 'Error Transaction', component: TableCellNumberToString }

                        ]}
                        data={logList}
                        isLoading={isLoading}
                    ></Table>
                </div>
            </div>
        </div>
    </Container>
}

export default observer(CCBillRestApiReportingByDomain)
