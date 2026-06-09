import React, { useEffect, useState } from 'react'
import moment from 'moment'
import { Chart } from 'react-google-charts'
import { observer } from 'mobx-react'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import _ from 'lodash'
import styled from 'styled-components'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { ActionMeta } from 'react-select/src/types'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'


interface Props {
    rootStore: RootStore
}

const ResetLink = styled.a<{ isLoad?: boolean }>`
    pointer-events: ${props => props.isLoad ? 'none' : 'auto'};
    cursor: pointer;
`

const DateDiv = styled.div`
    z-index: 1 !important;
`

const DateInput = styled.input<{ loading?: boolean }>`
    background-color: ${props => props.loading ? 'hsl(0, 0%, 95%)' : '#fff'} !important;
`

const SubscriptionStatistics: React.FC<Props> = ({ rootStore }) => {
    const { SubscriptionStatisticsStore, websiteStore, authStore } = rootStore
    const { theme, bgColor, fontColor } = authStore
    const {
        getSubscriptionStatisticsList,
        subscriptionStatisticsData,
        filter,
        isLoading
    } = SubscriptionStatisticsStore
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [selectedDomain, setSelectedDomain] = useState<Array<string>>([])

    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })

    useEffect(() => {
        getSubscriptionStatisticsList()
        if (filter.domain) setSelectedDomain(filter.domain)
        setInitialDates()
    }, [getSubscriptionStatisticsList])

    const setInitialDates = () => {
        const start_date = _.get(filter, 'start_date', '')
        const end_date = _.get(filter, 'end_date', '')
        const startDate = start_date === '' ? moment().subtract(29, 'days').format('MM/DD/YYYY') : start_date
        const endDate = end_date === '' ? moment().format('MM/DD/YYYY') : end_date

        filter.start_date = startDate
        filter.end_date = endDate
    }

    const handleChange = (value: OptionType[], action: ActionMeta<OptionType>) => {
        const name = action.name
        if (name === 'domain') {
            const domainList = []
            for (const website of value) {
                domainList.push(website.value)
            }
            filter.domain = domainList
        }
    }

    const handleDatePickerChange = (ranges: RangeKeyDict) => {
        setRange(ranges['selection'])
    }

    const handleOnClick = () => {
        const startDate = moment(range.startDate).format('MM/DD/YYYY')
        const endDate = moment(range.endDate).format('MM/DD/YYYY')
        filter.start_date = startDate
        filter.end_date = endDate
        setShowDatePicker(!showDatePicker)
    }

    const filterRecords = () => {
        getSubscriptionStatisticsList()
        if (filter.domain) setSelectedDomain(filter.domain)
    }

    const handleReset = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        if (filter.start_date !== '' && filter.end_date !== '') {
            filter.start_date = ''
            filter.end_date = ''
            setInitialDates()
        }
    }

    const Loader = () => {
        return <div className='text-center'>
            <div className='spinner-border' role='status' style={{ color: '#c6c6c6' }}>
                <span className='sr-only'>Loading...</span>
            </div>
        </div>
    }

    const activeUserCountOption = {
        hAxis: {
            title: 'Date',
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        vAxis: {
            title: 'User Count',
            viewWindowMode: 'explicit',
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        focusTarget: 'category',
        colors: ['#00bb00', '#FFD300', '#F62B00'],
        legend: {
            position: 'top',
            alignment: 'center',
            maxLines: 3,
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

    const domainLink = (domain: string) => {
        const url = `https://${domain}`
        return <h5><a href={url} target='_blank' rel='noreferrer'>{domain}</a></h5>
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className='card-title'>Subscription Statistics</h4>
        <div className='card'>
            <div className='card-body'>
                <form>
                    <div className='row'>
                        <div className='col-md-3'>
                            <div className='d-flex justify-content-between'>
                                <label className='mb-2'>Date Range</label>
                                <span className='ms-auto d-inline-block'>
                                    <ResetLink className='p-0 text-primary' isLoad={isLoading} onClick={handleReset}>
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
                                disabled={isLoading}
                                loading={isLoading}
                                value={filter.start_date + ' - ' + filter.end_date}
                                onClick={() => setShowDatePicker(!showDatePicker)}
                            />
                            {showDatePicker &&
                                <DateDiv className='card text-right position-absolute collapsed' id='datePicker'>
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
                                        <button className='btn btn-outline-secondary me-2' onClick={() => setShowDatePicker(!showDatePicker)}>Close</button>
                                        <button className='btn btn-outline-primary' onClick={handleOnClick} >Apply</button>
                                    </div>
                                </DateDiv>
                            }
                        </div>
                        <div className='col-md-6'>
                            <label className='mb-2'>Domain</label>
                            <Domain
                                onDomainChange={handleChange}
                                websiteStore={websiteStore}
                                loading={isLoading}
                                defaultDomain={filter.domain}
                                multiSelect={true}
                            />
                        </div>
                        <div className='col-md-3 mt-2'>
                            <button type='button'
                                className='btn btn-primary mt-4'
                                onClick={filterRecords}
                                disabled={isLoading}>
                                {isLoading === true &&
                                    <span className='spinner-border spinner-border-sm me-1' role='status' aria-hidden='true'></span>
                                }
                                Apply Filter</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <div className='row mt-4'>
            <div className='col-12'>
                <div className='px-0'>
                    {selectedDomain.length > 1 ?
                        isLoading ?
                            <Loader />
                            :
                            subscriptionStatisticsData.map((data: Array<Array<(string | number)>> | Array<(string | number)>, index: number) => (
                                data.length > 0 &&
                                <>
                                    {domainLink(selectedDomain[index])}
                                    <Chart
                                        width='100%'
                                        height='400px'
                                        chartType='LineChart'
                                        loader={<Loader />}
                                        data={data}
                                        legendToggle
                                        options={activeUserCountOption}
                                    />
                                </>
                            ))
                        :
                        isLoading ?
                            <Loader />
                            :
                            subscriptionStatisticsData.length > 0 &&
                            <>
                                {domainLink(selectedDomain[0])}
                                <Chart
                                    width='100%'
                                    height='400px'
                                    chartType='LineChart'
                                    loader={<Loader />}
                                    legendToggle
                                    data={subscriptionStatisticsData}
                                    options={activeUserCountOption}
                                />
                            </>
                    }
                </div>
            </div>
        </div>
    </Container >
}

export default observer(SubscriptionStatistics)
