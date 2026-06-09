import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { Controller, useForm } from 'react-hook-form'
import classNames from 'classnames'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { Cell } from './../table/Definations'
import DatePicker from 'react-datepicker'
import moment from 'moment'

interface Props {
    rootStore: RootStore
}

const ImportTransaction: React.FC<Props> = ({ rootStore }) => {
    const { StickyIoTransactionImport } = rootStore
    const { uploadCSV, getCsvLog, isLoading, logData, currentPage, totalPage, limit, totalRows, awsUrl, calculateEarning } = StickyIoTransactionImport
    const { register, handleSubmit, formState: { errors }, reset } = useForm()
    const {
        register: register1,
        handleSubmit: handleSubmit1,
        reset: reset1,
        formState: { errors: errors1 },
        control,
        watch
    } = useForm()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const SelectedDate = watch('date', selectedDate)

    useEffect(() => {
        getCsvLog(1)
        getTimeAgo()
    }, [getCsvLog])

    const changePage = (pageNUM: number) => {
        getCsvLog(pageNUM)
    }

    const onSubmit = (data: { csv: FileList }) => {
        const postData = new FormData()
        postData.append('csv', data.csv[0])
        uploadCSV(postData)
        reset(postData)
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const timeToShow = `${data.value} (${timeAgo})`
        return (timeToShow)
    }

    const TableCellCSVUrl: React.FC<Cell> = (props) => {
        const csvUrl = `${awsUrl}/${props.value}`
        return ((props.value !== '' && awsUrl !== '') ? <a href={csvUrl} target='_blank' rel='noreferrer'>Download File</a> : <></>)
    }

    const onCalculateEarning = (data: { date: Date }) => {
        const date = moment(data.date).format('YYYY-MM-DD')
        const confirm = window.confirm(`Are you sure to Calculate Earning for date: ${date}?`)
        if (confirm === false) {
            return false
        }
        calculateEarning({ date })
    }

    const getTimeAgo = () => {
        let cronDate = moment(moment().utc().format('YYYY-MM-DD 12:00:00'))
        const utcDate = moment(moment().utc().format('YYYY-MM-DD HH:mm:ss'))

        let hours = 0
        let minutes = 0
        if (cronDate < utcDate) {
            cronDate = cronDate.add(1, 'days')
            const duration = moment.duration(cronDate.diff(utcDate))
            hours = Math.abs(parseInt(duration.asHours().toString()))
            minutes = Math.abs(parseInt(duration.asMinutes().toString())%60)
        } else {
            const duration = moment.duration(utcDate.diff(cronDate))
            hours = Math.abs(parseInt(duration.asHours().toString()))
            minutes = Math.abs(parseInt(duration.asMinutes().toString())%60)
        }

        return `Next Earning Cron will start in ${hours}Hrs and ${minutes}Min`
    }


    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row'>
            <div className='col-md-6'>
                <div className='card'>
                    <div className="card-header"> Upload Transactions CSV</div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className='form-group'>
                                <label className='me-2 mb-2'>Select CSV</label>
                                <input
                                    name='csv'
                                    type='file'
                                    className='form-control'
                                    accept='.csv'
                                    ref={register({
                                        required: 'Please select csv file'
                                    })}
                                />
                                {(errors.csv) && <p className="text-danger">{errors.csv.message}</p>}
                            </div>
                            <button type='submit' className="btn btn-primary mt-2" disabled={isLoading}>
                                <span className={classNames('spinner-border spinner-border-sm me-1', { 'd-none': !isLoading })} role='status' aria-hidden='true'></span>
                                {isLoading ? 'Uploading...' : 'Upload CSV'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <div className='col-md-6'>
                <div className='card'>
                    <div className="card-header d-flex justify-content-between"> Re-Calculate Earning By Date  <div className='bg-info text-dark px-1'>{getTimeAgo()}</div></div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit1(onCalculateEarning)}>
                            <div className='form-group'>
                                <label className='me-2 mb-2'>Select Date</label>
                                <Controller
                                    as={<DatePicker
                                        className="form-control form-select"
                                        selected={SelectedDate}
                                        onChange={(date) => date}
                                    />}
                                    control={control}
                                    valueName="selected"
                                    name="date"
                                    placeholderText="Select date"
                                    defaultValue={null}
                                    rules={{ required: 'Please Select Date' }}
                                />
                                {(errors1.date) && <p className="text-danger">{errors1.date.message}</p>}
                            </div>
                            <button type='submit' className="btn btn-primary mt-2" disabled={isLoading}>
                                <span className={classNames('spinner-border spinner-border-sm me-1', { 'd-none': !isLoading })} role='status' aria-hidden='true'></span>
                                {isLoading ? 'Calculating...' : 'Re-Calculate Earning'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className='col-12 mt-3'>
                <div className='card'>
                    <div className='card-header'>CSV import logs</div>
                    <div className='card-body'>
                        <div className='table-responsive'>
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'file_name', title: 'File Name' },
                                    { name: 'uploaded_by', title: 'Uploaded By' },
                                    { name: 'createdAt', title: 'Date', component: TableCellTimeAgo },
                                    { name: 'file_path', title: 'Action', component: TableCellCSVUrl }
                                ]}
                                data={logData}
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

export default observer(ImportTransaction)
