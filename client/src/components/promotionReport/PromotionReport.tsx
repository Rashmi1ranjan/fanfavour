import React, { useEffect, useState, useRef } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import Select from 'react-select'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import _ from 'lodash'
import Domain from '../layout/Domain'
import { ActionMeta, ValueType } from 'react-select/src/types'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean
// TODO : assign type
const useStateWithCallback = (initialState: any) => {
    const [state, setState] = useState(initialState)
    const callbackRef = useRef(() => undefined)

    const setStateCB = (newState: any, callback: any) => {
        callbackRef.current = callback
        setState(newState)
    }

    useEffect(() => {
        if (callbackRef.current) {
            callbackRef.current()
        }
    }, [state])

    return [state, setStateCB]
}

const PromotionReport: React.FC<Props> = ({ rootStore }) => {
    const { PromotionReportStore, websiteStore } = rootStore
    const { getPromotionReportList, promotionReportData, currentPage, totalPage, limit, totalRows } = PromotionReportStore
    const [subscriptionPromotionType, setSubscriptionPromotionType] = useState('all')
    const [contentPromotionType, setContentPromotionType] = useState('all')
    const [domain, setDomain] = useState('')
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDate, setStartDate] = useStateWithCallback('')
    const [endDate, setEndDate] = useStateWithCallback('')

    const subscriptionPromotionTypeOption: OptionType[] = [
        { label: 'All', value: 'all' },
        { label: 'Subscriber Promos', value: 'SUBSCRIPTION' },
        { label: 'Content Promos', value: 'LOCKED_CONTENT' }
    ]
    const contentPromotionTypeOption1: OptionType[] = [
        { label: 'All', value: 'all' },
        { label: 'Only New Subscribers', value: 'NEW_USERS' },
        { label: 'Only Past Subscribers', value: 'OLD_USERS' }
    ]
    const contentPromotionTypeOption2: OptionType[] = [
        { label: 'All', value: 'all' },
        { label: 'Mass', value: 'MASS' },
        { label: 'Feed', value: 'FEED' }
    ]

    useEffect(() => {
        getPromotionReportList(1, { subscription_promotion_type: 'all', content_promotion_type: 'all', domain: domain })
    }, [getPromotionReportList])

    const changePage = (pageNUM: number) => {
        getPromotionReportList(pageNUM, { subscription_promotion_type: subscriptionPromotionType, content_promotion_type: contentPromotionType, domain: domain })
    }

    const promotionInfo = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const promotionId = jsonData.promotion_id
        const promotionInfo = jsonData.promotion_info
        const startDate = jsonData.start_date

        return (<>
            <span>{promotionId}</span><br />
            <span>{promotionInfo}</span><br />
            <span>{startDate}</span>
        </>
        )
    }

    const websiteInfo = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const websiteUrl = jsonData.website_url
        const link = `http://${websiteUrl}/admin/promotion-reports`
        return (<>
            <a href={link} target='_blank' rel='noreferrer'>{websiteUrl}</a>
        </>
        )
    }

    const selectedOption = _.find(subscriptionPromotionTypeOption, (item: OptionType) => {
        return item.value === subscriptionPromotionType
    })

    let selectedContentOption = _.find(subscriptionPromotionType === 'SUBSCRIPTION' ? contentPromotionTypeOption1 : contentPromotionTypeOption2, (item: OptionType) => {
        return item.value === contentPromotionType
    })

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')
        const filter = {
            subscription_promotion_type: subscriptionPromotionType,
            content_promotion_type: contentPromotionType,
            domain: domain,
            startDate: startDate,
            endDate: endDate
        }
        if (name === 'subscription') {
            setSubscriptionPromotionType(selectedValue)
            setContentPromotionType('all')
            filter.subscription_promotion_type = selectedValue
            filter.content_promotion_type = 'all'
            selectedContentOption = _.find(subscriptionPromotionType === 'SUBSCRIPTION' ? contentPromotionTypeOption1 : contentPromotionTypeOption2, (item: OptionType) => {
                return item.value === 'all'
            })
        } else if (name === 'content') {
            setContentPromotionType(selectedValue)
            filter.content_promotion_type = selectedValue
        } else if (name === 'domain') {
            setDomain(selectedValue)
            filter.domain = selectedValue
        }
        callApi(filter)
    }

    const callApi = (filter: object) => {
        getPromotionReportList(1, filter)
    }

    const openCloseDatePicker = () => {
        setShowDatePicker(!showDatePicker)
    }
    const [range, setRange] = useState<Range>({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection'
    })

    const handleDatePickerChange = (ranges: RangeKeyDict) => {
        setRange(ranges['selection'])
    }

    const handleOnClick = (e: any) => {
        // @ ts-ignore
        setStartDate(range.startDate)
        // @ ts-ignore
        setEndDate(range.endDate)
        if (range.startDate) {
            setStartDateInLocalString(range.startDate.toLocaleDateString())
        }
        if (range.endDate) {
            setEndDateInLocalString(range.endDate.toLocaleDateString())
        }
        openCloseDatePicker()
        const filter = {
            subscription_promotion_type: subscriptionPromotionType,
            content_promotion_type: contentPromotionType,
            domain: domain,
            startDate: range.startDate,
            endDate: range.endDate
        }
        callApi(filter)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className="card mt-4">
            <div className="card-header">
                Promotion Report List
            </div>
            <div className="card-body">
                <div className='row'>
                    <div className='col-3'>
                        <label className='mb-2'>Date Range</label>
                        <input
                            name='date_range'
                            id='date_range'
                            className='form-control'
                            data-target='#datePicker'
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
                        <label className='mb-2'>Website</label>
                        <Domain
                            onDomainChange={handleChange}
                            websiteStore={websiteStore}
                            defaultDomain={domain}
                            multiSelect={false}
                        />
                    </div>
                    <div className='col-md-3'>
                        <label className='mb-2'>Subscription</label>
                        <Select
                            name='subscription'
                            options={subscriptionPromotionTypeOption}
                            onChange={handleChange}
                            defaultValue={selectedOption}
                            className='mb-3'
                        />
                    </div>
                    {subscriptionPromotionType === 'SUBSCRIPTION' &&
                        <div className='col-md-3'>
                            <label className='mb-2'>Content</label>
                            <Select
                                name='content'
                                options={contentPromotionTypeOption1}
                                onChange={handleChange}
                                defaultValue={selectedContentOption}
                                className='mb-3'
                            />
                        </div>
                    }
                    {subscriptionPromotionType === 'LOCKED_CONTENT' &&
                        <div className='col-md-3'>
                            <label className='mb-2'>Content</label>
                            <Select
                                name='content'
                                options={contentPromotionTypeOption2}
                                onChange={handleChange}
                                defaultValue={selectedContentOption}
                                className='mb-3'
                            />
                        </div>
                    }
                </div>
                <div className='table-responsive mt-3'>
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'website_url', title: 'Website Url', component: websiteInfo },
                            { name: 'promotion_id', title: 'Info', component: promotionInfo },
                            { name: 'duration', title: 'Duration' },
                            { name: 'discount', title: 'Discount' },
                            { name: 'promo_message', title: 'Promo Message' },
                            { name: 'number_of_transaction', title: 'Number Of Transaction' },
                            { name: 'revenue', title: 'Revenue' },
                            { name: 'registration', title: 'Registration' }
                        ]}
                        data={promotionReportData}
                    ></Table>
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

export default observer(PromotionReport)
