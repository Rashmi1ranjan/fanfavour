import React, { useEffect } from 'react'
import { observer } from 'mobx-react'
import _ from 'lodash'
import moment from 'moment'
import DateRange from './../utils/DateRange'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { Chart } from 'react-google-charts'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

const WebsiteCronStatus: React.FC<Props> = ({ rootStore }) => {

    const { WebsiteCronStatusStore, websiteStore, authStore } = rootStore
    const { theme, bgColor, fontColor } = authStore
    const {
        isLoading,
        filter,
        cronStatusCounts,
        getWebsiteCronStatus
    } = WebsiteCronStatusStore

    useEffect(() => {
        getWebsiteCronStatus()
    }, [getWebsiteCronStatus])

    const applyFilter = () => {
        getWebsiteCronStatus()
    }

    const onDomainChange = (value: OptionType[]) => {
        const domain = []
        for (const country of value) {
            domain.push(country.value)
        }
        filter.domain = domain
    }

    const onDateChange = (start_date: string, end_date: string) => {
        filter.start_date = moment(start_date).format('MM/DD/YYYY')
        filter.end_date = moment(end_date).format('MM/DD/YYYY')
    }

    const Loader = () => {
        return <div className='text-center'>
            <div className='spinner-border' role='status' style={{ color: '#c6c6c6' }}>
                <span className='sr-only'>Loading...</span>
            </div>
        </div>
    }

    const chartOptions = {
        hAxis: {
            title: 'Date',
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        focusTarget: 'category',
        vAxis: {
            title: 'Counts',
            viewWindowMode: 'explicit',
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        colors: ['#00bb00', '#bb0000'],
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
        <h4 className='card-title'>Website Cron Status</h4>
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
                            loading={isLoading}
                        />
                    </div>
                    <div className='col-md-6'>
                        <label className='me-2 mb-2'>Domain</label>
                        <Domain
                            onDomainChange={onDomainChange}
                            websiteStore={websiteStore}
                            defaultDomain={filter.domain}
                            loading={isLoading}
                            multiSelect={true}
                            requestFromCron={true}
                        />
                    </div>
                    <div className='col-md-3 mt-4'>
                        <button
                            className='btn btn-block bg-primary text-light mb-1 me-3 mt-2'
                            onClick={() => applyFilter()}
                            disabled={isLoading}
                        >
                            {isLoading && <span className='spinner-border spinner-border-sm me-1' role='status' aria-hidden='true'></span>}
                            Apply Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>
        {(_.isEmpty(cronStatusCounts) && isLoading) ? <Loader /> : <Chart
            width='100%'
            height='400px'
            chartType='LineChart'
            loader={<Loader />}
            data={cronStatusCounts}
            options={chartOptions}
            legendToggle
        />}
    </Container>
}

export default observer(WebsiteCronStatus)
