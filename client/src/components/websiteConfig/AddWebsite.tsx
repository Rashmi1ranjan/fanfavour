import React, { SyntheticEvent, useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useNavigate } from 'react-router-dom'
import _ from 'lodash'
import Loader from '../loader/Loader'

interface Props {
    rootStore: RootStore
}

const AddWebsite: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, databaseStore, serverStore } = rootStore

    const { setWebsite,
        getWebsiteDataById,
        clearWebsiteData,
        editWebsiteData,
        isWebsiteOptionDataLoaded,
        isLoading,
        clearWebsiteFilter,
        isDataLoading
    } = websiteStore

    const { databaseData, getDatabasesData } = databaseStore
    const { serverData, getServersData } = serverStore

    const currentRoute = window.location.pathname.split('/')
    const id = currentRoute[currentRoute.length - 1]
    const history = useNavigate()
    const [isApiCall, setIsApiCall] = useState(false)

    useEffect(() => {
        getServersData()
        getDatabasesData()
        clearWebsiteData()
        if (window.location.pathname.includes('edit_website')) {
            getWebsiteDataById(id)
        }
    }, [getServersData, getDatabasesData, clearWebsiteData, getWebsiteDataById, id])

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value

        if (name === 'rating' && parseInt(value) >= 0 && parseInt(value) <= 5) {
            _.set(editWebsiteData, name, value)
            return false
        }
        if (name === 'is_cloudfront' || name === 'is_crypto_payment_enabled') {
            _.set(editWebsiteData, name, e.target.value === 'true' ? true : false)
            return false
        }
        _.set(editWebsiteData, name, value)
    }

    const filterOptions = [
        { label: 'pending', value: 'pending' },
        { label: 'published', value: 'published' },
        { label: 'live', value: 'live' },
        { label: 'removed', value: 'removed' }
    ]

    const selectOptions = filterOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const cloudOptions = [
        { label: 'false', value: 'false' },
        { label: 'true', value: 'true' }
    ]

    const selectCloudOptions = cloudOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const selectServerOptions = serverData.map(option => (
        <option key={option._id} value={option._id}>
            {option.name} (${option.monthly_earning ? Number(option.monthly_earning).toFixed(2) : '0.00'})
        </option>
    ))

    if (editWebsiteData.server_id === '' && serverData.length > 0) {
        editWebsiteData.server_id = serverData[0]._id
    }

    const selectDatabaseOptions = databaseData.map(option => (
        <option key={option._id} value={option._id}>
            {option.name} (${option.monthly_earning ? Number(option.monthly_earning).toFixed(2) : '0.00'})
        </option>
    ))

    if (editWebsiteData.database_id === '' && databaseData.length > 0) {
        editWebsiteData.database_id = databaseData[0]._id
    }

    const cryptoOption = [
        { label: 'No', value: 'false' },
        { label: 'Yes', value: 'true' }
    ]

    const selectCryptoOption = cryptoOption.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const onSubmit = (e: SyntheticEvent) => {
        e.preventDefault()
        const { payment_gateway } = editWebsiteData

        const subscriptionSubAccount = _.get(editWebsiteData, 'subscription_sub_account', '').trim()
        const shopSubAccount = _.get(editWebsiteData, 'shop_sub_account', '').trim()
        const tipSubAccount = _.get(editWebsiteData, 'tip_sub_account', '').trim()
        const sticky_io_campaign_id = _.get(editWebsiteData, 'sticky_io_campaign_id', '').trim()
        const websiteUrl = _.get(editWebsiteData, 'website_url', '').trim()
        const modelEmail = _.get(editWebsiteData, 'model_email', '').trim()
        const model_name = _.get(editWebsiteData, 'model_name', '').trim()
        const rating = _.get(editWebsiteData, 'rating', 0)
        const numberPattern = /^\d+$/

        const websiteRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        const checkWebsite = websiteUrl.match(websiteRegex)


        if (websiteUrl === '') {
            alert('Please add domain')
            return
        }

        if (checkWebsite === null) {
            alert('Please enter valid domain name')
            return
        }

        const emailRegex = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/
        const checkEmail = modelEmail.match(emailRegex)

        if (modelEmail === '' || checkEmail === null) {
            alert('Please enter valid model email')
            return
        }

        if (model_name === '') {
            alert('Please enter valid model name')
            return
        }

        if (_.inRange(rating, 0, 6) === false) {
            alert('Please add rating between 0 to 5.')
            return
        }

        const subAccounts = [subscriptionSubAccount, shopSubAccount, tipSubAccount]
        if (payment_gateway === 'sticky.io' && sticky_io_campaign_id === '') {
            alert('Please enter Sticky.io Camping ID')
            return
        } else if (payment_gateway === 'ccbill' || payment_gateway === 'hybrid') {

            if (subscriptionSubAccount === '') {
                alert('Please Enter CCBill Subscription Sub Account Number')
                return
            }

            if (shopSubAccount === '') {
                alert('Please Enter CCBill Shop Sub Account Number')
                return
            }

            if (tipSubAccount === '') {
                alert('Please Enter CCBill Tip Sub Account Number')
                return
            }

            if (payment_gateway === 'hybrid' && sticky_io_campaign_id === '') {
                alert('Please Enter valid Sticky.io Camping ID')
                return
            }
        }

        if (subscriptionSubAccount !== '') {
            if (subscriptionSubAccount.match(numberPattern) === null || subscriptionSubAccount.length !== 4) {
                alert('Enter Valid CCBill Subscription Sub Account Number')
                return
            }
        }

        if (shopSubAccount !== '') {
            if (shopSubAccount.match(numberPattern) === null || shopSubAccount.length !== 4) {
                alert('Enter Valid CCBill Shop Sub Account Number')
                return
            }
        }

        if (tipSubAccount !== '') {
            if (tipSubAccount.match(numberPattern) === null || tipSubAccount.length !== 4) {
                alert('Enter Valid CCBill Tip Sub Account Number')
                return
            }
        }

        if (tipSubAccount !== '' && shopSubAccount !== '' || tipSubAccount !== '') {
            if (new Set(subAccounts).size !== subAccounts.length) {
                alert('You cannot add duplicate CCBill Sub Account Number')
                return
            }
        }

        if (sticky_io_campaign_id !== '' && sticky_io_campaign_id.match(numberPattern) === null) {
            alert('Enter Valid Sticky.io Camping ID')
            return
        }

        setIsApiCall(true)
        setWebsite((success: boolean) => {
            setIsApiCall(false)
            if (success === true) {
                if (id === 'add_website') {
                    clearWebsiteFilter()
                }
                history('/websites')
            }
        })
    }

    if (isLoading && isWebsiteOptionDataLoaded && isApiCall === false) {
        return <>Loading</>
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className='card-title'>{id !== 'add_website' ? 'Edit' : 'Add'} Website</h4>
        {isDataLoading ?
            <div className='text-center'>
                <Loader isLoading={true} />
            </div>
            :
            <div className='col-12'>
                <form onSubmit={(e) => onSubmit(e)}>
                    <div className='card mb-3'>
                        <div className='card-body row'>
                            <div className='form-group col-6 mb-3'>
                                <label className='mb-2'>Domain</label>
                                <input
                                    name='website_url'
                                    type='text'
                                    className='form-control'
                                    value={editWebsiteData.website_url}
                                    onChange={onChange}
                                    required={true}
                                />
                                <small className="form-text text-muted">Do not enter https or trailing slash. put it like <b>example.com</b></small>
                            </div>
                            <div className='form-group col-6'>
                                <label className='mb-2'>Cloudfront</label>
                                <select
                                    className='form-control form-select mb-3'
                                    id='is_cloudfront'
                                    name='is_cloudfront'
                                    value={(editWebsiteData.is_cloudfront) ? 'true' : 'false'}
                                    onChange={onChange}>
                                    {selectCloudOptions}
                                </select>
                            </div>
                            <div className='form-group col-6'>
                                <label className='mb-2'>Server</label>
                                <select
                                    className='form-control form-select mb-3'
                                    id='server_id'
                                    name='server_id'
                                    value={editWebsiteData.server_id}
                                    onChange={onChange}>
                                    {selectServerOptions}
                                </select>
                            </div>
                            <div className='form-group col-6'>
                                <label className='mb-2'>Database</label>
                                <select
                                    className='form-control form-select mb-3'
                                    id='database_id'
                                    name='database_id'
                                    value={editWebsiteData.database_id}
                                    onChange={onChange}>
                                    {selectDatabaseOptions}
                                </select>
                            </div>
                            <div className='form-group col-6 mb-3'>
                                <label className='mb-2'>Google Analytics</label>
                                <input
                                    name='google_analytics'
                                    type='text'
                                    className='form-control'
                                    value={editWebsiteData.google_analytics}
                                    onChange={onChange}
                                />
                                <small className="form-text text-muted">Google analytics tracking id.</small>
                            </div>
                            <div className='form-group col-6 mb-3'>
                                <label className='mb-2'>Google ReCaptcha Website Id</label>
                                <input
                                    name='recaptcha_website_id'
                                    type='text'
                                    className='form-control'
                                    value={editWebsiteData.recaptcha_website_id}
                                    onChange={onChange}
                                />
                                <small className="form-text text-muted">Google ReCaptcha Website Id.</small>
                            </div>
                            <div className='form-group col-6'>
                                <label className='mb-2'>Status</label>
                                <select
                                    className='form-control form-select mb-3'
                                    id='status'
                                    name='status'
                                    value={editWebsiteData.status}
                                    onChange={onChange}>
                                    {selectOptions}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className='card mb-3'>
                        <div className='card-body row'>
                            <div className='form-group col-6'>
                                <label className='mb-2'>Model Name</label>
                                <input
                                    name='model_name'
                                    type='text'
                                    className='form-control mb-3'
                                    value={editWebsiteData.model_name}
                                    onChange={onChange}
                                    required={true}
                                />
                            </div>
                            <div className='form-group col-6'>
                                <label className='mb-2'>Model Email</label>
                                <input
                                    name='model_email'
                                    type='email'
                                    className='form-control mb-3'
                                    value={editWebsiteData.model_email}
                                    onChange={onChange}
                                    required={true}
                                />
                            </div>
                            <div className='form-group col-6'>
                                <label className='mb-2'>Vendor Name</label>
                                <input
                                    name='vendor_name'
                                    type='text'
                                    className='form-control mb-3'
                                    value={editWebsiteData.vendor_name}
                                    onChange={onChange}
                                />
                            </div>
                        </div>
                    </div>
                    <div className='card mb-3'>
                        <div className='card-body'>
                            <div className='form-group col-6'>
                                <label className='mb-2'>Active Payment Gateway</label>
                                <div className="mb-3">
                                    <div className="form-check form-check-inline">
                                        <input className="form-check-input" type="radio" name='payment_gateway' id="ccbill" value="ccbill" checked={editWebsiteData.payment_gateway === 'ccbill' ? true : false} onChange={onChange} />
                                        <label className="form-check-label" htmlFor="ccbill">CCBill</label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input className="form-check-input" type="radio" name='payment_gateway' id="sticky_io" value="sticky.io" checked={editWebsiteData.payment_gateway === 'sticky.io' ? true : false} onChange={onChange} />
                                        <label className="form-check-label" htmlFor="sticky_io">Sticky.io</label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input className="form-check-input" type="radio" name='payment_gateway' id="hybrid" value="hybrid" checked={editWebsiteData.payment_gateway === 'hybrid' ? true : false} onChange={onChange} />
                                        <label className="form-check-label" htmlFor="hybrid">Hybrid</label>
                                    </div>
                                </div>
                            </div>
                            <div className='row'>
                                <div className='form-group col-6'>
                                    <label className='mb-2'>CCBill Subscription Sub Account</label>
                                    <input
                                        name='subscription_sub_account'
                                        type='text'
                                        className='form-control mb-3'
                                        value={editWebsiteData.subscription_sub_account}
                                        onChange={onChange}
                                        required={editWebsiteData.payment_gateway === 'sticky.io' ? false : true}
                                    />
                                </div>
                                <div className='form-group col-6'>
                                    <label className='mb-2'>CCBill Shop Sub Account </label>
                                    <input
                                        name='shop_sub_account'
                                        type='text'
                                        className='form-control mb-3'
                                        value={editWebsiteData.shop_sub_account}
                                        onChange={onChange}
                                        required={editWebsiteData.payment_gateway === 'sticky.io' ? false : true}
                                    />
                                </div>
                                <div className='form-group col-6'>
                                    <label className='mb-2'>CCBill Tip Sub Account </label>
                                    <input
                                        name='tip_sub_account'
                                        type='text'
                                        className='form-control mb-3'
                                        value={editWebsiteData.tip_sub_account}
                                        onChange={onChange}
                                        required={editWebsiteData.payment_gateway === 'sticky.io' ? false : true}
                                    />
                                </div>
                                <div className='form-group col-6'>
                                    <label className='mb-2'>Sticky.io Campaign ID</label>
                                    <input
                                        name='sticky_io_campaign_id'
                                        type='text'
                                        className='form-control'
                                        value={editWebsiteData.sticky_io_campaign_id}
                                        onChange={onChange}
                                        required={editWebsiteData.payment_gateway === 'ccbill' ? false : true}
                                    />
                                    <small className="form-text text-muted mb-3">Sticky.io Campaign ID.</small>
                                </div>
                                <div className='form-group col-6'>
                                    <label className='mb-2'>Crypto Payment Enabled</label>
                                    <select
                                        className='form-control form-select mb-3'
                                        id='is_crypto_payment_enabled'
                                        name='is_crypto_payment_enabled'
                                        value={(editWebsiteData.is_crypto_payment_enabled) ? 'true' : 'false'}
                                        onChange={onChange}>
                                        {selectCryptoOption}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='card mb-3'>
                        <div className='card-body row'>
                            <div className='form-group col-6 mb-3'>
                                <label className='mb-2'>Website Setup date</label>
                                <input
                                    name='setup_date'
                                    type='date'
                                    className='form-control'
                                    value={editWebsiteData.setup_date}
                                    onChange={onChange}
                                />
                            </div>
                            <div className='form-group col-6 mb-3'>
                                <label className='mb-2'>Website Launch date</label>
                                <input
                                    name='lunch_date'
                                    type='date'
                                    className='form-control'
                                    value={editWebsiteData.lunch_date}
                                    onChange={onChange}
                                />
                            </div>
                            <div className='form-group col-6 mb-3'>
                                <label className='mb-2'>Website Bring Down date</label>
                                <input
                                    name='bring_down_date'
                                    type='date'
                                    className='form-control'
                                    value={editWebsiteData.bring_down_date}
                                    onChange={onChange}
                                />
                            </div>
                            <div className='form-group col-6 mb-3'>
                                <label className='mb-2'>Rating</label>
                                <input
                                    type='number'
                                    className='form-control'
                                    id='rating'
                                    name='rating'
                                    value={editWebsiteData.rating}
                                    onChange={onChange}
                                    required
                                    min={0}
                                    max={5}
                                />
                                <small className="form-text text-muted">Please add rating between 0 to 5.</small>
                            </div>
                        </div>
                    </div>
                    <div className='col-6 my-3'>
                        <button type='submit' className='btn btn-primary' disabled={isLoading} style={{ marginRight: '20px' }} >
                            {isLoading === true && (
                                <span
                                    className='spinner-border spinner-border-sm me-1'
                                    role='status'
                                    aria-hidden='true'
                                ></span>
                            )}
                            {id !== 'add_website' ? 'Update' : 'Add'} Website
                        </button>
                        <button type='button' className="btn btn-danger" disabled={isLoading} onClick={() => {
                            history('/websites')
                        }}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        }
    </Container>
}

export default observer(AddWebsite)
