import React, { useEffect, useState, useRef } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import styled from 'styled-components'
import { observer } from 'mobx-react'
import Select, { ActionMeta } from 'react-select'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import Table from '../table/Table'
import moment from 'moment'
import _ from 'lodash'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

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

const SendGridWebhookLog: React.FC<Props> = ({ rootStore }) => {
    const { sendGridWebhookStore, websiteStore } = rootStore
    const { getSendGridWebhooks, sendGridWebhookData, isLoading } = sendGridWebhookStore
    const [domain, setDomain] = useState('')
    const [startDateInLocalString, setStartDateInLocalString] = useState('')
    const [endDateInLocalString, setEndDateInLocalString] = useState('')
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDate, setStartDate] = useStateWithCallback('')
    const [endDate, setEndDate] = useStateWithCallback('')
    const [selectedEmailOption, setSelectedEmailOption] = useStateWithCallback('all')

    useEffect(() => {
        getSendGridWebhooks({ newDomain: 'all' })
    }, [])

    const emailDomainOption: OptionType[] = [
        { label: 'All', value: 'all' },
        { label: 'themccandlessgroup.com (For Subscriber)', value: 'themccandlessgroup' },
        { label: 'mccandlessgroupalerts.com (For Non Subscriber)', value: 'mccandlessgroupalerts' }
    ]

    const selectedOption = _.find(emailDomainOption, (item: OptionType) => {
        return item.value === selectedEmailOption
    })

    const handleChange = (selectedOption: OptionType | null, e: ActionMeta<OptionType>) => {
        const name = e.name
        const filter = {
            domain: domain,
            startDate: '',
            endDate: '',
            newDomain: selectedEmailOption
        }

        if (startDate !== '') {
            filter.startDate = moment(startDate).format('MM/DD/YYYY')
            filter.endDate = moment(endDate).format('MM/DD/YYYY')
        }

        if (selectedOption) {
            if (name === 'domain') {
                setDomain(selectedOption.value)
                filter.domain = selectedOption.value
            }
            if (name === 'newDomain') {
                setSelectedEmailOption(selectedOption.value)
                filter.newDomain = selectedOption.value
            }
        }
        callApi(filter)
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
            domain: domain,
            startDate: moment(range.startDate).format('MM/DD/YYYY'),
            endDate: moment(range.endDate).format('MM/DD/YYYY'),
            newDomain: selectedEmailOption
        }
        callApi(filter)
    }
    const callApi = (filter: object) => {
        getSendGridWebhooks(filter)
    }
    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className="card mt-4">
            <div className="card-header">
                Send Grid Email Event Webhooks
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
                            loading={isLoading}
                            defaultDomain={domain}
                            multiSelect={false}
                        />
                    </div>
                    <div className='col-md-3'>
                        <label className='mb-2'>Email Domain</label>
                        <Select
                            name='newDomain'
                            options={emailDomainOption}
                            onChange={handleChange}
                            defaultValue={selectedOption}
                        />
                    </div>
                </div>
                <div className='mt-3'>
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'type', title: 'Event' },
                            { name: 'forgotPassword', title: 'Forgot Password' },
                            { name: 'changeEmail', title: 'Change Email' },
                            { name: 'optInEmail', title: 'Opt In Email' },
                            { name: 'notification', title: 'Notification' },
                            { name: 'all', title: 'Total' }
                        ]}
                        data={sendGridWebhookData}
                        isLoading={isLoading}
                    ></Table>
                </div>
            </div>
        </div>
    </Container>
}

export default observer(SendGridWebhookLog)
