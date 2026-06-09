import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import moment from 'moment'
import { Cell } from '../table/Definations'
import DateRange from '../utils/DateRange'
import Domain from '../layout/Domain'
import Select from 'react-select'

const EventFilter = (props: any) => {
    const { filter, eventsList, loading } = props
    const selectedOptions = filter.referral_links
    let defaultValue = null

    if (selectedOptions.length > 0) {
        defaultValue = []
        eventsList.map((event: any) => {
            if (selectedOptions.includes(event.value)) {
                defaultValue.push(event)
            }
        })
    }

    const onChange = (selectedOptions: any) => {
        filter.referral_links = selectedOptions.map((event: { label: string, value: string }) => event.value)
    }

    return (
        <Select
            defaultValue={defaultValue}
            onChange={onChange}
            options={eventsList}
            isMulti={true}
            isDisabled={loading}
        />
    )
}

interface Props {
    rootStore: RootStore
}

const LinkTrackingAnalytics: React.FC<Props> = ({ rootStore }) => {
    const { LinkTrackingReferralStore, websiteStore } = rootStore
    const {
        getLinkTrackingAnalyticsData,
        linkTrackingReferralAnalyticsData,
        currentPage,
        totalPage,
        limit,
        totalRows,
        linkTrackingReferralAnalyticsDataLoading,
        linkTrackingReferralAnalyticsPaginationData,
        getReferralList,
        referralList
    } = LinkTrackingReferralStore

    useEffect(() => {
        getReferralList()
        if (linkTrackingReferralAnalyticsData.length === 0) {
            getLinkTrackingAnalyticsData()
        }
    }, [])

    const changePage = (page_num: number) => {
        linkTrackingReferralAnalyticsPaginationData.currentPage = page_num
        getLinkTrackingAnalyticsData()
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const date = moment(data.value)
        const formattedDate = date.format('MM/DD/YYYY')
        return formattedDate
    }

    const TableCellWebsiteLink: React.FC<Cell> = (data) => {
        const url = `https://${data.value}`
        return (<a href={url} target='_blank' rel='noreferrer'>{data.value}</a>)
    }

    const onDateChange = (start_date: string, end_date: string) => {
        linkTrackingReferralAnalyticsPaginationData.start_date = moment(start_date).format('MM/DD/YYYY')
        linkTrackingReferralAnalyticsPaginationData.end_date = moment(end_date).format('MM/DD/YYYY')
    }

    const onDomainChange = (value: any) => {
        const domains = []
        for (const domain of value) {
            domains.push(domain.value)
        }
        linkTrackingReferralAnalyticsPaginationData.domains = domains
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='d-flex justify-content-between align-items-center'>
            <h4 className="card-title">Link Tracking Analytics</h4>
        </div>
        <div className='card mt-3'>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-md-3'>
                        <DateRange
                            title='Date Range'
                            id='date_range'
                            name='date_range'
                            startDate={linkTrackingReferralAnalyticsPaginationData.start_date}
                            endDate={linkTrackingReferralAnalyticsPaginationData.end_date}
                            onDateChange={onDateChange}
                            loading={linkTrackingReferralAnalyticsDataLoading}
                        />
                    </div>
                    {/* <div className='col-md-3'>
                        <label className='me-2 mb-2'>Domain</label>
                        <Domain
                            onDomainChange={onDomainChange}
                            websiteStore={websiteStore}
                            loading={linkTrackingReferralAnalyticsDataLoading}
                            defaultDomain={linkTrackingReferralAnalyticsPaginationData.domains}
                            multiSelect={true}
                        />
                    </div>
                    <div className='col-md-3'>
                        <label className='me-2 mb-2'>Events</label>
                        <EventFilter
                            filter={linkTrackingReferralAnalyticsPaginationData}
                            eventsList={referralList}
                            loading={linkTrackingReferralAnalyticsDataLoading}
                        ></EventFilter>
                    </div> */}
                    <div className='col-md-3'>
                        <button
                            className='btn btn-block bg-primary text-light mb-1 me-3'
                            onClick={() => getLinkTrackingAnalyticsData()}
                            disabled={linkTrackingReferralAnalyticsDataLoading}
                            style={{
                                marginTop: '2rem'
                            }}
                        >
                            Apply Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div className="row">
            <div className="col my-3">
                <div className='table-responsive' >
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'domain', title: 'Domain', component: TableCellWebsiteLink },
                            { name: 'referral_id.name', title: 'Referral' },
                            { name: 'visits', title: 'Visits' },
                            { name: 'registrations', title: 'Registrations' },
                            { name: 'subscriptions', title: 'Subscriptions' },
                            { name: 'date', title: 'Date', component: TableCellTimeAgo },
                            { name: 'revenue', title: 'Revenue' },
                            { name: 'refunds', title: 'Refunds' },
                            { name: 'chargebacks', title: 'Chargebacks' },
                            { name: 'total', title: 'Total' }
                        ]}
                        data={linkTrackingReferralAnalyticsData}
                        isLoading={linkTrackingReferralAnalyticsDataLoading}
                    ></Table>
                </div>
                <Pagination
                    totalPages={linkTrackingReferralAnalyticsPaginationData.totalPages}
                    currentPage={linkTrackingReferralAnalyticsPaginationData.currentPage}
                    totalItems={linkTrackingReferralAnalyticsPaginationData.totalRows}
                    itemsPerPage={linkTrackingReferralAnalyticsPaginationData.limit}
                    onItemClick={changePage}
                ></Pagination>
            </div>
        </div>
    </Container>
}

export default observer(LinkTrackingAnalytics)
