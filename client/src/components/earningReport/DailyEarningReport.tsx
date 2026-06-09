import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import moment from 'moment'
import Domain from '../layout/Domain'
import _ from 'lodash'
import { ActionMeta, ValueType } from 'react-select/src/types'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const DailyEarningReportPage: React.FC<Props> = ({ rootStore }) => {
    const { earningReportStore, websiteStore, EarningDashboardStore } = rootStore
    const { getDailyEarningReportDate, isLoading, daily_earning_report, currentPage, totalPage, limit, totalRows } = earningReportStore
    const { earningReportDate, getLastTransactionReportDate } = EarningDashboardStore
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedWebsite, setSelectedWebsite] = useState<string>('')

    useEffect(() => {
        setSelectedDate(new Date(earningReportDate))
    }, [earningReportDate])

    useEffect(() => {
        getLastTransactionReportDate()
        setSelectedDate(new Date(earningReportDate))
        getDailyEarningReportDate(1, {})
    }, [getDailyEarningReportDate, getLastTransactionReportDate])


    const changePage = (pageNUM: number) => {
        const startDate = moment(selectedDate).format('YYYY-MM-DD 00:00:00')
        const endDate = moment(selectedDate).format('YYYY-MM-DD 23:59:59')
        const filter = {
            domain: selectedWebsite,
            startDate: startDate,
            endDate: endDate
        }
        getDailyEarningReportDate(pageNUM, filter)
    }

    const handleOnChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name

        const startDate = moment(selectedDate).format('YYYY-MM-DD 00:00:00')
        const endDate = moment(selectedDate).format('YYYY-MM-DD 23:59:59')
        const filter = {
            domain: selectedWebsite,
            startDate: startDate,
            endDate: endDate
        }

        const selectedValue = _.get(value, 'value', '')
        if (name === 'domain') {
            setSelectedWebsite(selectedValue)
            filter.domain = selectedValue
        }
        getDailyEarningReportDate(1, filter)
    }

    const handleDateChange = (date: Date) => {
        setSelectedDate(date)
        const startDate = moment(date).format('YYYY-MM-DD 00:00:00')
        const endDate = moment(date).format('YYYY-MM-DD 23:59:59')
        const filter = {
            domain: selectedWebsite,
            startDate: startDate,
            endDate: endDate
        }
        getDailyEarningReportDate(1, filter)
    }

    const TableCellPaymentGatewayConfig = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const payment_gateway = jsonData.payment_gateway
        if (payment_gateway === 'ccbill') {
            return <>
                <div><strong>Subscription: </strong>{jsonData.subscription_sub_account}</div>
                <div><strong>Shop: </strong>{jsonData.shop_sub_account}</div>
                <div><strong>Tip: </strong>{jsonData.tip_sub_account}</div>
            </>
        } else {
            return <>
                <div><strong>Campaign Id: </strong>{jsonData.sticky_io_campaign_id}</div>
            </>
        }
    }

    const TableCellPaymentCommissions = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const payment_gateway = jsonData.payment_gateway
        if (payment_gateway === 'ccbill') {
            return <>
                <div><strong>Platform Commission: </strong>{jsonData.platform_commission}</div>
                <div><strong>CCBill Fees: </strong>{jsonData.ccbill_commission}</div>
            </>
        } else {
            return <>
                <div><strong>Platform Commission: </strong>{jsonData.platform_commission}</div>
                <div><strong>Sticky.io Fees: </strong>{jsonData.sticky_io_transaction_charge}</div>
            </>
        }
    }

    const TableCellPaymentGatewayCharge = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const payment_gateway = jsonData.payment_gateway
        switch (payment_gateway) {
        case 'sticky.io':
            return jsonData.sticky_io_charge
        case 'forumpay':
            return jsonData.forumpay_transaction_charge
        default:
            return jsonData.ccbill_charge
        }
    }

    const TableCellPaymentGateway = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const payment_gateway = jsonData.payment_gateway

        return payment_gateway !== 'sticky.io' ? jsonData.payment_gateway : ( (jsonData.sticky_io_payment_gateway !== undefined) ? `${jsonData.payment_gateway} (${jsonData.sticky_io_payment_gateway})` : jsonData.payment_gateway)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className="card mt-4">
            <div className="card-header">
                Earning Report
            </div>
            <div className="card-body">
                <div className='row'>
                    <div className='col-md-2'>
                        <label>Date</label><br />
                        <DatePicker
                            selected={selectedDate}
                            className='form-control form-select'
                            onChange={handleDateChange}
                        />
                    </div>
                    <div className='col-md-4'>
                        <label>Domain</label>
                        <Domain
                            onDomainChange={handleOnChange}
                            websiteStore={websiteStore}
                            loading={isLoading}
                            defaultDomain={selectedWebsite}
                            multiSelect={false}
                        />
                    </div>
                </div>
                <div className='table-responsive mt-3'>
                    {isLoading === false ?
                        <Table
                            unique_key='_id'
                            columns={[
                                { name: 'website_id', title: 'Id' },
                                { name: 'domain', title: 'Domain' },
                                { name: 'target_date', title: 'Date' },
                                { name: 'payment_gateway', title: 'Payment Gateway', component: TableCellPaymentGateway },
                                { name: 'subscription_sub_account', title: 'Payment Configuration', component: TableCellPaymentGatewayConfig },
                                { name: 'platform_commission', title: 'Commissions', component: TableCellPaymentCommissions },
                                { name: 'subscription_amount', title: 'Subscription Gross Amount' },
                                { name: 'shop_amount', title: 'Shop Gross Amount' },
                                { name: 'tip_amount', title: 'Tip Gross Amount' },
                                { name: 'subscription_refund_amount', title: 'Subscription Refund Amount' },
                                { name: 'shop_refund_amount', title: 'Shop Refund Amount' },
                                { name: 'tip_refund_amount', title: 'Tip Refund Amount' },
                                { name: 'subscription_chargeback_amount', title: 'Subscription Chargeback Amount' },
                                { name: 'shop_chargeback_amount', title: 'Shop Chargeback Amount' },
                                { name: 'tip_chargeback_amount', title: 'Tip Chargeback Amount' },
                                { name: 'subscription_chargeback_count', title: 'Subscription Chargeback Count' },
                                { name: 'shop_chargeback_count', title: 'Shop Chargeback Count' },
                                { name: 'tip_chargeback_count', title: 'Tip Chargeback Count' },
                                { name: 'subscription_void_amount', title: 'Subscription Void Amount' },
                                { name: 'shop_void_amount', title: 'Shop void amount' },
                                { name: 'tip_void_amount', title: 'Tip Void Amount' },
                                { name: 'gross_revenue', title: 'Gross Revenue' },
                                { name: 'gross_refund', title: 'Gross Refund' },
                                { name: 'chargeback_amount', title: 'Chargeback Amount' },
                                { name: 'chargeback_count', title: 'Chargeback Count' },
                                { name: 'refund_amount', title: 'Refund Amount' },
                                { name: 'void_amount', title: 'Void Amount' },
                                { name: 'ccbill_charge', title: 'Payment Gateway Charge', component: TableCellPaymentGatewayCharge },
                                { name: 'chargeback_penalty', title: 'Chargeback Penalty' },
                                { name: 'net_revenue', title: 'Net Revenue' },
                                { name: 'revenue_collected', title: 'Revenue Collected' },
                                { name: 'platform_earning', title: 'Platform Earning' },
                                { name: 'model_earning', title: 'Model Earning' },
                                { name: 'referral_amount', title: 'Referral Amount'},
                                { name: 'referral_amount1', title: 'Referral Amount1'},
                                { name: 'referral_amount2', title: 'Referral Amount2'}
                            ]}
                            data={daily_earning_report}
                        ></Table>
                        : null}
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
    </Container >
}

export default observer(DailyEarningReportPage)
