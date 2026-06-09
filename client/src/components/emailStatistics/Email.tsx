import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import { Chart } from 'react-google-charts'
import classNames from 'classnames'
import styled from 'styled-components'
import moment from 'moment'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

const ResetLink = styled.a<{ isLoad?: boolean }>`
    pointer-events: ${props => props.isLoad ? 'none' : 'auto'};
    cursor: pointer;
`

const DateInput = styled.input<{ loading?: boolean }>`
    background-color: ${props => props.loading ? 'hsl(0, 0%, 95%)' : '#fff'} !important;
`

const DateDiv = styled.div`
    z-index: 1 !important;
`

const Email: React.FC<Props> = ({ rootStore }) => {
    const { EmailStore, authStore } = rootStore
    const { setEmailStatistics, emailStatistics, isLoadingEmailStatistics } = EmailStore
    const [activeTab, setActiveTab] = useState('showTable')
    // const [showDatePicker, setShowDatePicker] = useState(false)
    const { bgColor, fontColor } = authStore

    useEffect(() => {
        setEmailStatistics()
    }, [])

    const Loader = () => {
        return <div className='text-center'>
            <div className='spinner-border' role='status' style={{ color: '#c6c6c6' }}>
                <span className='sr-only'>Loading...</span>
            </div>
        </div>
    }

    // const handleReset = (e: React.MouseEvent<HTMLAnchorElement>) => {
    //     e.preventDefault()
    //     if (filter.start_date !== '' && filter.end_date !== '') {
    //         filter.start_date = ''
    //         filter.end_date = ''
    //         setInitialDates()
    //     }
    // }

    // const setInitialDates = () => {
    //     const start_date = _.get(filter, 'start_date', '')
    //     const end_date = _.get(filter, 'end_date', '')
    //     const startDate = start_date === '' ? moment().subtract(6, 'days').format('MM/DD/YYYY') : start_date
    //     const endDate = end_date === '' ? moment().format('MM/DD/YYYY') : end_date

    //     filter.start_date = startDate
    //     filter.end_date = endDate
    // }

    // const startDateLocal = moment(filter.start_date, 'MM-DD-YYYY').format('MM/DD/YYYY')
    // const endDateLocal = moment(filter.end_date, 'MM-DD-YYYY').format('MM/DD/YYYY')
    // const [range, setRange] = useState<Range>({
    //     startDate: filter.start_date ? new Date(startDateLocal) : new Date(),
    //     endDate: filter.end_date ? new Date(endDateLocal) : new Date(),
    //     key: 'selection'
    // })

    // const handleDatePickerChange = (ranges: RangeKeyDict) => {
    //     setRange(ranges['selection'])
    // }

    // const handleOnClick = () => {
    //     const startDate = moment(range.startDate).format('MM/DD/YYYY')
    //     const endDate = moment(range.endDate).format('MM/DD/YYYY')
    //     filter.start_date = startDate
    //     filter.end_date = endDate
    //     setShowDatePicker(!showDatePicker)
    // }

    // const filterRecords = () => {
    //     setEmailStatistics()
    // }

    // const handleDomainChange = (selectedOption: OptionType, e: any) => {
    //     const name = e.name

    //     if (name === 'domain') {
    //         filter.domain = selectedOption.value
    //     }
    // }

    const chartOptions = {
        hAxis: {
            title: 'Event Count',
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        focusTarget: 'category',
        vAxis: {
            title: 'Date',
            viewWindowMode: 'explicit',
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        legend: {
            position: 'top',
            alignment: 'center',
            maxLines: 4,
            textStyle: {
                color: fontColor
            }
        },
        pointSize: 5,
        backgroundColor: bgColor,
        titleTextStyle: {
            color: fontColor
        }
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className='card-title'>Email Statistics</h4>
        <div className='btn-group pt-2 pb-2'>
            <button type='button'
                className={classNames('btn', { 'btn-primary': activeTab === 'showTable', 'btn-outline-primary': activeTab !== 'showTable' })}
                onClick={() => {
                    setActiveTab('showTable')
                    setEmailStatistics()
                    // setShowDatePicker(false)
                }}
            >Show As Table</button>
            <button type='button'
                className={classNames('btn', { 'btn-primary': activeTab === 'showChart', 'btn-outline-primary': activeTab !== 'showChart' })}
                onClick={() => {
                    setActiveTab('showChart')
                    setEmailStatistics()
                    // setShowDatePicker(false)
                }}
            >Show As Chart</button>
        </div>
        {/* <div className='card mb-2'>
            <div className='card-body'>
                <form>
                    <div className='row'> */}
        {/* <div className='col-md-3'>
                            <div className='d-flex justify-content-between'>
                                <label className='mb-2'>Date Range</label>
                                <span className='ms-auto d-inline-block'>
                                    <ResetLink className='p-0 text-primary' isLoad={isLoadingEmailStatistics} onClick={handleReset}>
                                        Reset
                                    </ResetLink>
                                </span>
                            </div>
                            <DateInput
                                name='date_range'
                                id='date_range'
                                className='form-control mb-3'
                                data-target='#datePicker'
                                readOnly={true}
                                disabled={isLoadingEmailStatistics}
                                loading={isLoadingEmailStatistics}
                                value={filter.start_date + ' - ' + filter.end_date}
                                onClick={() => setShowDatePicker(!showDatePicker)}

                            />
                        </div> */}
        {/* <div className='col-md-3'>
                            <label className='me-2 mb-2'>Domain</label>
                            <Domain
                                onDomainChange={handleDomainChange}
                                websiteStore={websiteStore}
                                loading={isLoadingEmailStatistics}
                                defaultDomain={filter.domain}
                                multiSelect={false}
                            />
                        </div> */}
        {/* <div className='col-md-3 mt-2'>
                            <button type='button'
                                className='btn btn-primary mt-4'
                                onClick={filterRecords}
                                disabled={isLoadingEmailStatistics}>
                                {isLoadingEmailStatistics === true &&
                                    <span className='spinner-border spinner-border-sm me-1' role='status' aria-hidden='true'></span>
                                }
                                Apply Filter</button>
                        </div> */}
        {/* </div>
                </form>
            </div>
        </div> */}
        {/* {showDatePicker &&
            <DateDiv className='card text-right position-absolute collapsed' id='datePicker'>
                <div className='card-body'>
                    <DateRangePicker
                        className='border'
                        data-toggle='collapse'
                        scroll={{ enabled: false }}
                        direction='horizontal'
                        ranges={[range]}
                        onChange={handleDatePickerChange}
                    />
                </div>
                <div className='card-footer text-end'>
                    <button className='btn btn-outline-secondary me-2' onClick={() => setShowDatePicker(!showDatePicker)}>Close</button>
                    <button className='btn btn-outline-primary' onClick={handleOnClick} >Apply</button>
                </div>
            </DateDiv>
        } */}
        {activeTab === 'showChart' ?
            isLoadingEmailStatistics ?
                <Loader />
                : emailStatistics.length > 1 ?
                    <Chart
                        width='100%'
                        height='400px'
                        chartType='ColumnChart'
                        loader={<Loader />}
                        data={emailStatistics}
                        options={chartOptions}
                        legendToggle
                    />
                    :
                    <div>No data available</div>
            :
            emailStatistics.length > 1 ?
                isLoadingEmailStatistics ?
                    <Loader />
                    :
                    <div className='card mt-4'>
                        <div className='card-body'>
                            <div className='table-responsive mt-3'>
                                <table className='table table-bordered table-hover table-sm'>
                                    <thead>
                                        <tr>
                                            {emailStatistics[0].map((header, index) => (
                                                <th key={index}>{header === 'x' ? 'Date' : header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {emailStatistics.slice(1).map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {row.map((cell, cellIndex) => (
                                                    <td key={cellIndex}>{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                :
                <div>No data available</div>
        }
    </Container >
}

export default observer(Email)
