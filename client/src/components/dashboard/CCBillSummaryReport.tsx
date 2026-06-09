import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import Table from '../table/Table'
import { ActionMeta, ValueType } from 'react-select/src/types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons'
import { toJS } from 'mobx'
import Domain from '../layout/Domain'
import _ from 'lodash'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const CCBillSummaryReport: React.FC<Props> = ({ rootStore }) => {
    const { summaryReportStore, websiteStore, ccbillErrorCodeDescriptionStore, declineCodeDescriptionStore } = rootStore
    const { setCCBillSummaryReportDetails, filter, tableDetails, table1Details, table2Details, isLoading } = summaryReportStore
    const { getAllCCBillErrorCodeOptions } = ccbillErrorCodeDescriptionStore
    const { getAllDeclineCodeOptions } = declineCodeDescriptionStore

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | React.MouseEvent<HTMLDivElement>) => {
        const name = (e.target as HTMLInputElement).name
        const value = (e.target as HTMLInputElement).value

        if (name === 'error_type') {
            filter.error_type = value
        } else if (name === 'limit') {
            filter.limit = parseInt(value)
        } else if (name === 'is_recurring') {
            filter.is_recurring = value
        }
        setCCBillSummaryReportDetails()
    }

    useEffect(() => {
        getAllCCBillErrorCodeOptions()
        getAllDeclineCodeOptions()
        setCCBillSummaryReportDetails()
    }, [setCCBillSummaryReportDetails])

    const filterOptions = [
        { label: 'Charge by previous', value: 'Charge By Previous' },
        { label: 'Cancel subscription', value: 'Cancel Subscription' },
        { label: 'Get experation date cron', value: 'Get expiration date cron' }
    ]

    const selectOptions = filterOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

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

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const selectedvalue = _.get(value, 'value', '')
        filter.domain = selectedvalue
        setCCBillSummaryReportDetails()
    }

    const tableCellText = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { _id: string }
        const jsonData = toJS(data)
        const text = declineCodeDescriptionStore.getDeclineCodeDescription(jsonData._id)
        return (<>{text}</>)
    }

    const tableCellCodeText = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { _id: string }
        const jsonData = toJS(data)
        const text = ccbillErrorCodeDescriptionStore.getCCBillErrorCodeDescription(jsonData._id)

        return (<>{text}</>)
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
            <div className='card-header'>
                Summary Report
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
                        <label className='me-2 mb-2'>Type</label>
                        <select
                            className='form-control form-select'
                            id='error_type'
                            name='error_type'
                            onChange={onChange}>
                            {selectOptions}
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
                    <div className='col-md-2'>
                        <div className='mt-5' onClick={onChange}>
                            <label className='me-2'>Refresh</label>
                            <FontAwesomeIcon className={isLoading ? 'rotate' : ''} icon={faSyncAlt}></FontAwesomeIcon>
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
                            <h2>Success / Failed Summary</h2>
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
                                        { name: '_id', title: 'Decline Code' },
                                        { name: 'description', title: 'Description', component: tableCellText },
                                        { name: 'percentage', title: 'Percentage', component: tableCellPercentage }
                                    ]}
                                    data={table1Details}
                                ></Table>
                            </div>
                            <h2>CCBill Error Summary</h2>
                            <div className='table-responsive' >
                                <Table
                                    unique_key='_id'
                                    columns={[
                                        { name: 'count', title: 'No of Transactions' },
                                        { name: '_id', title: 'CCBill Error Code' },
                                        { name: 'description', title: 'Description', component: tableCellCodeText },
                                        { name: 'percentage', title: 'Percentage', component: tableCellPercentage }
                                    ]}
                                    data={table2Details}
                                ></Table>
                            </div>
                        </>
                    }
                </div>
            </div>
        </div >
    </Container >
}

export default observer(CCBillSummaryReport)
