import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Pagination from '../table/Pagination'
import Domain from '../layout/Domain'
import _ from 'lodash'
import { ActionMeta, ValueType } from 'react-select/src/types'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const OptInReport: React.FC<Props> = ({ rootStore }) => {
    const { OptInReportStore, websiteStore } = rootStore
    const { getOptInReportList, optInReportData, currentPage, totalPage, limit, totalRows, getAllOptInCount, allOptInReportData } = OptInReportStore
    const [domain, setDomain] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (isLoading) {
            getOptInReportList(1, {})
            getAllOptInCount()
            setIsLoading(false)
        }
    }, [getOptInReportList, getAllOptInCount])

    const changePage = (pageNUM: number) => {
        getOptInReportList(pageNUM, {
            domain: domain
        })
    }

    const callApi = (filter: object) => {
        getOptInReportList(1, filter)
    }

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')
        const filter = {
            domain: domain
        }
        if (name === 'domain') {
            setDomain(selectedValue)
            filter.domain = selectedValue
        }
        callApi(filter)
    }

    if (isLoading === true) {
        return <>Loading</>
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className="card mt-4">
            <div className="card-header">
                Opt In Report List
            </div>
            <div className="card-body">
                <div className='table-responsive mt-3'>
                    <table className="table table-bordered table-hover table-sm">
                        <thead>
                            <tr>
                                <th>Opt In Pending</th>
                                <th>Opt In Link Sent</th>
                                <th>Opt In</th>
                                <th>Declined</th>
                                <th>Bounced</th>
                                <th>Bounced Declined</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{allOptInReportData.opt_in_pending}</td>
                                <td>{allOptInReportData.opt_in_link_sent}</td>
                                <td>{allOptInReportData.opt_in}</td>
                                <td>{allOptInReportData.declined}</td>
                                <td>{allOptInReportData.bounced}</td>
                                <td>{allOptInReportData.bounced_declined}</td>
                                <td>{allOptInReportData.total}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className='row mt-3'>
                    <div className='col-md-3'>
                        <label className='mb-2'>Website</label>
                        <Domain
                            onDomainChange={handleChange}
                            websiteStore={websiteStore}
                            loading={isLoading}
                            defaultDomain={domain}
                            multiSelect={false}
                        />
                    </div>
                </div>
                <div className='table-responsive mt-3'>
                    <table className="table table-bordered table-hover table-sm">
                        <thead>
                            <tr>
                                <th scope='col' align='left' style={{ width: '25%' }}>Status</th>
                                <th scope='col' align='left' style={{ width: '25%' }}>Popup Displayed</th>
                                <th scope='col' align='left' style={{ width: '25%' }}>Active</th>
                                <th scope='col' align='left' style={{ width: '25%' }}>Active Cancelled</th>
                                <th scope='col' align='left' style={{ width: '25%' }}>Cancelled</th>
                                <th scope='col' align='left' style={{ width: '25%' }}>Registered</th>
                                <th scope='col' align='left' style={{ width: '25%' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td align='left' style={{ verticalAlign: 'middle' }}>Opt In Pending</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in_pending.popupDisplayCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in_pending.activeUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in_pending.activeCancelledUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in_pending.cancelledUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in_pending.registeredUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in_pending.total}</td>
                            </tr>
                            <tr>
                                <td align='left' style={{ verticalAlign: 'middle' }}>Opt In Link Sent</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in_link_sent.popupDisplayCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in_link_sent.activeUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in_link_sent.activeCancelledUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in_link_sent.cancelledUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in_link_sent.registeredUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in_link_sent.total}</td>
                            </tr>
                            <tr>
                                <td align='left' style={{ verticalAlign: 'middle' }}>Opt In</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in.popupDisplayCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in.activeUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in.activeCancelledUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in.cancelledUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in.registeredUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.opt_in.total}</td>
                            </tr>
                            <tr>
                                <td align='left' style={{ verticalAlign: 'middle' }}>Declined</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.declined.popupDisplayCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.declined.activeUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.declined.activeCancelledUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.declined.cancelledUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.declined.registeredUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.declined.total}</td>
                            </tr>
                            <tr>
                                <td align='left' style={{ verticalAlign: 'middle' }}>Bounced</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.bounced.popupDisplayCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.bounced.activeUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.bounced.activeCancelledUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.bounced.cancelledUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.bounced.registeredUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.bounced.total}</td>
                            </tr>
                            <tr>
                                <td align='left' style={{ verticalAlign: 'middle' }}>Bounced Declined</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.bounced_declined.popupDisplayCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.bounced_declined.activeUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.bounced_declined.activeCancelledUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.bounced_declined.cancelledUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.bounced_declined.registeredUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.bounced_declined.total}</td>
                            </tr>
                            <tr>
                                <td align='left' style={{ verticalAlign: 'middle' }}>Total</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.total.popupDisplayCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.total.activeUser}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.total.activeCancelledUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.total.cancelledUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.total.registeredUserCount}</td>
                                <td align='left' style={{ verticalAlign: 'middle' }}>{optInReportData.total.total}</td>
                            </tr>
                        </tbody>
                    </table>
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
    </Container>
}

export default observer(OptInReport)
