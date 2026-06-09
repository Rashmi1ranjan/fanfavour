import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import moment from 'moment'
import { Cell } from './../table/Definations'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import styled from 'styled-components'
import { toJS } from 'mobx'
import Button from '../utils/Button'

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

const ChargebackBlockEvents: React.FC<Props> = ({ rootStore }) => {
    const { ChargebackAlertStore } = rootStore
    const {
        getChargebackAlertList,
        chargebackAlertList,
        filter,
        currentPage,
        totalPage,
        limit,
        totalRows,
        isLoading,
        markProcessed,
        showAllProcessedBtn,
        markAllChargeBackAlertProcessed
    } = ChargebackAlertStore
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })
    useEffect(() => {
        getChargebackAlertList(1)
    }, [getChargebackAlertList])


    const changePage = (pageNum: number) => {
        getChargebackAlertList(pageNum)
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const timeToShow = `${data.value} (${timeAgo})`
        return (timeToShow)
    }

    const handleDatePickerChange = (ranges: RangeKeyDict) => {
        setRange(ranges['selection'])
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value.trim()
        _.set(filter, name, value)
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
            onClick={() => markProcessed(jsonData._id)}
        />)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='card'>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <form>
                            <div className='row'>
                                <div className='col-md-3'>
                                    <label className="me-2 mb-2">Created Date Range</label>
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
                                    <label className='me-2 mb-2'>Case Number</label>
                                    <input
                                        name='case_number'
                                        type='text'
                                        className='form-control mb-3'
                                        onChange={onChange}
                                    />
                                </div>
                                <div className='col-md-3'>
                                    <label className='me-2 mb-2'>Card Number</label>
                                    <input
                                        name='card_number'
                                        type='text'
                                        className='form-control mb-3'
                                        onChange={onChange}
                                    />
                                </div>
                                <div className='col-md-2 mt-2'>
                                    <label className='me-2 mb-2'>Is Processed?</label>
                                    <div>
                                        <div className="form-check form-check-inline">
                                            <input className="form-check-input" type="radio" name="is_processed" id="processed_yes" value="true" onChange={onChange} />
                                            <label className="form-check-label" htmlFor="processed_yes">Yes</label>
                                        </div>
                                        <div className="form-check form-check-inline">
                                            <input className="form-check-input" type="radio" name="is_processed" id="processed_no" value="false" onChange={onChange} defaultChecked={true} />
                                            <label className="form-check-label" htmlFor="processed_no">No</label>
                                        </div>
                                    </div>
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <Button disabled={isLoading} type='button' title='Apply Filter' classes='btn-primary' loading={isLoading} onClick={() => getChargebackAlertList(1)} />
                                </div>
                                {showAllProcessedBtn && <div className='col-md-3 mt-2'>
                                    <Button disabled={isLoading} type='button' title='Mark all as processed' classes='btn-primary ms-0' loading={isLoading} onClick={() => markAllChargeBackAlertProcessed()} />
                                </div>}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div className='card mt-4'>
            <div className='card-header'>ECSuite Chargeback Alerts</div>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <div className='table-responsive mt-3'>
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'body.data.chargebacks.chargeback.card_number', title: 'Card Number' },
                                    { name: 'body.data.chargebacks.chargeback.case_number', title: 'Case Number' },
                                    { name: 'body.data.chargebacks.chargeback.case_status', title: 'Status Code' },
                                    { name: 'body.data.chargebacks.chargeback.reason_code', title: 'Chargeback Reason Code' },
                                    { name: 'body.data.chargebacks.chargeback.amount', title: 'Chargeback Amount' },
                                    { name: 'body.data.chargebacks.chargeback.original_amount', title: 'Transaction Amount' },
                                    { name: 'body.data.chargebacks.chargeback.case_status_description', title: 'Case Status' },
                                    { name: 'body.data.chargebacks.chargeback.transaction_date', title: 'Transaction Date', component: TableCellTimeAgo },
                                    { name: 'body.data.chargebacks.chargeback.date', title: 'Chargeback Date', component: TableCellTimeAgo },
                                    { name: 'createdAt', title: 'Create Date', component: TableCellTimeAgo },
                                    { name: '_id', title: 'Action', component: tableCellButton }
                                ]}
                                data={chargebackAlertList}
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
    </Container>

}

export default observer(ChargebackBlockEvents)
