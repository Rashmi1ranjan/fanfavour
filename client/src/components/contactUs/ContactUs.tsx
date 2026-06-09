import React, { useState, useEffect } from 'react'
import _ from 'lodash'
import moment from 'moment'
import styled from 'styled-components'
import { observer } from 'mobx-react'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { ActionMeta, ValueType } from 'react-select/src/types'
import Button from '../utils/Button'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { toJS } from 'mobx'
import { Cell } from './../table/Definations'
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

const ContactUs: React.FC<Props> = ({ rootStore }) => {

    const { ContactUsStore, websiteStore, authStore } = rootStore
    const {
        filter,
        currentPage,
        totalPage,
        limit,
        totalRows,
        isLoading,
        showAllProcessedBtn,
        contactUsEmailList,
        getContactUsEmailList,
        markAllEmailProcessed,
        markProcessed
    } = ContactUsStore
    const { currentUser } = authStore
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })

    useEffect(() => {
        getContactUsEmailList(1)
    }, [getContactUsEmailList])

    const handleDatePickerChange = (ranges: RangeKeyDict) => {
        setRange(ranges['selection'])
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value.trim()
        _.set(filter, name, value)
    }

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name as string
        const selectedValue = _.get(value, 'value', '')
        _.set(filter, name, selectedValue)
    }

    const changePage = (pageNum: number) => {
        getContactUsEmailList(pageNum)
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

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { is_processed: boolean, _id: string }
        const jsonData = toJS(data)

        return (<Button
            disabled={data.is_processed}
            type='button'
            title={jsonData.is_processed === true ? 'Processed' : 'Mark Processed'}
            classes='btn-primary btn-sm'
            loading={isLoading}
            onClick={() => markProcessed(jsonData._id, currentUser)}
        />)
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const dateFormat = moment(data.value).format('MM/DD/YYYY hh:mm:ss a')
        const timeToShow = `${dateFormat} (${timeAgo})`
        return (timeToShow)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className='card-title'>Contact Us Email</h4>
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
                                        defaultDomain={filter.domain}
                                        loading={isLoading}
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
                                    />
                                </div>
                                <div className='col-md-3'>
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
                                <div className='row-md-3 mt-2'>
                                    <Button disabled={isLoading} type='button' title='Apply Filter' classes='btn-primary me-3' loading={isLoading} onClick={() => getContactUsEmailList(1)} />
                                    {showAllProcessedBtn &&
                                        <Button disabled={isLoading} type='button' title='Mark all as processed' classes='btn-primary' loading={isLoading} onClick={() => markAllEmailProcessed(currentUser)} />
                                    }
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
                                    { name: 'name', title: 'Name' },
                                    { name: 'email', title: 'Email' },
                                    { name: 'subject', title: 'Subject' },
                                    { name: 'body', title: 'Body' },
                                    { name: 'created_at', title: 'Created', component: TableCellTimeAgo },
                                    { name: '_id', title: 'Action', component: tableCellButton }
                                ]}
                                data={contactUsEmailList}
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
            </div>
        </div>
    </Container >
}

export default observer(ContactUs)
