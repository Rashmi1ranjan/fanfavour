import React, { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import moment from 'moment'
import Table from '../table/Table'
import styled from 'styled-components'
import Pagination from '../table/Pagination'
import Domain from '../layout/Domain'
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

const WebsiteMonthlyEarningReport: React.FC<Props> = ({ rootStore }) => {
    const { earningReportStore, websiteStore } = rootStore
    const { getMonthlyEarningReportDate, monthly_earning_report, isLoading, monthly_filter, monthly_earning_currentPage, monthly_earning_totalPage, monthly_earning_totalRows, total_earning_report } = earningReportStore
    const [isLoaded, setIsLoaded] = useState(false)
    const [selectedWebsite, setSelectedWebsite] = useState<string>('')
    const [month, setMonth] = useState(new Date())

    useEffect(() => {
        getMonthlyEarningReportDate(1)
    }, [getMonthlyEarningReportDate])

    if (isLoaded === false) {
        setIsLoaded(true)
    }

    const getEarningReport = () => {
        getMonthlyEarningReportDate(1)
    }

    const changePage = (pageNUM: number) => {
        getMonthlyEarningReportDate(pageNUM)
    }

    const handleOnChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')

        if (name === 'domain') {
            setSelectedWebsite(selectedValue)
            monthly_filter.domain = selectedValue
        }
    }

    const TableCellPaymentGateway = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const payment_gateways = jsonData.payment_gateway

        const payment_gateway = payment_gateways.payment_gateway
        let transaction_payment_gateway = ''
        if (payment_gateway === 'sticky.io') {
            transaction_payment_gateway = payment_gateways.sticky_io_payment_gateway
        }

        const payment_gateway_color = payment_gateway === 'sticky.io' ? 'badge text-bg-primary' : payment_gateway === 'total' ? 'badge text-bg-info' : 'badge text-bg-secondary'
        const transaction_payment_gateway_color = transaction_payment_gateway === 'spoton' ? 'badge text-bg-success' : 'badge text-bg-warning'

        return (
            <>
                <div>{jsonData.domain}</div>
                <div>
                    <span className={payment_gateway_color}>{payment_gateway}</span>
                    {
                        transaction_payment_gateway !== '' && <> / <span className={transaction_payment_gateway_color}>{transaction_payment_gateway}</span></>
                    }
                </div>
            </>
        )
    }

    const TableCellPaymentGatewayCharge = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const payment_gateway = jsonData.payment_gateway

        if (jsonData.domain === 'Total') {
            const stickyIoCharge = jsonData.sticky_io_charge.replace('$', '')
            const ccbillCharge = jsonData.ccbill_charge.replace('$', '')
            const forumPayCharge = jsonData.forumpay_transaction_charge.replace('$', '')
            return '$' + (parseFloat(ccbillCharge) + parseFloat(stickyIoCharge) + parseFloat(forumPayCharge)).toFixed(2)
        }
        switch (payment_gateway.payment_gateway) {
        case 'sticky.io':
            return jsonData.sticky_io_charge
        case 'forumpay':
            return jsonData.forumpay_transaction_charge
        default:
            return jsonData.ccbill_charge
        }
    }

    const TableCellChargeback = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))

        return `${jsonData.chargeback} (${jsonData.chargeback_count})`
    }

    const TableCellStickyIoCharge = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const payment_gateway = jsonData.payment_gateway.payment_gateway
        if (payment_gateway !== 'sticky.io') {
            const charge = '0.00 (0%)'
            return charge
        }

        const paymentGatewayCharge = jsonData.sticky_io_charge.replace('$', '')
        const stickyIoCharge = jsonData.sticky_io_transaction_cost.replace('$', '')
        const percentageOfStickyIo = ((stickyIoCharge * 100) / paymentGatewayCharge).toFixed(2)
        const charge = `${jsonData.sticky_io_transaction_cost} (${percentageOfStickyIo}%)`
        return charge
    }

    const handleDateChange = (date: Date) => {
        const startDate = moment(date).clone().startOf('month').format('YYYY-MM-DD 00:00:00')
        const endDate = moment(date).clone().endOf('month').format('YYYY-MM-DD 23:59:59')
        setMonth(date)
        monthly_filter.start_date = startDate
        monthly_filter.end_date = endDate
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className="mt-2 mb-3">Website Monthly Earnings</h4>
        <div className='row'>
            <div className='col-3'>
                <label className='me-2 mb-2'>Month/Year</label>
                <DatePicker
                    className='form-control mb-2'
                    selected={month}
                    onChange={handleDateChange}
                    dateFormat="MM/yyyy"
                    showMonthYearPicker
                />
            </div>
            <div className='col-3'>
                <label className='me-2 mb-2'>Domain</label>
                <Domain
                    onDomainChange={handleOnChange}
                    websiteStore={websiteStore}
                    loading={isLoading}
                    defaultDomain={monthly_filter.domain}
                    multiSelect={false}
                />
            </div>
            <div className='col-md-3'>
                <button type="button"
                    className="btn btn-primary mt-4"
                    onClick={getEarningReport}
                    disabled={isLoading}>
                    {isLoading === true &&
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                    Apply Filter</button>
            </div>
        </div>
        <div className='row'>
            <div className='col-12'>
                <h5 className='mt-4'>Earning Summary</h5>
                <div className='table-responsive mt-3 position-relative'>
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'net_revenue', title: 'Net Revenue' },
                            { name: 'ccbill_charge', title: 'Payment Gateway Charge', component: TableCellPaymentGatewayCharge },
                            { name: 'revenue_collected', title: 'Revenue Collected' },
                            { name: 'platform_earning', title: 'Platform Earning' },
                            { name: 'model_earning', title: 'Model Earning' },
                            { name: 'sticky_io_transaction_cost', title: 'Sticky.io Charge', component: TableCellStickyIoCharge }
                        ]}
                        data={total_earning_report}
                        isLoading={isLoading}
                    ></Table>
                </div>
                <h5 className='mt-4'>Earning By Domain</h5>
                <div className='table-responsive mt-3 position-relative'>
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'Website', title: 'Domain', component: TableCellPaymentGateway },
                            { name: 'new_transaction', title: 'New Transaction' },
                            { name: 'refund', title: 'Refund' },
                            { name: 'void', title: 'Void' },
                            { name: 'chargeback', title: 'Chargeback', component: TableCellChargeback },
                            { name: 'net_revenue', title: 'Net Revenue' },
                            { name: 'ccbill_charge', title: 'Payment Gateway Charge', component: TableCellPaymentGatewayCharge },
                            { name: 'ccbill_charge', title: 'Sticky.io Charge', component: TableCellStickyIoCharge },
                            { name: 'revenue_collected', title: 'Revenue Collected' },
                            { name: 'platform_earning', title: 'Platform Earning' },
                            { name: 'model_earning', title: 'Model Earning' }
                        ]}
                        data={monthly_earning_report}
                        isLoading={isLoading}
                    ></Table>
                </div>
                <div className='mb-4'>
                    <Pagination
                        totalPages={monthly_earning_totalPage}
                        currentPage={monthly_earning_currentPage}
                        totalItems={monthly_earning_totalRows}
                        itemsPerPage={50}
                        onItemClick={changePage}
                    ></Pagination>
                </div>
            </div>
        </div>
    </Container>
}

export default observer(WebsiteMonthlyEarningReport)
