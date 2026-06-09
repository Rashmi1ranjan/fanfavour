import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import moment from 'moment'
import _ from 'lodash'
import { ActionMeta, ValueType } from 'react-select/src/types'
import Domain from '../layout/Domain'
import styled from 'styled-components'
import ReactDatePicker from 'react-datepicker'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const Span = styled.span`
    cursor: pointer;
    float: right;
    bottom: 0.3em;
    color: #216BA5;
`

const AddWebsiteReferralHistory: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, websiteReferralHistory, WebsiteReferralStore } = rootStore
    const datePickerRef = React.useRef<ReactDatePicker>(null)

    const {
        isWebsiteOptionDataLoaded,
        getWebsiteCommissionData,
        websiteCommission
    } = websiteStore

    const {
        setWebsiteReferralHistory,
        editWebsiteReferralHistoryData,
        getWebsiteReferralById,
        getWebsiteReferralData,
        clearWebsiteData,
        redirect,
        isReferralDataFound,
        isApiError,
        isLoading
    } = websiteReferralHistory

    const {
        getAllReferralWebsiteOptions,
        allWebsiteReferralOptions,
        getAllLinkTrackingReferralOptions,
        allLinkTrackingReferralOptions
    } = WebsiteReferralStore
    const currentRoute = window.location.pathname.split('/')
    const id = currentRoute[currentRoute.length - 1]
    const history = useNavigate()

    useEffect(() => {
        getAllReferralWebsiteOptions()
        getAllLinkTrackingReferralOptions()
        clearWebsiteData()
        if (id !== 'add_website_referral') {
            getWebsiteReferralById(id)
        }
        if (redirect !== '' || isApiError) {
            history('/website_referral_history')
        }
    }, [])

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')
        const selectedLabel = _.get(value, 'label', '')
        if (name === 'fromDomain') {
            editWebsiteReferralHistoryData.domain = selectedValue
            getWebsiteReferralData({ domain: selectedValue })
            getWebsiteCommissionData({ domain: selectedValue })
        } else if (name === 'domain') {
            editWebsiteReferralHistoryData.referral_name = selectedValue
        } else if (name === 'domain1') {
            editWebsiteReferralHistoryData.referral_name1 = selectedValue
        } else if (name === 'domain2') {
            editWebsiteReferralHistoryData.referral_name2 = selectedValue
        } else if (name === 'fromReferral1') {
            editWebsiteReferralHistoryData.referral_name = selectedLabel
            editWebsiteReferralHistoryData.referral_id = selectedValue
        } else if (name === 'fromReferral2') {
            editWebsiteReferralHistoryData.referral_name1 = selectedLabel
            editWebsiteReferralHistoryData.referral_id1 = selectedValue
        } else if (name === 'fromReferral3') {
            editWebsiteReferralHistoryData.referral_name2 = selectedLabel
            editWebsiteReferralHistoryData.referral_id2 = selectedValue
        }
    }

    useEffect(() => {
        if ([editWebsiteReferralHistoryData.referral_type, editWebsiteReferralHistoryData.referral_type1, editWebsiteReferralHistoryData.referral_type2].includes('link-tracking')) {
            editWebsiteReferralHistoryData.referral_type1 = ''
            editWebsiteReferralHistoryData.referral_type2 = ''
            editWebsiteReferralHistoryData.referral_name1 = ''
            editWebsiteReferralHistoryData.referral_id1 = ''
            editWebsiteReferralHistoryData.referral_name2 = ''
            editWebsiteReferralHistoryData.referral_id2 = ''
            editWebsiteReferralHistoryData.referral_commission1 = ''
            editWebsiteReferralHistoryData.referral_commission2 = ''
        }
    }, [editWebsiteReferralHistoryData.referral_type, editWebsiteReferralHistoryData.referral_type1, editWebsiteReferralHistoryData.referral_type2])

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value
        if (name === 'referral_commission') {
            editWebsiteReferralHistoryData.referral_commission = value
        } else if (name === 'total_referral') {
            editWebsiteReferralHistoryData.total_referral = parseInt(value)
            editWebsiteReferralHistoryData.referral_type1 = editWebsiteReferralHistoryData.referral_type1 ? editWebsiteReferralHistoryData.referral_type1 : 'normal'
            editWebsiteReferralHistoryData.referral_type2 = editWebsiteReferralHistoryData.referral_type2 ? editWebsiteReferralHistoryData.referral_type2 : 'normal'
        } else if (name === 'referral_type') {
            if (value === 'link-tracking') {
                editWebsiteReferralHistoryData.total_referral = 1
                editWebsiteReferralHistoryData.domain = editWebsiteReferralHistoryData.domain ? editWebsiteReferralHistoryData.domain : 'all'
            }
            editWebsiteReferralHistoryData.referral_type = value
            editWebsiteReferralHistoryData.referral_id = ''
            editWebsiteReferralHistoryData.referral_name = ''
        } else if (name === 'referral_type1') {
            if (value === 'link-tracking') {
                editWebsiteReferralHistoryData.total_referral = 1
                editWebsiteReferralHistoryData.referral_type = value
            }
            editWebsiteReferralHistoryData.referral_type1 = value
        } else if (name === 'referral_type2') {
            if (value === 'link-tracking') {
                editWebsiteReferralHistoryData.total_referral = 1
                editWebsiteReferralHistoryData.referral_type = value
            }
            editWebsiteReferralHistoryData.referral_type2 = value
        } else if (name === 'referral_commission1') {
            editWebsiteReferralHistoryData.referral_commission1 = value
        } else if (name === 'referral_commission2') {
            editWebsiteReferralHistoryData.referral_commission2 = value
        }
    }

    const totalReferralOptions = [
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' }
    ]

    const selectReferralOptions = totalReferralOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const referralTypeOptions = [
        { label: 'Normal', value: 'normal' },
        { label: 'Domain', value: 'domain' },
        { label: 'Link Tracking', value: 'link-tracking' }
    ]

    const selectReferralTypeOptions = referralTypeOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const handleSubmit = (e: any) => {
        e.preventDefault()
        const total_referral = _.get(editWebsiteReferralHistoryData, 'total_referral', 0)
        const referral_name = _.get(editWebsiteReferralHistoryData, 'referral_name', '')
        const referral_name1 = _.get(editWebsiteReferralHistoryData, 'referral_name1', '')
        const referral_name2 = _.get(editWebsiteReferralHistoryData, 'referral_name2', '')

        if ((total_referral === 1 && _.isEmpty(referral_name)) || (total_referral === 2 && _.isEmpty(referral_name1)) || (total_referral === 3 && _.isEmpty(referral_name2))) {
            alert('Please select referral')
            return
        }

        const referral_commission = _.get(editWebsiteReferralHistoryData, 'referral_commission', 0)
        const referral_commission1 = _.get(editWebsiteReferralHistoryData, 'referral_commission1', 0)
        const referral_commission2 = _.get(editWebsiteReferralHistoryData, 'referral_commission2', 0)
        if ((total_referral === 1 && _.isEmpty(referral_commission)) || (total_referral === 2 && _.isEmpty(referral_commission1)) || (total_referral === 3 && _.isEmpty(referral_commission2))) {
            alert('Please add referral commission')
            return
        }

        const platform_commission = _.get(websiteCommission, 'platform_commission', 0)
        const totalCommission = Number(editWebsiteReferralHistoryData.referral_commission) + Number(editWebsiteReferralHistoryData.referral_commission1) + Number(editWebsiteReferralHistoryData.referral_commission2)
        if (totalCommission <= platform_commission) {
            if (editWebsiteReferralHistoryData.domain !== '' &&
                (
                    editWebsiteReferralHistoryData.referral_type === 'link-tracking' ||
                    editWebsiteReferralHistoryData.domain !== 'all'
                )) {
                setWebsiteReferralHistory((success: boolean) => {
                    if (success === true) {
                        history('/website_referral_history')
                    }
                })
            } else {
                alert('Please fill data')
                return
            }
        } else {
            alert(`You can not add more than ${platform_commission}% commission`)
            return
        }
    }

    const handleDateChange = (date: Date) => {
        const startDate = moment(date).format('YYYY-MM-DD 00:00:00')
        const targetDate = moment(editWebsiteReferralHistoryData.target_date).format('YYYY-MM-DD 00:00:00')

        if (targetDate < startDate || isReferralDataFound === false) {
            editWebsiteReferralHistoryData.target_date = startDate
        } else {
            alert('You can not select less than from old date')
        }
    }

    const setTodayDate = () => {
        const startDate = moment().format('YYYY-MM-DD 00:00:00')
        editWebsiteReferralHistoryData.target_date = startDate
        datePickerRef.current?.setOpen(false)
    }

    const referralOptions: OptionType[] = []

    const websiteReferralOptions: OptionType[] = allWebsiteReferralOptions.map(option => (
        { label: option.name, value: option._id }
    ))
    referralOptions.push(...websiteReferralOptions)

    const referralLinkOptions: OptionType[] = []

    const linkTrackingReferralOptions: OptionType[] = allLinkTrackingReferralOptions.map(option => (
        { label: option.name, value: option._id }
    ))
    referralLinkOptions.push(...linkTrackingReferralOptions)

    // normal referral option
    const selectedWebsiteReferralOption = _.find(referralOptions, (item: OptionType) => {
        return item.value === editWebsiteReferralHistoryData.referral_id
    })

    // link referral option
    const selectedWebsiteLinkReferralOption = _.find(referralLinkOptions, (item: OptionType) => {
        return item.value === editWebsiteReferralHistoryData.referral_id
    })

    const selectedWebsiteReferral1Option = _.find(referralOptions, (item: OptionType) => {
        return item.value === editWebsiteReferralHistoryData.referral_id1
    })
    const selectedWebsiteReferral2Option = _.find(referralOptions, (item: OptionType) => {
        return item.value === editWebsiteReferralHistoryData.referral_id2
    })

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row'>
            <div className='col-md-5'>
                <div className='card'>
                    <div className="card-header">
                        {id !== 'add_website_referral' ? 'Edit' : 'Add'} Website Referral
                        <NavLink className="float-end text-decoration-none" to="/website_referral_history" style={{ textAlign: 'right' }} >Cancel</NavLink>
                    </div>
                    <div className="card-body">
                        <form>
                            <div className='form-group'>
                                <label className='mb-2'>Domain</label>
                                <Domain
                                    key={editWebsiteReferralHistoryData.domain}
                                    name='fromDomain'
                                    onDomainChange={handleChange}
                                    websiteStore={websiteStore}
                                    loading={isLoading}
                                    defaultDomain={editWebsiteReferralHistoryData.domain}
                                    multiSelect={false}
                                    requestFrom={editWebsiteReferralHistoryData.referral_type === 'link-tracking' ? 'referral_history' : ''}
                                />
                            </div>
                            <div className='form-group'>
                                <label className='mb-2'>Date</label><br />
                                <DatePicker
                                    ref={datePickerRef}
                                    selected={new Date(editWebsiteReferralHistoryData.target_date)}
                                    className='form-control mb-3'
                                    onChange={handleDateChange}
                                >
                                    <div className='px-3 text-primary'>
                                        <Span
                                            className='position-relative'
                                            onClick={setTodayDate}>Today</Span>
                                    </div>
                                </DatePicker>
                            </div>
                            <div className='form-group'>
                                <label className='mb-2'>Total Referral</label>
                                <select
                                    className='form-control form-select mb-3'
                                    id='total_referral'
                                    name='total_referral'
                                    value={editWebsiteReferralHistoryData.total_referral}
                                    onChange={onChange}
                                    disabled={editWebsiteReferralHistoryData.referral_type === 'link-tracking'}
                                >
                                    {selectReferralOptions}
                                </select>
                            </div>
                            <div className='form-group'>
                                <label className='mb-2'>Referral Type 1</label>
                                <select
                                    className='form-control form-select mb-3'
                                    id='referral_type'
                                    name='referral_type'
                                    value={editWebsiteReferralHistoryData.referral_type}
                                    onChange={onChange}>
                                    {selectReferralTypeOptions}
                                </select>
                            </div>
                            {['normal', 'link-tracking'].includes(editWebsiteReferralHistoryData.referral_type) ? (
                                <div className='form-group'>
                                    <label className='mb-2'>Referral 1</label>
                                    <Select
                                        key={editWebsiteReferralHistoryData.referral_type}
                                        name='fromReferral1'
                                        options={
                                            editWebsiteReferralHistoryData.referral_type === 'normal'
                                                ? referralOptions
                                                : referralLinkOptions
                                        }
                                        onChange={handleChange}
                                        defaultValue={
                                            editWebsiteReferralHistoryData.referral_type === 'normal'
                                                ? selectedWebsiteReferralOption
                                                : selectedWebsiteLinkReferralOption
                                        }
                                        value={
                                            editWebsiteReferralHistoryData.referral_type === 'normal'
                                                ? selectedWebsiteReferralOption
                                                : selectedWebsiteLinkReferralOption
                                        }
                                        className='mb-3'
                                    />
                                </div>
                            ) : (
                                <div className='form-group'>
                                    <label className='mb-2'>Domain 1</label>
                                    <Domain
                                        onDomainChange={handleChange}
                                        websiteStore={websiteStore}
                                        loading={isLoading}
                                        defaultDomain={editWebsiteReferralHistoryData.referral_name}
                                        multiSelect={false}
                                    />
                                </div>
                            )}
                            <div className='form-group'>
                                <label className='mb-2'>Referral Commission 1</label>
                                <input
                                    name='referral_commission'
                                    type='text'
                                    className='form-control mb-3'
                                    value={editWebsiteReferralHistoryData.referral_commission}
                                    onChange={onChange} />
                            </div>
                            {editWebsiteReferralHistoryData.total_referral > 1 ?
                                <>
                                    <div className='form-group'>
                                        <label className='mb-2'>Referral Type 2</label>
                                        <select
                                            className='form-control form-select mb-3'
                                            id='referral_type1'
                                            name='referral_type1'
                                            value={editWebsiteReferralHistoryData.referral_type1}
                                            onChange={onChange}>
                                            {selectReferralTypeOptions}
                                        </select>
                                    </div>
                                    {editWebsiteReferralHistoryData.referral_type1 === 'normal' ?
                                        <div className='form-group'>
                                            <label className='mb-2'>Referral 2</label>
                                            <Select
                                                key={editWebsiteReferralHistoryData.referral_type1}
                                                name='fromReferral2'
                                                options={referralOptions}
                                                onChange={handleChange}
                                                defaultValue={selectedWebsiteReferral1Option}
                                                value={selectedWebsiteReferral1Option}
                                                className='mb-3'
                                            />
                                        </div>
                                        : <div className='form-group'>
                                            <label className='mb-2'>Domain 2</label>
                                            <Domain
                                                name='domain1'
                                                onDomainChange={handleChange}
                                                websiteStore={websiteStore}
                                                loading={isLoading}
                                                defaultDomain={editWebsiteReferralHistoryData.referral_name1}
                                                multiSelect={false}
                                            />
                                        </div>
                                    }
                                    <div className='form-group'>
                                        <label className='mb-2'>Referral Commission 2</label>
                                        <input
                                            name='referral_commission1'
                                            type='text'
                                            className='form-control mb-3'
                                            value={editWebsiteReferralHistoryData.referral_commission1}
                                            onChange={onChange} />
                                    </div></>
                                : null}
                            {editWebsiteReferralHistoryData.total_referral > 2 ?
                                <>
                                    <div className='form-group'>
                                        <label className='mb-2'>Referral Type 3</label>
                                        <select
                                            className='form-control form-select mb-3'
                                            id='referral_type2'
                                            name='referral_type2'
                                            value={editWebsiteReferralHistoryData.referral_type2}
                                            onChange={onChange}>
                                            {selectReferralTypeOptions}
                                        </select>
                                    </div>
                                    {editWebsiteReferralHistoryData.referral_type2 === 'normal' ?
                                        <div className='form-group'>
                                            <label className='mb-2'>Referral 3</label>
                                            <Select
                                                key={editWebsiteReferralHistoryData.referral_type2}
                                                name='fromReferral3'
                                                options={referralOptions}
                                                onChange={handleChange}
                                                defaultValue={selectedWebsiteReferral2Option}
                                                value={selectedWebsiteReferral2Option}
                                                className='mb-3'
                                            />
                                        </div>
                                        : <div className='form-group'>
                                            <label className='mb-2'>Domain 3</label>
                                            <Domain
                                                name='domain2'
                                                onDomainChange={handleChange}
                                                websiteStore={websiteStore}
                                                loading={isLoading}
                                                defaultDomain={editWebsiteReferralHistoryData.referral_name2}
                                                multiSelect={false}
                                            />
                                        </div>
                                    }
                                    <div className='form-group'>
                                        <label className='mb-2'>Referral Commission 3</label>
                                        <input
                                            name='referral_commission2'
                                            type='text'
                                            className='form-control mb-3'
                                            value={editWebsiteReferralHistoryData.referral_commission2}
                                            onChange={onChange} />
                                    </div></>
                                : null}
                            <button type='button' className="btn btn-primary mt-2" disabled={isLoading} onClick={handleSubmit} >
                                {id !== 'add_website_referral' ? 'Update' : 'Add'} Website Referral
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </Container>
}

export default observer(AddWebsiteReferralHistory)
