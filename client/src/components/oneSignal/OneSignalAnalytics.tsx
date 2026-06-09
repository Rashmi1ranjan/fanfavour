import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import _ from 'lodash'
import moment from 'moment'
import RootStore from '../../store/Root'
import DateRange from './../utils/DateRange'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

const OneSignalAnalytics: React.FC<Props> = ({ rootStore }) => {

    const { websiteStore, OneSignalAnalyticsStore } = rootStore
    const {
        isLoading,
        filter,
        currentPage,
        totalPage,
        totalRows,
        limit,
        dataRow,
        isApiError,
        getAnalyticData
    } = OneSignalAnalyticsStore

    useEffect(() => {
        getAnalyticData()
    }, [])

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

    const applyFilter = () => {
        filter.page = 1
        getAnalyticData()
    }

    const changePage = (pageNum: number) => {
        filter.page = pageNum
        getAnalyticData()
    }

    const FormatDate = (objData: object) => {
        const date = _.get(objData, 'value', '')
        if (date === '') {
            return (<></>)
        }
        const formatDate = moment(date).format('MM/DD/YYYY HH:mm:ss')
        return (<>{formatDate} ({moment(date).fromNow()})</>)
    }

    const TableCellWebsiteLink = (objData: object) => {
        const domain = _.get(objData, 'value', 'services')
        if (domain === 'services') {
            return (<>services</>)
        }
        const url = `https://${domain}`
        return (<a href={url} target='_blank' rel='noreferrer'>{domain}</a>)
    }

    const NotificationFrom = (objData: object) => {
        const from = _.get(objData, 'value', 'messages')
        const messageFrom = from === 'messages' ? 'Mass Message' : 'Content'
        return (<>{messageFrom}</>)
    }

    const FormatMessage = (objData: object) => {
        let message = _.get(objData, 'value', '')
        if (message.length > 150) {
            message = message.slice(0, 100) + '...'
        }
        return (<>{message}</>)
    }

    const FormatSendedCounts = (objData: object) => {
        const sended = _.get(objData, 'value', '')
        if (_.isEmpty(sended)) {
            return (<>NA</>)
        }
        const jsonData = JSON.parse(JSON.stringify(sended))
        return (<>
            <p className='m-0'>Delivered: {jsonData.successful}</p>
            <p className='m-0'>Failed (Unsubscribed): {jsonData.failed}</p>
            <p className='m-0'>Failed (Errored): {jsonData.errored}</p>
        </>)
    }

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <h4 className='card-title'>OneSignal Analytics</h4>
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
                            />
                        </div>
                        <div className='col-md-6'>
                            <label className='me-2 mb-2'>Domain</label>
                            <Domain
                                onDomainChange={onDomainChange}
                                websiteStore={websiteStore}
                                loading={isLoading}
                                defaultDomain={filter.domain}
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
            {isApiError ? <>
                <div className='responsive alert-danger p-3 mt-4 rounded' >
                    Error while getting one-signal Analytics Data!
                </div>
            </> : <>
                <div className='table-responsive mt-3'>
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'domain', title: 'Domain', component: TableCellWebsiteLink },
                            { name: 'from', title: 'Type', component: NotificationFrom },
                            { name: 'message', title: 'Notification Message', component: FormatMessage },
                            { name: 'createdAt', title: 'Notification Date', component: FormatDate },
                            { name: 'sended', title: 'Notification Success/Failed', component: FormatSendedCounts }
                        ]}
                        data={dataRow}
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
            </>}
        </Container>
    )
}

export default observer(OneSignalAnalytics)
