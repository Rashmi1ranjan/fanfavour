import React, { useState, useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import moment from 'moment'
import Select from 'react-select'
import Table from '../table/Table'
import styled from 'styled-components'
import Pagination from '../table/Pagination'
import DateRange from './../utils/DateRange'
import { Cell } from './../table/Definations'
import _ from 'lodash'
import { ActionMeta, ValueType } from 'react-select/src/types'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

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

const LinkTrackingWebsiteReferralMonthlyEarningReport: React.FC<Props> = ({ rootStore }) => {
    const { LinkTrackingWebsiteReferralMonthlyEarningReportStore, websiteStore, authStore, LinkTrackingReferralStore } = rootStore
    const { getWebsiteReferralData, isLoading, websiteReferralEarningReportData, currentPage, totalPage, totalRows, limit, filter, csvFile, getCSVFromUrl, earningReportSummary } = LinkTrackingWebsiteReferralMonthlyEarningReportStore
    const { getReferralWebsiteOptions, referralWebsiteOption } = websiteStore
    const [selectedWebsite, setSelectedWebsite] = useState<ValueType<OptionType, IsMulti>>()
    const [startDateInLocalString, setStartDateInLocalString] = useState(moment().startOf('month').format('MM-DD-YYYY'))
    const [endDateInLocalString, setEndDateInLocalString] = useState(moment().endOf('month').format('MM-DD-YYYY'))
    const {
        getAllLinkTrackingReferralWebsiteOptions,
        allLinkTrackingReferralOptions
    } = LinkTrackingReferralStore
    const { userRole } = authStore

    useEffect(() => {
        if (userRole !== 'SUPER_ADMIN') {
            getReferralWebsiteOptions('')
            getWebsiteReferralData(filter, 1)
        } else {
            getAllLinkTrackingReferralWebsiteOptions()
        }
    }, [])

    const options: OptionType[] = [
        { label: 'All', value: '' }
    ]

    const websiteOptions: OptionType[] = referralWebsiteOption.map((option, index) => (
        { label: `${index + 1}. ${option.website_url}`, value: option.website_url }
    ))
    options.push(...websiteOptions)

    const changePage = (pageNUM: number) => {
        getWebsiteReferralData(filter, pageNUM)
    }

    const handleOnChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')
        const selectedLabel = _.get(value, 'label', '')
        filter.requestFrom = 'link-tracking'
        if (name === 'website') {
            setSelectedWebsite(value)
            filter.domain = selectedValue
        } else if (name === 'referral') {
            setSelectedWebsite(null)
            filter.domain = ''
            filter.referral_id = selectedValue
            getReferralWebsiteOptions(selectedLabel)
        }
    }

    const handleOnClick = () => {
        if (userRole === 'SUPER_ADMIN' && filter.referral_id === '') {
            return alert('Please select referral')
        }
        getWebsiteReferralData(filter, 1)
    }

    const downloadCsvFile = () => {
        getCSVFromUrl()
    }
    const onDateChange = (start_date: string, end_date: string) => {
        filter.start_date = moment(start_date).format('MM-DD-YYYY')
        filter.end_date = moment(end_date).format('MM-DD-YYYY')
        setStartDateInLocalString(moment(start_date).format('MM-DD-YYYY'))
        setEndDateInLocalString(moment(end_date).format('MM-DD-YYYY'))
    }

    const formatCurrency: React.FC<Cell> = (data) => {
        const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.value)
        return (<div style={{ textAlign: 'end' }}>{amount}</div>)
    }

    const formatChargeBackCurrency = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(jsonData.chargeback)
        return (
            <div style={{ textAlign: 'end' }}>
                {amount}
                {jsonData.chargeback_count > 0 ?
                    ` (${jsonData.chargeback_count})`
                    : ''
                }
            </div>)
    }

    const referralInformation = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))

        if (jsonData.referral_commission.length === 1) {
            const item = jsonData.referral_commission[0]
            return (
                <div>{item.referral_commission}%</div>
            )
        } else {
            return (
                jsonData.referral_commission.map((item: { referral_commission: string, target_date: string }, i: number) => {
                    return <div key={i}>{item.referral_commission}%&nbsp;&nbsp;{moment(item.target_date).format('YYYY/MM/DD')}</div>
                })
            )
        }
    }

    const referralOptions: OptionType[] = []

    const websiteReferralOptions: OptionType[] = allLinkTrackingReferralOptions.map(option => (
        { label: option.name, value: option._id }
    ))
    referralOptions.push(...websiteReferralOptions)

    const selectedWebsiteReferralOption = _.find(referralOptions, (item: OptionType) => {
        return item.value === filter.referral_id
    })

    return (<Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className="mt-2 mb-3">Link Tracking Website Earnings</h4>
        <div className='row'>
            <div className='col-3'>
                <DateRange
                    title='Date Range'
                    id='date_range'
                    name='date_range'
                    startDate={startDateInLocalString}
                    endDate={endDateInLocalString}
                    onDateChange={onDateChange}
                />
            </div>
            {userRole === 'SUPER_ADMIN' &&
                <div className='col-3'>
                    <label className='mb-2'>Link Referrals</label>
                    <Select
                        name='referral'
                        options={referralOptions}
                        onChange={handleOnChange}
                        defaultValue={selectedWebsiteReferralOption}
                        value={selectedWebsiteReferralOption}
                        className='mb-3'
                    />
                </div>
            }
            <div className='col-3'>
                <label className='me-2 mb-2'>Domain</label>
                <Select
                    name='website'
                    id='website'
                    options={options}
                    onChange={handleOnChange}
                    value={selectedWebsite}
                />
            </div>
            <div className='col-md-3'>
                <div className='row'>
                    <div className='col-md-6'>
                        <button type="button"
                            className="btn btn-primary mt-4"
                            onClick={handleOnClick}
                            disabled={isLoading}>
                            {isLoading === true &&
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                            Apply Filter</button>
                    </div>
                    <div className='col-md-6' style={{ textAlign: 'end' }}>
                        <button type="button" className="btn btn-link mt-4" onClick={downloadCsvFile}>Export CSV</button>
                    </div>
                </div>
            </div>

        </div>
        {isLoading === true ?
            <Loader>
                <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </Loader>
            :
            <>
                <div className='table-responsive mt-3 position-relative'>
                    <h3>Summary</h3>
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'new_transaction', title: 'New', component: formatCurrency },
                            { name: 'refund', title: 'Refund', component: formatCurrency },
                            { name: 'void', title: 'Void', component: formatCurrency },
                            { name: 'chargeback', title: 'Chargeback', component: formatChargeBackCurrency },
                            { name: 'net_revenue', title: 'Net Revenue', component: formatCurrency },
                            { name: 'revenue_collected', title: 'Revenue Collected', component: formatCurrency },
                            { name: 'referral_earning', title: 'Referral Earning', component: formatCurrency },
                            { name: 'platform_earning', title: 'Platform Earning', component: formatCurrency },
                            { name: 'model_earning', title: 'Model Earning', component: formatCurrency }
                        ]}
                        data={earningReportSummary}
                    ></Table>
                </div>
                <div className='table-responsive mt-3 position-relative'>
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'domain', title: 'Domain' },
                            { name: 'new_transaction', title: 'New', component: formatCurrency },
                            { name: 'refund', title: 'Refund', component: formatCurrency },
                            { name: 'void', title: 'Void', component: formatCurrency },
                            { name: 'chargeback', title: 'Chargeback', component: formatChargeBackCurrency },
                            { name: 'net_revenue', title: 'Net Revenue', component: formatCurrency },
                            { name: 'revenue_collected', title: 'Revenue Collected', component: formatCurrency },
                            { name: 'referral_earning', title: 'Referral Earning', component: formatCurrency },
                            { name: 'referral_info', title: 'Referral Commission', component: referralInformation },
                            { name: 'platform_commission', title: 'Platform Commission' },
                            { name: 'platform_earning', title: 'Platform Earning', component: formatCurrency },
                            { name: 'model_earning', title: 'Model Earning', component: formatCurrency }
                        ]}
                        data={websiteReferralEarningReportData}
                    ></Table>
                </div>
                <div className='mb-4'>
                    <Pagination
                        totalPages={totalPage}
                        currentPage={currentPage}
                        totalItems={totalRows}
                        itemsPerPage={limit}
                        onItemClick={changePage}
                    ></Pagination>
                </div>
            </>
        }

    </Container>)
}

export default observer(LinkTrackingWebsiteReferralMonthlyEarningReport)
