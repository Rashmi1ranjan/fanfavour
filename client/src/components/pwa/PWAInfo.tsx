import React, { useEffect, useState, useRef } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { Cell } from './../table/Definations'
import moment from 'moment'
import _ from 'lodash'
import { ActionMeta, ValueType } from 'react-select/src/types'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

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
    const { websiteStore, PWAInfoStore } = rootStore
    const {
        currentPage,
        isLoading,
        totalPage,
        limit,
        totalRows,
        pwaInfoData,
        filter,
        getPWAInfoData,
        averageCountsFor30Days,
        averageCountsFor90Days,
        averageInstalls,
        avgPopupDisplayed
    } = PWAInfoStore
    const [domain, setDomain] = useState('')

    useEffect(() => {
        getPWAInfoData(1)
    }, [getPWAInfoData])

    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value.trim()
        _.set(filter, name, value)
    }

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const selectedValue = _.get(value, 'value', '')
        setDomain(selectedValue)
        filter.domain = selectedValue
    }

    const deviceType: OptionType[] = [
        { label: 'All', value: 'all' },
        { label: 'iOS', value: 'ios' },
        { label: 'Android', value: 'android' }
    ]

    const deviceTypeOption = deviceType.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const isRunningFromPWA: OptionType[] = [
        { label: 'All', value: 'all' },
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' }
    ]

    const isRunningFromPWAOption = isRunningFromPWA.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const subscribersOnlyOptions: OptionType[] = [
        { label: 'All', value: 'all' },
        { label: 'Subscribers Only', value: 'subscribers_only' }
    ]

    const subscribersOnly = subscribersOnlyOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const changePage = (pageNum: number) => {
        getPWAInfoData(pageNum)
    }

    const TableCellPWAStatus: React.FC<Cell> = (data) => {
        const status = data.value === 'true' ? 'Yes' : 'No'
        return (<>{status}</>)
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const value = _.get(data, 'value', '')
        if (_.isEmpty(value)) {
            return <></>
        }
        const timeAgo = moment(data.value).fromNow()
        const dateFormat = moment(data.value).format('MM/DD/YYYY hh:mm a')
        const timeToShow = `${dateFormat} (${timeAgo})`
        return (timeToShow)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className="card-title">PWA Info</h4>
        <div className='card'>
            <div className="card-body">
                <div className='row'>
                    <div className='col-md-3'>
                        <label className='mb-2'>Website</label>
                        <Domain
                            onDomainChange={handleChange}
                            websiteStore={websiteStore}
                            defaultDomain={domain}
                            loading={isLoading}
                            multiSelect={false}
                        />
                    </div>
                    <div className='col-md-3'>
                        <label className='mb-2'>PWA Device Type</label>
                        <select
                            className='form-control form-select'
                            id='device_type'
                            name='device_type'
                            onChange={onChange}
                        >
                            {deviceTypeOption}
                        </select>
                    </div>
                    <div className='col-md-3'>
                        <label className='mb-2'>Is PWA installed?</label>
                        <select
                            className='form-control form-select'
                            id='is_running_from_pwa'
                            name='is_running_from_pwa'
                            onChange={onChange}
                        >
                            {isRunningFromPWAOption}
                        </select>
                    </div>
                    <div className='col-md-3'>
                        <label className='mb-2'>Subscribe Only</label>
                        <select
                            className='form-control form-select'
                            id='subscribers_only'
                            name='subscribers_only'
                            onChange={onChange}
                        >
                            {subscribersOnly}
                        </select>
                    </div>
                    <div className='col-md-3 mt-3'>
                        <button type="button"
                            className="btn btn-primary mt-3 me-2"
                            onClick={() => getPWAInfoData(1)}
                            disabled={isLoading}>
                            {isLoading === true &&
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                            Apply Filter</button>
                    </div>
                </div>
            </div>
        </div>
        <div className='row justify-content-center mt-4'>
            <div className='col-12 col-lg-3'>
                <div className='card'>
                    <div className='card-body'>
                        <h4 className='card-title text-center'>Total Usage in last 30 days</h4>
                        <h1 className='text-center'>{averageCountsFor30Days.toLocaleString()}</h1>
                    </div>
                </div>
            </div>
            <div className='col-12 col-lg-3'>
                <div className='card'>
                    <div className='card-body'>
                        <h4 className='card-title text-center'>Total Usage in last 90 days</h4>
                        <h1 className='text-center'>{averageCountsFor90Days.toLocaleString()}</h1>
                    </div>
                </div>
            </div>
            <div className='col-12 col-lg-3'>
                <div className='card'>
                    <div className='card-body'>
                        <h4 className='card-title text-center'>% Installed from Popup</h4>
                        <h1 className='text-center'>{averageInstalls.toLocaleString()} %</h1>
                    </div>
                </div>
            </div>
            <div className='col-12 col-lg-3'>
                <div className='card'>
                    <div className='card-body'>
                        <h4 className='card-title text-center'>Avg # of times popup shown</h4>
                        <h1 className='text-center'>{avgPopupDisplayed.toLocaleString()}</h1>
                    </div>
                </div>
            </div>
        </div>
        <div className="my-4">
            <div className='table-responsive mt-3'>
                <Table
                    unique_key='_id'
                    columns={[
                        { name: 'domain', title: 'Domain' },
                        { name: 'user_id', title: 'User ID' },
                        { name: 'non_pwa_user_agent', title: 'Non-PWA Device Type' },
                        { name: 'non_pwa_last_seen', title: 'Non-PWA Last Seen', component: TableCellTimeAgo },
                        { name: 'pwa_user_agent', title: 'PWA Device Type' },
                        { name: 'pwa_last_seen', title: 'PWA Last Seen', component: TableCellTimeAgo },
                        { name: 'popup_display_count', title: 'Popup Display Count' },
                        { name: 'is_running_from_pwa', title: 'Is PWA installed?', component: TableCellPWAStatus }
                    ]}
                    data={pwaInfoData}
                    isLoading={isLoading}
                ></Table>
            </div>
            {(isLoading == false && totalRows > 0) &&
                <Pagination
                    totalPages={totalPage}
                    currentPage={currentPage}
                    totalItems={totalRows}
                    itemsPerPage={limit}
                    onItemClick={changePage}
                ></Pagination>
            }
        </div>
    </Container>
}

export default observer(PromotionReport)
