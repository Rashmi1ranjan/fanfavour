import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import Table from '../table/Table'
import Select from 'react-select'
import { ActionMeta, ValueType } from 'react-select/src/types'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { Cell } from './../table/Definations'
import moment from 'moment'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faWindowClose } from '@fortawesome/free-solid-svg-icons'
import classNames from 'classnames'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import styled from 'styled-components'
import Domain from '../layout/Domain'
import { CCBillCardErrorDetail, OptionType, CountryDetails } from '../../types/types'

interface Props {
    rootStore: RootStore
}

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

const CCBillCardErrorLog: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, CCBillRestApiAddCardLogStore } = rootStore
    const [showViewModel, setShowViewModel] = useState(false)
    const [selectedWebsite, setSelectedWebsite] = useState<string>('')
    const [logDetail, setLogDetail] = useState<CCBillCardErrorDetail | undefined>()
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const { logList, totalPage, isLoading, currentPage, totalRows, getCardAddLog, totalFail, totalSuccess, filter, getCountryList, countryList, totalSubscribed } = CCBillRestApiAddCardLogStore

    const changePage = (pageNUM: number) => {
        getCardAddLog(pageNUM, filter)
    }

    useEffect(() => {
        setInitialDates()
        getCardAddLog(1, filter)
        getCountryList()
    }, [getCardAddLog])

    const onDomainChange = (value: ValueType<OptionType[], false>, actions: any) => {
        const domain = []
        if (value) {
            for (const country of value) {
                domain.push(country.value)
            }
        }
        filter.domain = domain
        getCardAddLog(1, filter)
    }

    const onRecaptchaFilterChange = (value: ValueType<OptionType, true>, actions: any) => {
        const id = _.map(value, 'value')
        filter.reCaptCha = id
        getCardAddLog(1, filter)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value
        if (name === 'user_id') {
            filter.user_id = value.trim()
        }
        if (name === 'email') {
            filter.email = value.trim()
        }
        if (name === 'is_error') {
            filter.is_error = value
        }
        if (name === 'is_unique') {
            filter.is_unique = (e.target as HTMLInputElement).checked
        }
        if (name === 'exclude_include_country') {
            filter.exclude_include_country = value
        }
        if (name === 'exclude_include_domain') {
            filter.exclude_include_domain = value
        }
        if (name === 'payment_gateway') {
            filter.payment_gateway = value
        }
        if (name === 'card_id') {
            filter.card_id = value
        }
        getCardAddLog(1, filter)
    }

    const countries: OptionType[] = []
    const countriesOptions: OptionType[] = countryList.map((option: CountryDetails) => (
        { label: `${option.name} (${option.iso2})`, value: option.iso2 }
    ))
    countries.push(...countriesOptions)

    const onCountryChange = (value: ValueType<OptionType, true>, actions: any) => {
        const countries = []
        for (const country of value) {
            countries.push(country.value)
        }
        filter.countries = countries
        getCardAddLog(1, filter)
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const timeToShow = `${data.value} (${timeAgo})`
        return (timeToShow)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return (<>
            <div onClick={() => {
                viewDetail(jsonData)
            }}>
                <FontAwesomeIcon icon={faInfoCircle} />
            </div>
        </>)
    }

    const TableCellAddress = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        if (jsonData.city !== undefined) {
            return (<>{jsonData.address}, {jsonData.country}, {jsonData.state}, {jsonData.city}, {jsonData.zipcode}</>)
        }
        return (<></>)
    }

    const TableCellUserInfo = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return (<>{jsonData.user_id}<br />{jsonData.email}<br />{jsonData.name_on_card}<br />{jsonData.card_id}<br />{jsonData.expire_month}/{jsonData.expire_year}<br />{jsonData.card_last_four_digits}</>)
    }

    const TableCellCCBillError = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        if (jsonData.payment_gateway === 'sticky.io') {
            return (<>{jsonData.sticky_io_error_code}<br />{jsonData.sticky_io_error_message}</>)
        }
        return (<>{jsonData.ccbill_error_code}<br />{jsonData.ccbill_error_message}</>)
    }

    const TableCellRequestFrom: React.FC<Cell> = (props: { value: string }) => {
        if (props.value !== '') {
            const requestFrom = props.value === 'true' ? 'Subscription' : 'Add Card'
            const badgeClass = props.value === 'true' ? 'text-bg-info' : 'text-bg-warning'
            return (<span className={classNames('badge bg-pill', badgeClass)}>{requestFrom}</span>)
        }
        return (<></>)
    }

    const TableCellIsSubscriptionSuccess: React.FC<Cell> = (props: { value: string }) => {
        if (props.value !== '') {
            const requestFrom = props.value === 'true' ? 'Success' : 'Failed'
            const badgeClass = props.value === 'true' ? 'text-bg-success' : 'text-bg-danger'
            return (<span className={classNames('badge bg-pill', badgeClass)}>{requestFrom}</span>)
        }
        return (<></>)
    }

    const viewDetail = (jsonData: CCBillCardErrorDetail) => {
        setLogDetail(jsonData)
        setShowViewModel(true)
    }

    const handleEditDialogClose = () => {
        setLogDetail(undefined)
        setShowViewModel(false)
    }

    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })

    const setInitialDates = () => {
        const startDate = moment().subtract(7, 'days').format('MM/DD/YYYY')
        const endDate = moment().subtract(1, 'days').format('MM/DD/YYYY')
        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        filter.start_date = startDate
        filter.end_date = endDate
        setRange({
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            key: 'selection'
        })
    }

    const handleOnClick = () => {
        const startDate = moment(range.startDate).format('MM/DD/YYYY')
        const endDate = moment(range.endDate).format('MM/DD/YYYY')
        setStartDateInLocalString(startDate)
        setEndDateInLocalString(endDate)
        filter.start_date = startDate
        filter.end_date = endDate
        openCloseDatePicker()
        getCardAddLog(1, filter)
    }

    const openCloseDatePicker = () => {
        setShowDatePicker(!showDatePicker)
    }

    const handleDatePickerChange = (ranges: RangeKeyDict) => {
        setRange(ranges['selection'])
    }

    const reCaptChaScore: OptionType[] = [
        { label: '0.1', value: '0.1' },
        { label: '0.2', value: '0.2' },
        { label: '0.3', value: '0.3' },
        { label: '0.4', value: '0.4' },
        { label: '0.5', value: '0.5' },
        { label: '0.6', value: '0.6' },
        { label: '0.7', value: '0.7' },
        { label: '0.8', value: '0.8' },
        { label: '0.9', value: '0.9' },
        { label: '1.0', value: '1.0' }
    ]

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className='card-title'>Add Card Log</h4>
        <div className='card'>
            <div className='card-body'>
                <form>
                    <div className='row'>
                        <div className='col-md-3'>
                            <label className='mb-2'>Date Range</label>
                            <input
                                name='date_range'
                                id='date_range'
                                className='form-control mb-3'
                                data-target='#datePicker'
                                readOnly={true}
                                value={startDateInLocalString + ' - ' + endDateInLocalString}
                                onClick={openCloseDatePicker}
                            />
                            {showDatePicker ?
                                (
                                    <div className='card text-right position-absolute collapsed' id='datePicker' style={{ zIndex: 1 }}>
                                        <div className='card-body'>
                                            <DateRangePicker
                                                className='border'
                                                data-toggle='collapse'
                                                scroll={{ enabled: false }}
                                                direction='horizontal'
                                                ranges={[range]}
                                                onChange={handleDatePickerChange} />
                                        </div>
                                        <div className='card-footer text-end'>
                                            <button className='btn btn-outline-secondary me-2' onClick={openCloseDatePicker}>Close</button>
                                            <button className='btn btn-outline-primary' onClick={handleOnClick} >Apply</button>
                                        </div>
                                    </div>
                                )
                                : null
                            }
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Email</label>
                            <input
                                name='email'
                                type='text'
                                className='form-control mb-3'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>User Id</label>
                            <input
                                name='user_id'
                                type='text'
                                className='form-control mb-3'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Card Id</label>
                            <input
                                name='card_id'
                                type='text'
                                className='form-control mb-3'
                                onChange={onChange}
                            />
                        </div>

                        <div className='col-md-6'>
                            <label className='me-2 mt-2 d-flex align-items-center mb-1'>
                                Domain
                                <div className='ms-2 form-check form-check-inline'>
                                    <input className='form-check-input' type='radio' name='exclude_include_domain' id='include_domain' value='include' defaultChecked={true} onChange={onChange} />
                                    <label className='form-check-label' htmlFor='include_domain'>Include</label>
                                </div>
                                <div className='form-check form-check-inline'>
                                    <input className='form-check-input' type='radio' name='exclude_include_domain' id='exclude_domain' value='exclude' onChange={onChange} />
                                    <label className='form-check-label' htmlFor='exclude_domain'>Exclude</label>
                                </div>
                            </label>
                            <Domain
                                onDomainChange={onDomainChange}
                                websiteStore={websiteStore}
                                loading={isLoading}
                                defaultDomain={selectedWebsite}
                                multiSelect={true}
                            />
                        </div>
                        <div className='col-md-6'>
                            <label className='me-2 mt-2 d-flex align-items-center mb-1'>
                                Countries
                                <div className='ms-2 form-check form-check-inline'>
                                    <input className='form-check-input' type='radio' name='exclude_include_country' id='exclude_country' value='exclude' defaultChecked={true} onChange={onChange} />
                                    <label className='form-check-label' htmlFor='exclude_country'>Exclude</label>
                                </div>
                                <div className='form-check form-check-inline'>
                                    <input className='form-check-input' type='radio' name='exclude_include_country' id='include_county' value='include' onChange={onChange} />
                                    <label className='form-check-label' htmlFor='include_county'>Include</label>
                                </div>
                            </label>
                            <Select
                                name='country'
                                options={countries}
                                isMulti
                                onChange={onCountryChange}
                                className='mb-3'
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mt-2 mb-2'>RecaptCha Score</label>
                            <Select
                                name='recaptchaScore'
                                options={reCaptChaScore}
                                isMulti
                                onChange={onRecaptchaFilterChange}
                                className='mb-3'
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mt-2 mb-2'>Is Error?</label>
                            <div>
                                <div className='form-check form-check-inline'>
                                    <input className='form-check-input' type='radio' name='is_error' id='error_all' value='all' onChange={onChange} defaultChecked={true} />
                                    <label className='form-check-label' htmlFor='error_all'>All</label>
                                </div>
                                <div className='form-check form-check-inline'>
                                    <input className='form-check-input' type='radio' name='is_error' id='error_yes' value='true' onChange={onChange} />
                                    <label className='form-check-label' htmlFor='error_yes'>Yes</label>
                                </div>
                                <div className='form-check form-check-inline'>
                                    <input className='form-check-input' type='radio' name='is_error' id='error_no' value='false' onChange={onChange} />
                                    <label className='form-check-label' htmlFor='error_no'>No</label>
                                </div>
                            </div>
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mt-2 mb-2'>Payment Gateway</label>
                            <div>
                                <div className='form-check form-check-inline'>
                                    <input className='form-check-input' type='radio' name='payment_gateway' id='payment_gateway_all' value='all' onChange={onChange} defaultChecked={true} />
                                    <label className='form-check-label' htmlFor='payment_gateway_all'>All</label>
                                </div>
                                <div className='form-check form-check-inline'>
                                    <input className='form-check-input' type='radio' name='payment_gateway' id='ccbill' value='ccbill' onChange={onChange} />
                                    <label className='form-check-label' htmlFor='ccbill'>CCBill</label>
                                </div>
                                <div className='form-check form-check-inline'>
                                    <input className='form-check-input' type='radio' name='payment_gateway' id='sticky.io' value='sticky.io' onChange={onChange} />
                                    <label className='form-check-label' htmlFor='sticky.io'>Sticky.io</label>
                                </div>
                            </div>
                        </div>
                        <div className='col-md-3'>
                            <div className='form-check form-switch mt-3'>
                                <input className='form-check-input' type='checkbox' id='is_unique' defaultChecked={true} onChange={onChange} name='is_unique' />
                                <label className='form-check-label' htmlFor='is_unique'>Is Unique?</label>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <div className='my-4'>
            <div className='row justify-content-center'>
                <div className='col-lg-3'>
                    <div className='card'>
                        <div className='card-body'>
                            <h5 className='card-title text-center'>Total Logs</h5>
                            <h3 className='text-center'>{totalRows}</h3>
                        </div>
                    </div>
                </div>
                <div className='col-lg-3'>
                    <div className='card'>
                        <div className='card-body'>
                            <h5 className='card-title text-center'>Total User Subscribed</h5>
                            <h3 className='text-center text-info'>
                                {totalSubscribed}
                                {
                                    totalRows > 0 &&
                                    <small className='ms-2'>({((totalSubscribed * 100) / totalRows).toFixed(2)}%)</small>
                                }
                            </h3>
                        </div>
                    </div>
                </div>
                <div className='col-lg-3'>
                    <div className='card'>
                        <div className='card-body'>
                            <h5 className='card-title text-center'>Total Success Transactions</h5>
                            <h3 className='text-center text-success'>
                                {totalSuccess}
                                {
                                    totalRows > 0 &&
                                    <small className='ms-2'>({((totalSuccess * 100) / totalRows).toFixed(2)}%)</small>
                                }
                            </h3>
                        </div>
                    </div>
                </div>
                <div className='col-lg-3'>
                    <div className='card'>
                        <div className='card-body'>
                            <h5 className='card-title text-center'>Total Failed Transactions</h5>
                            <h3 className='text-center text-danger'>
                                {totalFail}
                                {
                                    totalRows > 0 &&
                                    <small className='ms-2'>({((totalFail * 100) / totalRows).toFixed(2)}%)</small>
                                }
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
            <div className='table-responsive mt-3'>
                <Table
                    unique_key='_id'
                    columns={[
                        { name: 'domain', title: 'Domain' },
                        { name: 'user_id', title: 'User Id, Email, Name On Card, Card Id, Expire Date, Last 4 Digit', component: TableCellUserInfo },
                        { name: 'address', title: 'Address, Country, State, City, Zipcode', component: TableCellAddress },
                        { name: 'payment_gateway', title: 'Payment Gateway' },
                        { name: 'is_error', title: 'Is Error' },
                        { name: 'is_unique', title: 'Is Unique' },
                        { name: 'is_subscription_success', title: 'Subscription Status', component: TableCellIsSubscriptionSuccess },
                        { name: 'from_subscription', title: 'Request from', component: TableCellRequestFrom },
                        { name: 'ccbill_error_message', title: 'Error Code and Message', component: TableCellCCBillError },
                        { name: 'ip', title: 'IP Address' },
                        { name: 'recaptcha_score', title: 'Recaptcha Score' },
                        { name: 'createdAt', title: 'Date', component: TableCellTimeAgo },
                        { name: '_id', title: 'Action', component: tableCellButton }
                    ]}
                    data={logList}
                    isLoading={isLoading}
                ></Table>
            </div>
            <Pagination
                totalPages={totalPage}
                currentPage={currentPage}
                totalItems={totalRows}
                itemsPerPage={20}
                onItemClick={changePage}
            ></Pagination>
        </div>
        {showViewModel ?
            <div className='modal fade show' role='dialog' style={{ display: 'block', backgroundColor: '#00000080' }
            } >
                <div className='modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable'>
                    <div className='modal-content'>
                        <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                            <h5 className='modal-title'>CCBill Log Detail</h5>
                            <div onClick={() => {
                                handleEditDialogClose()
                            }} style={{ cursor: 'pointer' }}>
                                <FontAwesomeIcon icon={faWindowClose} />
                            </div>
                        </div>
                        <div className='modal-body' style={{ lineHeight: 'normal' }}>
                            <div className='container'>
                                <div className='row mt-3'>
                                    <div className='col-md-4'>Domain:</div>
                                    <div className='col-md-8'>{logDetail?.domain}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>User id:</div>
                                    <div className='col-md-8'>{logDetail?.user_id}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Email:</div>
                                    <div className='col-md-8'>{logDetail?.email}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Address:</div>
                                    <div className='col-md-8'>{logDetail?.address}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>City:</div>
                                    <div className='col-md-8'>{logDetail?.city}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>State:</div>
                                    <div className='col-md-8'>{logDetail?.state}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Country:</div>
                                    <div className='col-md-8'>{logDetail?.country}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Zipcode:</div>
                                    <div className='col-md-8'>{logDetail?.zipcode}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Name On Card:</div>
                                    <div className='col-md-8'>{logDetail?.name_on_card}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Card Type:</div>
                                    <div className='col-md-8'>{logDetail?.card_type}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Payment Gateway:</div>
                                    <div className='col-md-8'>{logDetail?.payment_gateway}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Request From:</div>
                                    <div className='col-md-8'>
                                        {
                                            logDetail?.from_subscription !== undefined &&
                                            <span className={classNames('badge bg-pill', logDetail?.from_subscription === true ? 'text-bg-info' : 'text-bg-warning')}>{logDetail?.from_subscription === true ? 'Subscription' : 'Add Card'}</span>
                                        }
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Is Subscription Success:</div>
                                    <div className='col-md-8'>
                                        {
                                            logDetail?.is_subscription_success !== undefined &&
                                            <span className={classNames('badge bg-pill', logDetail?.is_subscription_success === true ? 'text-bg-success' : 'text-bg-danger')}>{logDetail?.is_subscription_success === true ? 'Success' : 'Failed'}</span>
                                        }
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Is Error:</div>
                                    <div className='col-md-8'>{logDetail?.is_error?.toString()}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Response:</div>
                                    <div className='col-md-8'>
                                        <span className={'text-break'}>
                                            {logDetail?.payment_gateway === 'sticky.io' ? JSON.stringify(logDetail?.sticky_io_response) : JSON.stringify(logDetail?.ccbill_response)}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>IP Address</div>
                                    <div className='col-md-8'>{logDetail?.ip}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Error code:</div>
                                    <div className='col-md-8'>
                                        {logDetail?.payment_gateway === 'sticky.io' ? logDetail?.sticky_io_error_code : logDetail?.ccbill_error_code}
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Error Message:</div>
                                    <div className='col-md-8'>
                                        {logDetail?.payment_gateway === 'sticky.io' ? logDetail?.sticky_io_error_message : logDetail?.ccbill_error_message}
                                    </div>
                                </div>
                                <hr />
                            </div>
                        </div>
                    </div>
                </div>
            </div > : null}
    </Container >
}

export default observer(CCBillCardErrorLog)
