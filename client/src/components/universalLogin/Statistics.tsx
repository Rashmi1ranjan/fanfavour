import React, { useEffect } from 'react'
import { observer } from 'mobx-react'
import moment from 'moment'
import { Chart } from 'react-google-charts'
import RootStore from '../../store/Root'
import DateRange from '../utils/DateRange'
import Container from '../layout/Container'
import Domain from '../layout/Domain'
import Loader from '../loader/Loader'

interface Props {
    rootStore: RootStore
}

const Statistics: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, UniversalLoginStore, authStore } = rootStore
    const { theme, bgColor, fontColor } = authStore
    const {
        statisticsFilter,
        getStatistics,
        statisticsData,
        universalUsers,
        isLoading
    } = UniversalLoginStore

    const { singleSiteUsers, multipleSiteUsers } = universalUsers
    const totalUsers = singleSiteUsers + multipleSiteUsers

    useEffect(() => {
        getStatistics()
    }, [])

    const onDateChange = (start_date: string, end_date: string) => {
        statisticsFilter.start_date = moment(start_date).format('MM/DD/YYYY')
        statisticsFilter.end_date = moment(end_date).format('MM/DD/YYYY')
    }

    const onDomainChange = (value: { label: string, value: string }[]) => {
        const domains = []
        for (const domain of value) {
            domains.push(domain.value)
        }
        statisticsFilter.domain = domains
    }

    const applyFilter = () => {
        getStatistics()
    }

    const statisticsChartOptions = {
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
            title: 'Events',
            format: 'decimal',
            minValue: 5,
            gridlines: {
                count: 5
            },
            minorGridlines:
            {
                count: 0
            },
            textStyle: {
                color: fontColor
            },
            titleTextStyle: {
                color: fontColor
            }
        },
        focusTarget: 'category',
        legend: {
            position: 'top',
            alignment: 'center',
            textStyle: {
                color: fontColor
            }
        },
        pointSize: 4,
        backgroundColor: bgColor,
        titleTextStyle: {
            color: fontColor
        }
    }

    const calculatePercentage = (numerator: number, denominator: number) => <>({((numerator / denominator) * 100).toFixed(2)}%)</>

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <h4 className='card-title mb-2'>Universal Statistics</h4>
            <div className='card'>
                <div className='card-body'>
                    <div className='row'>
                        <div className='col-md-3'>
                            <DateRange
                                title='Date Range'
                                id='date_range'
                                name='date_range'
                                startDate={statisticsFilter.start_date}
                                endDate={statisticsFilter.end_date}
                                onDateChange={onDateChange}
                                loading={isLoading}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Domain</label>
                            <Domain
                                onDomainChange={onDomainChange}
                                websiteStore={websiteStore}
                                loading={isLoading}
                                defaultDomain={statisticsFilter.domain}
                                multiSelect={true}
                            />
                        </div>
                        <div className='col-md-3 mt-4'>
                            <button
                                className='btn btn-block bg-primary text-light mb-1 me-3 mt-2'
                                onClick={() => applyFilter()}
                                disabled={isLoading}
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className='d-flex justify-content-center mt-4'>
                <div className='card col p-3 d-flex align-items-center justify-content-center me-3'>
                    <h5 className='card-title text-center'>Universal Users</h5>
                    {isLoading
                        ? <Loader isLoading={isLoading} />
                        : <h3>{totalUsers}</h3>}
                </div>
                <div className='card col p-3 d-flex align-items-center justify-content-center me-3'>
                    <h5 className='card-title text-center'>Users On Single Site</h5>
                    {isLoading
                        ? <Loader isLoading={isLoading} />
                        : <h3>{singleSiteUsers} {totalUsers > 0 && calculatePercentage(singleSiteUsers, totalUsers)}</h3>}
                </div>
                <div className='card col p-3 d-flex align-items-center justify-content-center me-3'>
                    <h5 className='card-title text-center'>Users On Multiple Sites</h5>
                    {isLoading
                        ? <Loader isLoading={isLoading} />
                        : <h3>{multipleSiteUsers} {totalUsers > 0 && calculatePercentage(multipleSiteUsers, totalUsers)}</h3>}
                </div>
            </div>
            {(isLoading === false && statisticsData.length > 1) ?
                <Chart
                    width='100%'
                    height='400px'
                    chartType='LineChart'
                    data={statisticsData}
                    options={statisticsChartOptions}
                    legendToggle
                /> : <div className='mt-5'><Loader isLoading={isLoading} /></div>}
        </Container>
    )
}

export default observer(Statistics)
