import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import Table from '../table/Table'
import Select from 'react-select'
import { ActionMeta, ValueType } from 'react-select/src/types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons'
import _ from 'lodash'
import Domain from '../layout/Domain'
import { GatewayInfo, OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const StickyIoSummaryReportPage: React.FC<Props> = ({ rootStore }) => {
    const { StickyIoSummaryReportStore, websiteStore, StickyIoLogs } = rootStore
    const { setStickyIoSummaryReportDetails, filter, tableDetails, isLoading, declineSummary } = StickyIoSummaryReportStore
    const { getAllStickyIoPaymentGateways, paymentGateways } = StickyIoLogs

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | React.MouseEvent<HTMLDivElement>) => {
        const name = (e.target as HTMLInputElement).name
        const value = (e.target as HTMLInputElement).value

        if (name === 'limit') {
            filter.limit = parseInt(value)
        } else if (name === 'is_recurring') {
            filter.is_recurring = value
        } else if (name === 'gateway_id') {
            filter.gateway_id = value
        }
        setStickyIoSummaryReportDetails()
    }

    useEffect(() => {
        getAllStickyIoPaymentGateways()
        setStickyIoSummaryReportDetails()
    }, [setStickyIoSummaryReportDetails, getAllStickyIoPaymentGateways])

    const filterOptions = [
        { label: 'Feed Unlock', value: 'feed_unlock' },
        { label: 'Chat Unlock', value: 'chat_unlock' },
        { label: 'Tip', value: 'tip' },
        { label: 'Subscription', value: 'subscription' },
        { label: 'Cancel Subscription', value: 'cancel_subscription' },
        { label: 'Void Transaction', value: 'void_transaction' },
        { label: 'Refund Transaction', value: 'refund_transaction' }
    ]

    const limitOptions = [
        { label: '50', value: 50 },
        { label: '100', value: 100 },
        { label: '500', value: 500 },
        { label: '1000', value: 1000 }
    ]

    const selectLimitOptions = limitOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.value}
        </option>
    ))

    const paymentGatewayOption = [
        { label: 'All', value: 'all' }
    ]

    const paymentGateway = paymentGateways.map((gateway: GatewayInfo) => (
        { label: gateway.gateway_alias, value: gateway.gateway_id }
    ))
    paymentGatewayOption.push(...paymentGateway)

    const paymentGatewayOptions = paymentGatewayOption.map((option: { label: string, value: string }) => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        if (action.name === 'transaction_for' && value !== null) {
            filter.transaction_for = value
        } else {
            const selectedValue = _.get(value, 'value', '')
            filter.domain = selectedValue
        }
        setStickyIoSummaryReportDetails()
    }

    const tableCellPercentage = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))

        return (
            <>{jsonData.percentage}%</>
        )
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='card'>
            <div className='card-header justify-content-between d-flex'>
                <div>Sticky Io Summary Report</div>
                <div onClick={onChange}>
                    <label className='me-2'>Refresh</label>
                    <FontAwesomeIcon className={isLoading ? 'rotate' : ''} icon={faSyncAlt}></FontAwesomeIcon>
                </div>
            </div>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-md-2'>
                        <label className='me-2 mb-2'>Records Limit</label>
                        <select
                            className='form-control form-select'
                            id='limit'
                            name='limit'
                            value={filter.limit}
                            onChange={onChange}>
                            {selectLimitOptions}
                        </select>
                    </div>
                    <div className='col-md-3'>
                        <label className='me-2 mb-2'>Domain</label>
                        <Domain
                            onDomainChange={handleChange}
                            websiteStore={websiteStore}
                            loading={isLoading}
                            defaultDomain={filter.domain}
                            multiSelect={false}
                        />
                    </div>
                    <div className='col-md-3'>
                        <label className='me-2 mb-2'>Transaction For</label>
                        <Select
                            name='transaction_for'
                            isMulti={true}
                            onChange={handleChange}
                            options={filterOptions}
                        />
                    </div>
                    <div className='col-md-2'>
                        <label className='me-2 mb-2'>Payment Gateway</label>
                        <select
                            className='form-control form-select'
                            id='gateway_id'
                            name='gateway_id'
                            value={filter.gateway_id}
                            onChange={onChange}>
                            {paymentGatewayOptions}
                        </select>
                    </div>
                    <div className='col-md-2'>
                        <label className='me-2 mb-2'>Is Recurring</label>
                        <div>
                            <div className='form-check form-check-inline'>
                                <input
                                    className='form-check-input' type='radio' name='is_recurring' id='is_recurring_all' value='all' onChange={onChange} defaultChecked={true} />
                                <label className='form-check-label' htmlFor='is_recurring_all'>All</label>
                            </div>
                            <div className='form-check form-check-inline'>
                                <input className='form-check-input' type='radio' name='is_recurring' id='is_recurring_true' value='true' onChange={onChange} />
                                <label className='form-check-label' htmlFor='is_recurring_true'>true</label>
                            </div>
                            <div className='form-check form-check-inline'>
                                <input className='form-check-input' type='radio' name='is_recurring' id='is_recurring_false' value='false' onChange={onChange} />
                                <label className='form-check-label' htmlFor='is_recurring_false'>false</label>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    {isLoading ?
                        <div className='text-center'>
                            <div className='spinner-border' role='status' style={{ color: '#c6c6c6' }}>
                                <span className='sr-only'>Loading...</span>
                            </div>
                        </div>
                        :
                        <>
                            <h2 className='mt-3 mb-2'>Success / Failed Summary</h2>
                            <div className='table-responsive' >
                                <Table
                                    unique_key='_id'
                                    columns={[
                                        { name: 'count', title: 'No of Transactions' },
                                        { name: '_id', title: 'Name' },
                                        { name: 'percentage', title: 'Percentage', component: tableCellPercentage }

                                    ]}
                                    data={tableDetails}
                                ></Table>
                            </div>

                            <h2>Declined Summary</h2>
                            <div className='table-responsive'>
                                <Table
                                    unique_key='_id'
                                    columns={[
                                        { name: 'count', title: 'No of Transactions' },
                                        { name: '_id.response_code', title: 'Decline Code' },
                                        { name: 'error_message', title: 'Description' },
                                        { name: 'provider_name', title: 'Error Provider' },
                                        { name: 'provider_type', title: 'Error Type' },
                                        { name: 'percentage', title: 'Percentage', component: tableCellPercentage }
                                    ]}
                                    data={declineSummary}
                                ></Table>
                            </div>
                        </>
                    }
                </div>
            </div>
        </div >
    </Container >
}

export default observer(StickyIoSummaryReportPage)
