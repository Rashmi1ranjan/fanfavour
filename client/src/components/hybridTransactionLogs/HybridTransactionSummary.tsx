import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import _ from 'lodash'
import Select from 'react-select'
import { ActionMeta, ValueType } from 'react-select/src/types'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import moment from 'moment'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import Domain from '../layout/Domain'
import { CountryDetails, GlobalTransactionSummary, OptionType, PaymentGatewayTransactionSummary } from '../../types/types'
interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const HybridTransactionSummary: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, HybridTransactionStore, CCBillRestApiAddCardLogStore } = rootStore
    const { summaryFilter, setTransactionSummaryData, globalTransactionSummary, paymentGatewayTransactionSummary, isLoading, paymentGatewayTransactionTotalSummary, secondaryPaymentSummary } = HybridTransactionStore
    const { countryList, getCountryList } = CCBillRestApiAddCardLogStore
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const [filterWith, setFilterWith] = useState('date')

    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })

    useEffect(() => {
        if (isDataLoading) {
            setInitialDates()
            setTransactionSummaryData()
            setIsDataLoading(false)
            getCountryList()
        }
    }, [setTransactionSummaryData])

    const setInitialDates = () => {
        const startDate = moment().subtract(7, 'days').format('MM/DD/YYYY')
        const endDate = moment().format('MM/DD/YYYY')

        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        summaryFilter.start_date = startDate
        summaryFilter.end_date = endDate
    }

    const openCloseDatePicker = () => {
        setShowDatePicker(!showDatePicker)
    }

    const onDatePickerChange = (ranges: RangeKeyDict) => {
        setRange(ranges['selection'])
    }

    const handleOnClick = () => {
        const startDate = moment(range.startDate).format('MM/DD/YYYY')
        const endDate = moment(range.endDate).format('MM/DD/YYYY')
        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        summaryFilter.start_date = startDate
        summaryFilter.end_date = endDate
        openCloseDatePicker()
    }

    const countries: OptionType[] = []
    const countriesOptions: OptionType[] = countryList.map((option: CountryDetails) => (
        { label: `${option.name} (${option.iso2})`, value: option.iso2 }
    ))
    countries.push(...countriesOptions)

    const filterRecords = () => {
        setTransactionSummaryData()
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name: string = e.target.name
        const value = e.target.value
        if (name === 'filter_by') {
            setFilterWith(value)
        }
        _.set(summaryFilter, name, value)
    }

    const handleChange = (value: ValueType<OptionType, true>, action: ActionMeta<OptionType>) => {
        const name = _.get(action, 'name', '')
        if (name === 'domain') {
            const optionValue = _.get(value, 'value', '')
            summaryFilter.domain = optionValue
        }

        if (name === 'country') {
            const countries = []
            for (const country of value) {
                countries.push(country.value)
            }
            summaryFilter.countries = countries
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className="mt-2 mb-3">Hybrid Transaction Summary</h4>
        <div className='row'>
            <div className='col-3'>
                <label className='me-2 d-flex align-items-center mb-2'>
                    Filter By
                    <div className="ms-2 form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="filter_by" id="date" value="date" onChange={onChange} defaultChecked={true} />
                        <label className="form-check-label" htmlFor="date">Date</label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="filter_by" id="record" value="record" onChange={onChange} />
                        <label className="form-check-label" htmlFor="record">All Records</label>
                    </div>
                </label>
                {
                    filterWith === 'date' &&
                    <>
                        <input
                            name='date_range'
                            id='date_range'
                            className='form-control'
                            data-target='#datePicker'
                            readOnly={true}
                            value={startDateInLocalString + ' - ' + endDateInLocalString}
                            onClick={openCloseDatePicker}
                        />
                        {showDatePicker &&
                            (
                                <div className='card text-right position-absolute collapsed' id='datePicker' style={{ zIndex: 1 }}>
                                    <div className='card-body'>
                                        <DateRangePicker
                                            className='border'
                                            data-toggle='collapse'
                                            scroll={{ enabled: false }}
                                            direction='horizontal'
                                            ranges={[range]}
                                            onChange={onDatePickerChange}
                                        />

                                    </div>
                                    <div className='card-footer text-end'>
                                        <button className='btn btn-outline-secondary me-2' onClick={openCloseDatePicker}>Close</button>
                                        <button className='btn btn-outline-primary' onClick={handleOnClick} >Apply</button>
                                    </div>
                                </div>
                            )
                        }
                    </>
                }
            </div>
            <div className='col-md-3'>
                <label className='me-2 mb-2'>Domain</label>
                <Domain
                    onDomainChange={handleChange}
                    websiteStore={websiteStore}
                    loading={isLoading}
                    defaultDomain={summaryFilter.domain}
                    multiSelect={false}
                />
            </div>
            <div className='col-md-6'>
                <label className='me-2 d-flex align-items-center mb-1'>
                    Countries
                    <div className="ms-2 form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="exclude_include_country" id="exclude_country" value="exclude" defaultChecked={true} onChange={onChange} />
                        <label className="form-check-label" htmlFor="exclude_country">Exclude</label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="exclude_include_country" id="include_county" value="include" onChange={onChange} />
                        <label className="form-check-label" htmlFor="include_county">Include</label>
                    </div>
                </label>
                <Select
                    name='country'
                    options={countries}
                    isMulti
                    onChange={handleChange}
                    className='mb-3'
                />
            </div>
            <div className='col-md-3'>
                <label className='me-2 mt-2 mb-2'>Is Recurring?</label>
                <div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="is_recurring" id="recurring_all" value="all" onChange={onChange} defaultChecked={true} />
                        <label className="form-check-label" htmlFor="recurring_all">All</label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="is_recurring" id="recurring_yes" value="true" onChange={onChange} />
                        <label className="form-check-label" htmlFor="recurring_yes">Yes</label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="is_recurring" id="recurring_no" value="false" onChange={onChange} />
                        <label className="form-check-label" htmlFor="recurring_no">No</label>
                    </div>
                </div>
            </div>
            <div className='col-md-3'>
                <label className='me-2 mt-2 mb-2'>Is Hybrid enabled?</label>
                <div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="is_cascade_enabled" id="is_cascade_enabled_all" value="all" onChange={onChange} defaultChecked={true} />
                        <label className="form-check-label" htmlFor="is_cascade_enabled_all">All</label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="is_cascade_enabled" id="is_cascade_enabled_yes" value="true" onChange={onChange} />
                        <label className="form-check-label" htmlFor="is_cascade_enabled_yes">Yes</label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="is_cascade_enabled" id="is_cascade_enabled_no" value="false" onChange={onChange} />
                        <label className="form-check-label" htmlFor="is_cascade_enabled_no">No</label>
                    </div>
                </div>
            </div>
            <div className='col-md-3 mt-2'>
                <button type="button"
                    className="btn btn-primary mt-4"
                    onClick={filterRecords}
                    disabled={isLoading}>
                    {isLoading === true &&
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                    Apply Filter</button>
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
                    <h4 className='mt-3 mb-2'>Transaction Summary</h4>
                    <div className='table-responsive' >
                        <table className='table table-bordered table-hover table-sm'>
                            <thead style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <tr>
                                    <th></th>
                                    <th rowSpan={2}>Success #</th>
                                    <th colSpan={2}>Failed #</th>
                                    <th rowSpan={2}>Success $</th>
                                    <th rowSpan={2}>Unique Failed $</th>
                                </tr>
                                <tr>
                                    <th></th>
                                    <th>All #</th>
                                    <th>Unique #</th>
                                </tr>
                            </thead>
                            <tbody>
                                {globalTransactionSummary.length > 0 ?
                                    globalTransactionSummary.map((summary: GlobalTransactionSummary) => {
                                        return <>
                                            <tr>
                                                <th>Normal</th>
                                                <td>{summary.normal_success}</td>
                                                <td>{summary.normal_failed}</td>
                                                <td>{summary.normal_unique_failed}</td>
                                                <td className='text-end'>{formatCurrency(summary.normal_success_amount)}</td>
                                                <td className='text-end'>{formatCurrency(summary.normal_unique_failed_amount)}</td>
                                            </tr>
                                            <tr>
                                                <th>Cascade</th>
                                                <td>{summary.cascade_success}</td>
                                                <td>---</td>
                                                <td>{summary.cascade_failed}</td>
                                                <td className='text-end'>{formatCurrency(summary.cascade_success_amount)}</td>
                                                <td className='text-end'>{formatCurrency(summary.cascade_failed_amount)}</td>
                                            </tr>
                                            <tr>
                                                <th>Total</th>
                                                <th>{summary.success}</th>
                                                <th>{summary.failed}</th>
                                                <th>{summary.unique_failed}</th>
                                                <th className='text-end'>{formatCurrency(summary.success_amount)}</th>
                                                <th className='text-end'>{formatCurrency(summary.unique_failed_amount)}</th>
                                            </tr>
                                        </>
                                    }) :
                                    <tr>
                                        <td colSpan={7} className='text-center'> No records found </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </>
            }
        </div>
        <div>
            {isLoading ?
                <div className='text-center'>
                    <div className='spinner-border' role='status' style={{ color: '#c6c6c6' }}>
                        <span className='sr-only'>Loading...</span>
                    </div>
                </div>
                :
                paymentGatewayTransactionSummary.length > 0 &&
                <>
                    <h4 className='mt-3 mb-2'>Payment Gateway Summary</h4>
                    <div className='table-responsive' >
                        <table className='table table-bordered table-hover table-sm'>
                            <thead style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <tr>
                                    <th></th>
                                    <th rowSpan={2}>Success #</th>
                                    <th colSpan={2}>Failed #</th>
                                    <th rowSpan={2}>Success $</th>
                                    <th rowSpan={2}>Unique Failed $</th>
                                </tr>
                                <tr>
                                    <th></th>
                                    <th>All #</th>
                                    <th>Unique #</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentGatewayTransactionSummary.map((summary: PaymentGatewayTransactionSummary) => {
                                    return <tr key={summary._id}>
                                        <th>{summary._id}</th>
                                        <td>{summary.success}</td>
                                        <td>{summary.failed}</td>
                                        <td>{summary.unique_failed}</td>
                                        <td className='text-end'>{formatCurrency(summary.success_amount)}</td>
                                        <td className='text-end'>{formatCurrency(summary.unique_failed_amount)}</td>
                                    </tr>
                                })}
                                <tr>
                                    <th>Total</th>
                                    <th>{paymentGatewayTransactionTotalSummary.success}</th>
                                    <th>{paymentGatewayTransactionTotalSummary.failed}</th>
                                    <th>{paymentGatewayTransactionTotalSummary.unique_failed}</th>
                                    <th className='text-end'>{formatCurrency(paymentGatewayTransactionTotalSummary.success_amount)}</th>
                                    <th className='text-end'>{formatCurrency(paymentGatewayTransactionTotalSummary.unique_failed_amount)}</th>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </>
            }
            <h4 className='mt-3 mb-2'>Processed By Secondary Gateway</h4>
            {isLoading ?
                <div className='text-center'>
                    <div className='spinner-border' role='status' style={{ color: '#c6c6c6' }}>
                        <span className='sr-only'>Loading...</span>
                    </div>
                </div>
                :
                <div className='table-responsive mb-5'>
                    <table className='table table-bordered table-hover table-sm'>
                        <thead>
                            <tr>
                                <th></th>
                                <th>Success #</th>
                                <th className='text-end'>Success $</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th>Normal</th>
                                <td>{secondaryPaymentSummary.normal_count}</td>
                                <td className='text-end'>{formatCurrency(secondaryPaymentSummary.normal_amount)}</td>
                            </tr>
                            <tr>
                                <th>Cascade</th>
                                <td>{secondaryPaymentSummary.cascade_count}</td>
                                <td className='text-end'>{formatCurrency(secondaryPaymentSummary.cascade_amount)}</td>
                            </tr>
                            <tr>
                                <th>Total</th>
                                <th>{secondaryPaymentSummary.total_count}</th>
                                <th className='text-end'>{formatCurrency(secondaryPaymentSummary.total_amount)}</th>
                            </tr>
                        </tbody>
                    </table>
                </div>
            }
        </div>
    </Container >
}
export default observer(HybridTransactionSummary)
