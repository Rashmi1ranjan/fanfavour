import React, { useEffect } from 'react'
import styled from 'styled-components'
import { observer } from 'mobx-react'
import FileSaver from 'file-saver'
import moment from 'moment'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import Table from '../table/Table'
import { Cell } from './../table/Definations'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import { ValueType } from 'react-select/src/types'
import Domain from '../layout/Domain'
import { OptionType, SortConfig } from '../../types/types'

interface Props {
    rootStore: RootStore
}

const TableWrapper = styled.div`
    table thead tr {
        font-size: 0.8rem;
        vertical-align: middle;
    }
`

const Subscribers: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, WebsiteUserStatisticsStore } = rootStore
    const {
        filter,
        currentPage,
        totalPages,
        limit,
        totalRows,
        totalUsers,
        isLoading,
        websiteStatistics,
        isCSVAvailable,
        csvFile,
        getWebsiteUserStatistics,
        generateCSV
    } = WebsiteUserStatisticsStore

    useEffect(() => {
        getWebsiteUserStatistics()
    }, [])

    const changePage = (pageNUM: number) => {
        _.set(filter, 'page_num', pageNUM)
        getWebsiteUserStatistics()
    }

    const handleChange = (selectedOption: ValueType<OptionType, false>) => {
        _.set(filter, 'domain', selectedOption?.value)
        getWebsiteUserStatistics()
    }

    const shouldSort = (sortConfig: SortConfig) => {
        _.set(filter, 'sortBy', sortConfig)
        _.set(filter, 'page_num', 1)
        getWebsiteUserStatistics()
    }

    const fixAverageMonthlyRevenue: React.FC<Cell> = (data) => {
        const fixAmount = Number(data.value).toFixed(2)
        return <>${fixAmount}</>
    }

    const downloadCsvFile = () => {
        if (csvFile) {
            const csvData = new Blob([csvFile], { type: 'text/csv' })
            FileSaver.saveAs(csvData, `${moment().format('YY-MM-DD')}webSiteUserStatistics.csv`)
        }
    }

    const domainLink = (data: { value: string }) => {
        const redirectLink = `https://${data.value}`
        return (<a href={redirectLink} target="_blank" rel='noreferrer'>{data.value}</a>)
    }

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <form>
                <h4>Subscription Count</h4>
                <div className='table-responsive mt-3 position-relative'>
                    <TableWrapper>
                        <Table
                            unique_key='_id'
                            columns={[
                                { name: 'totalDomain', title: 'Websites' },
                                { name: 'totalRegistered', title: 'Registered users' },
                                { name: 'totalSubscription', title: 'Subscribed Users' },
                                { name: 'totalActiveSubscription', title: 'Active Subscribers' },
                                { name: 'totalActiveCanceled', title: 'Active Cancelled Subscribers' },
                                { name: 'totalRecentlyVisitedAll', title: ' Users (7 days)' },
                                { name: 'totalRecentlyVisitedSubscribers7', title: ' Active Subscribers (7 days)' },
                                { name: 'totalRecentlyVisitedSubscribers45', title: ' Active Subscribers (45 days)' },
                                { name: 'totalRecentlyVisitedActiveCanceled7', title: ' Active Canceled Subscribers (7 days)' },
                                { name: 'totalRecentlyVisitedActiveCanceled45', title: ' Active Canceled Subscribers (45 days)' },
                                { name: 'totalAverageMonthlyRevenue', title: 'Avg. Monthly Revenue (3 month)', component: fixAverageMonthlyRevenue },
                                { name: 'totalBlockUsers', title: 'Block Users' }
                            ]}
                            data={totalUsers}
                        ></Table>
                    </TableWrapper>
                </div>
                <hr />
                <div className='row'>
                    <div className='col-md-4'>
                        <label className='me-2 mb-2'>Domain</label>
                        <Domain
                            onDomainChange={handleChange}
                            websiteStore={websiteStore}
                            loading={isLoading}
                            defaultDomain={filter.domain}
                            multiSelect={false}
                        />
                    </div>
                    <div className='col-md-4' style={{ marginTop: '33px' }}>
                        <button type='button' className='btn btn-primary' disabled={isLoading} onClick={() => generateCSV()}>
                            Export CSV
                        </button>
                        {isCSVAvailable &&
                            <button type='button' className='btn btn-link' disabled={isLoading} onClick={() => downloadCsvFile()}>
                                Download CSV
                            </button>}
                    </div>
                </div>
                <div className='my-4'>
                    <div>
                        {isLoading ? (
                            'Loading..'
                        ) : (
                            <TableWrapper>
                                <div className='table-responsive mt-3'>
                                    <Table
                                        unique_key='_id'
                                        columns={[
                                            {
                                                name: 'website_index',
                                                title: '#'
                                            },
                                            {
                                                name: 'domain',
                                                title: 'Website',
                                                sort: true,
                                                component: domainLink
                                            },
                                            {
                                                name: 'registered',
                                                title: 'Registered users',
                                                sort: true
                                            },
                                            {
                                                name: 'subscribed_ever',
                                                title: 'Subscribed Users',
                                                sort: true
                                            },
                                            {
                                                name: 'active_subscription',
                                                title: 'Active Subscribers',
                                                sort: true
                                            },
                                            {
                                                name: 'active_cancelled_subscription',
                                                title: 'Active Cancelled Subscribers',
                                                sort: true
                                            },
                                            {
                                                name: 'recently_visited_all',
                                                title: 'Users (7 days)',
                                                sort: true
                                            },
                                            {
                                                name: 'recently_visited_subscribers_7',
                                                title: 'Active Subscribers (7 days)',
                                                sort: true
                                            },
                                            {
                                                name: 'recently_visited_subscribers_45',
                                                title: 'Active Subscribers (45 days)',
                                                sort: true
                                            },
                                            {
                                                name: 'recently_visited_active_cancelled_7',
                                                title: 'Active Canceled Subscribers (7 days)',
                                                sort: true
                                            },
                                            {
                                                name: 'recently_visited_active_cancelled_45',
                                                title: 'Active Canceled Subscribers (45 days)',
                                                sort: true
                                            },
                                            {
                                                name: 'average_monthly_revenue',
                                                title: 'Avg. Monthly Revenue (3 month)',
                                                component: fixAverageMonthlyRevenue,
                                                sort: true
                                            },
                                            {
                                                name: 'block_users',
                                                title: 'Block Users',
                                                sort: true
                                            }
                                        ]}
                                        data={websiteStatistics}
                                        shouldSort={shouldSort}
                                        defaultSort={filter.sortBy}
                                    ></Table>
                                </div>
                                {websiteStatistics.length > 0 ? (
                                    <Pagination
                                        totalPages={totalPages}
                                        currentPage={currentPage}
                                        totalItems={totalRows}
                                        itemsPerPage={limit}
                                        onItemClick={changePage}
                                    ></Pagination>
                                ) : null}
                            </TableWrapper>
                        )}
                    </div>
                </div>
            </form>
        </Container>
    )
}

export default observer(Subscribers)
