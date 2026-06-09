import React, { SyntheticEvent, useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { NavLink } from 'react-router-dom'
import Select from 'react-select'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWindowClose } from '@fortawesome/free-solid-svg-icons'
import { v4 as uuid } from 'uuid'
import _ from 'lodash'
import { ActionMeta, ValueType } from 'react-select/src/types'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

interface website {
    _id: string
    website_url: string
    tip_sub_account: string
    subscription_sub_account: string
    shop_sub_account: string
    status: string
    is_cloudfront: boolean
    google_analytics: string
    server_id: string
    database_id: string
    created_at: Date
    model_name: string
    model_email: string
    vendor_name: string
    payment_gateway: string
    sticky_io_campaign_id: string
    tag: any
    website_id: number
    recaptcha_website_id: string
    rating: number
}

type IsMulti = boolean

const WebsiteConfig: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, serverStore, databaseStore, HelpTagsStore } = rootStore
    const {
        getWebsiteData,
        websiteData,
        currentPage,
        totalPage,
        limit,
        totalRows,
        setWebsiteTags,
        isLoading,
        websiteFilters,
        isTagLoading
    } = websiteStore
    const { getAllServerOptions, allServerOptions } = serverStore
    const { getAllDatabaseOptions, allDatabaseOptions } = databaseStore
    const [showModel, setShowModel] = useState(false)
    const [websiteId, setWebsiteId] = useState('')
    const [selectedHelpTags, setSelectedHelpTags] = useState<OptionType[]>([])
    const [selectedFilterHelpTags, setSelectedFilterHelpTags] = useState<
        OptionType[]
    >([])

    const helpTags: OptionType[] = []

    const { getSpecificWebsiteHelpTagsData, specificWebsiteHelpTagsData } =
        HelpTagsStore

    useEffect(() => {
        getAllServerOptions()
        getAllDatabaseOptions()
        getSpecificWebsiteHelpTagsData()
    }, [
        getAllServerOptions,
        getAllDatabaseOptions,
        getSpecificWebsiteHelpTagsData
    ])

    useEffect(() => {
        getWebsiteData(1, websiteFilters)
    }, [getWebsiteData])

    const changePage = (pageNUM: number) => {
        getWebsiteData(pageNUM, websiteFilters)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const Url = '/edit_website/' + jsonData._id
        const tags = _.get(jsonData, 'tag', [])
        return (
            <>
                <NavLink className='btn btn-outline-primary mb-2' to={Url}>
                    Edit
                </NavLink>
                <div
                    className='btn btn-outline-primary'
                    onClick={(e) => setTagWebsiteTag(jsonData._id, tags)}
                >
                    Set Tags
                </div>
            </>
        )
    }

    const setTagWebsiteTag = (id: string, tags: string[]) => {
        document.body.style.overflow = 'hidden'
        setShowModel(true)
        setWebsiteId(id)
        const array: OptionType[] = []
        if (specificWebsiteHelpTagsData.length > 0 && tags.length > 0) {
            for (const element of tags) {
                const findData = specificWebsiteHelpTagsData.filter(
                    (elem) => elem._id === element
                )
                if (findData.length > 0) {
                    // @ ts-ignore
                    array.push({ label: findData[0].title, value: findData[0]._id })
                }
            }
        }
        setSelectedHelpTags(array)
    }

    const helpTagsOptions: OptionType[] = specificWebsiteHelpTagsData.map(
        (option: { title: string, _id: string }) => ({ label: option.title, value: option._id })
    )
    helpTags.push(...helpTagsOptions)

    const tableCellRecaptchaAnalytics = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const recaptcha_website_id = jsonData.recaptcha_website_id
        if (_.isEmpty(recaptcha_website_id) === false) {
            const reCaptchaUrl = `https://www.google.com/recaptcha/admin/site/${recaptcha_website_id}`
            return (
                <a className='btn btn-outline-primary' href={reCaptchaUrl} target='_blank' rel='noopener noreferrer' >
                    View
                </a>
            )
        }
        return <></>
    }

    const tableCellText = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const domain = jsonData.website_url
        const status = jsonData.status
        let cssClass

        if (status === 'pending') {
            cssClass = 'badge text-bg-secondary'
        } else if (status === 'published') {
            cssClass = 'badge text-bg-primary'
        } else if (status === 'live') {
            cssClass = 'badge text-bg-success'
        } else if (status === 'removed') {
            cssClass = 'badge text-bg-danger'
        }

        let CloudfrontCssClass
        let CloudfrontCssText
        const Cloudfront = jsonData.is_cloudfront
        if (Cloudfront === true) {
            CloudfrontCssText = 'Cloudfront Enable'
            CloudfrontCssClass = 'badge text-bg-success'
        } else {
            CloudfrontCssText = 'Cloudfront Disable'
            CloudfrontCssClass = 'badge text-bg-danger'
        }

        const tags = _.get(jsonData, 'tag', [])
        const array = []
        if (specificWebsiteHelpTagsData.length > 0 && tags.length > 0) {
            for (const element of tags) {
                const findData = specificWebsiteHelpTagsData.filter(
                    (elem) => elem._id === element
                )
                if (findData.length > 0) {
                    array.push(findData[0].title)
                }
            }
        }

        let cryptoEnabledText = ''
        let cryptoEnabledCssClass = ''
        const isCryptoEnabled = jsonData.is_crypto_payment_enabled
        if (isCryptoEnabled === true) {
            cryptoEnabledText = 'Crypto Payment Enable'
            cryptoEnabledCssClass = 'badge text-bg-warning'
        }
        const url = `https://${domain}`

        return (
            <>
                <div><a href={url} target='_blank' rel='noopener noreferrer' >{domain}</a></div>
                <div><span className={cssClass}>{status}</span></div>
                <div><span className={CloudfrontCssClass}>{CloudfrontCssText}</span></div>
                {cryptoEnabledText !== '' &&
                    <div><span className={cryptoEnabledCssClass}>{cryptoEnabledText}</span></div>}
                {array.length > 0 &&
                    <div>Tag: {array.map((tag) => {
                        return <span key={uuid()} className='badge text-bg-secondary me-1'>{tag}</span>
                    })}</div>
                }
            </>
        )
    }

    const onPaymentGatewayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value

        if (name === 'payment_gateway') {
            websiteFilters.payment_gateway = value
        } else if (name === 'is_crypto_enabled') {
            websiteFilters.is_crypto_enabled = e.target.value
        }
    }

    const serversOptions: OptionType[] = [{ label: 'All', value: '' }]
    const serverOptions: OptionType[] = allServerOptions.map((option) => ({
        label: `${option.name} ($${option.monthly_earning ? Number(option.monthly_earning).toFixed(2) : '0.00'})`,
        value: option._id
    }))
    serversOptions.push(...serverOptions)

    const selectedServerOption = _.find(serversOptions, (item: OptionType) => {
        return item.value === websiteFilters.server
    })

    const databasesOptions: OptionType[] = [{ label: 'All', value: '' }]
    const databaseOptions: OptionType[] = allDatabaseOptions.map((option) => ({
        label: `${option.name} ($${option.monthly_earning ? Number(option.monthly_earning).toFixed(2) : '0.00'})`,
        value: option._id
    }))
    databasesOptions.push(...databaseOptions)

    const selectedDatabaseOption = _.find(databasesOptions, (item: OptionType) => {
        return item.value === websiteFilters.database
    })

    const statusOptions = ['pending', 'published', 'live', 'removed']

    const statusOption: OptionType[] = []

    const statussOptions: OptionType[] = statusOptions.map((option) => ({
        label: option,
        value: option
    }))
    statusOption.push(...statussOptions)

    const tableCellPaymentGatewayConfig = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const payment_gateway = jsonData.payment_gateway
        if (payment_gateway === 'ccbill') {
            return (
                <>
                    <div>
                        <strong>Subscription: </strong>
                        {jsonData.subscription_sub_account}
                    </div>
                    <div>
                        <strong>Shop: </strong>
                        {jsonData.shop_sub_account}
                    </div>
                    <div>
                        <strong>Tip: </strong>
                        {jsonData.tip_sub_account}
                    </div>
                </>
            )
        } else if (payment_gateway === 'sticky.io') {
            return (
                <>
                    <div>
                        <strong>Campaign Id: </strong>
                        {jsonData.sticky_io_campaign_id}
                    </div>
                </>
            )
        } else {
            return (
                <>
                    <div>
                        <strong>Subscription: </strong>
                        {jsonData.subscription_sub_account}
                    </div>
                    <div>
                        <strong>Shop: </strong>
                        {jsonData.shop_sub_account}
                    </div>
                    <div>
                        <strong>Tip: </strong>
                        {jsonData.tip_sub_account}
                    </div>
                    <div>
                        <strong>Campaign Id: </strong>
                        {jsonData.sticky_io_campaign_id}
                    </div>
                </>
            )
        }
    }

    const onHelpTagsChange = (value: ValueType<OptionType, true>, actions: any) => {
        setSelectedHelpTags(value as OptionType[])
    }

    const addWebsiteTags = (e: SyntheticEvent) => {
        e.preventDefault()
        const data = {
            _id: websiteId,
            tag: _.map(selectedHelpTags, 'value')
        }
        const filter = {
            domain: websiteFilters.domain,
            server: websiteFilters.server,
            database: websiteFilters.database,
            status: websiteFilters.status,
            payment_gateway: websiteFilters.payment_gateway,
            is_crypto_enabled: websiteFilters.is_crypto_enabled,
            tag: websiteFilters.tag,
            subAccountNo: websiteFilters.subAccountNo,
            campaignId: websiteFilters.campaignId
        }

        setWebsiteTags(data, currentPage, filter, (success: boolean) => {
            document.body.style.overflow = ''
            setShowModel(false)
            setWebsiteId('')
            setSelectedHelpTags([])
        })
    }

    const filterHelpTags: OptionType[] = []
    const filterHelpTagsOptions: OptionType[] = specificWebsiteHelpTagsData.map(
        (option) => ({ label: option.title, value: option._id })
    )
    filterHelpTags.push(...filterHelpTagsOptions)

    const onHelpTagsFilterChange = (value: ValueType<OptionType, true>, actions: any) => {
        setSelectedFilterHelpTags(value as OptionType[])
        const helpTag = []
        for (const tag of value) {
            helpTag.push(tag.value)
        }
        websiteFilters.tag = helpTag
    }

    const handleApplyFilter = () => {
        getWebsiteData(1, websiteFilters)
    }

    const hideSetTagPopup = () => {
        document.body.style.overflow = ''
        setShowModel(false)
    }

    const tableCellEarning = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const earning = jsonData.monthly_earning ? Number(jsonData.monthly_earning).toFixed(2) : '0.00'
        return (<>${earning}</>)
    }

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <div className="row py-2">
                <div className='col-md-6'>
                    <h4>Websites</h4>
                </div>
                <div className='col-md-6'>
                    <NavLink className="float-end text-decoration-underline me-3" to="/add_website" style={{ fontSize: 'larger' }}>Add Website</NavLink>
                </div>
            </div>
            <div className='card'>
                <div className="card-body">
                    <form>
                        <div className='row'>
                            <div className='col-md-3'>
                                <label className='mb-2'>Status</label>
                                <Select
                                    name='domain_status'
                                    options={statusOption}
                                    onChange={(options: ValueType<OptionType, true>) => {
                                        const statusList = options.map(option => option.value)
                                        websiteFilters.status = statusList
                                    }}
                                    className='mb-3'
                                    isDisabled={isLoading}
                                    isMulti={true}
                                    defaultValue={statusOption.filter(status => websiteFilters.status.includes(status.value))}
                                />
                            </div>
                            <div className='col-md-3'>
                                <label className='mb-2'>Domain</label>
                                <Domain
                                    onDomainChange={(e) => { websiteFilters.domain = e.value }}
                                    websiteStore={websiteStore}
                                    loading={isLoading}
                                    defaultDomain={websiteFilters.domain}
                                    multiSelect={false}
                                />
                            </div>
                            <div className='col-md-3'>
                                <label className='mb-2'>Server</label>
                                <Select
                                    name='server'
                                    options={serversOptions}
                                    onChange={(e: OptionType | null) => { if (e) websiteFilters.server = e.value }}
                                    defaultValue={selectedServerOption}
                                    className='mb-3'
                                    isDisabled={isLoading}
                                />
                            </div>
                            <div className='col-md-3'>
                                <label className='mb-2'>Database</label>
                                <Select
                                    name='database'
                                    options={databasesOptions}
                                    onChange={(e: OptionType | null) => { if (e) websiteFilters.database = e.value }}
                                    defaultValue={selectedDatabaseOption}
                                    className='mb-3'
                                    isDisabled={isLoading}
                                />
                            </div>
                            <div className='col-md-3'>
                                <label className='mb-2'>Tags</label>
                                <Select
                                    name='tags'
                                    options={filterHelpTags}
                                    isMulti
                                    onChange={onHelpTagsFilterChange}
                                    className='mb-3'
                                    defaultValue={
                                        filterHelpTags.filter(item =>
                                            websiteFilters.tag !== undefined &&
                                            websiteFilters.tag.includes(item.value))
                                    }
                                    isDisabled={isLoading}
                                />
                            </div>
                            <div className='col-md-3'>
                                <label className='mb-2'>Sticky.Io Campaign Id</label>
                                <input
                                    value={websiteFilters.campaignId}
                                    className='form-control mb-3'
                                    name='sticky_io'
                                    onChange={(e) => { websiteFilters.campaignId = e.target.value }}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className='col-md-3'>
                                <label className='mb-2'>CCBill Sub Account No</label>
                                <input
                                    className='form-control mb-3'
                                    value={websiteFilters.subAccountNo}
                                    name='ccbill_Sub_Account'
                                    onChange={(e) => { websiteFilters.subAccountNo = e.target.value }}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className='col-md-3 mt-2'>
                                <label>Payment Gateway</label>
                                <div>
                                    <div className='form-check form-check-inline'>
                                        <input
                                            className='form-check-input'
                                            type='radio'
                                            name='payment_gateway'
                                            id='payment_gateway_all'
                                            value=''
                                            onChange={onPaymentGatewayChange}
                                            defaultChecked={websiteFilters.payment_gateway === '' && true}
                                            disabled={isLoading}
                                        />
                                        <label
                                            className='form-check-label'
                                            htmlFor='payment_gateway_all'
                                        >
                                            All
                                        </label>
                                    </div>
                                    <div className='form-check form-check-inline'>
                                        <input
                                            className='form-check-input'
                                            type='radio'
                                            name='payment_gateway'
                                            id='ccbill'
                                            value='ccbill'
                                            onChange={onPaymentGatewayChange}
                                            defaultChecked={websiteFilters.payment_gateway === 'ccbill' && true}
                                            disabled={isLoading}
                                        />
                                        <label className='form-check-label' htmlFor='ccbill'>
                                            CCBill
                                        </label>
                                    </div>
                                    <div className='form-check form-check-inline'>
                                        <input
                                            className='form-check-input'
                                            type='radio'
                                            name='payment_gateway'
                                            id='sticky.io'
                                            value='sticky.io'
                                            onChange={onPaymentGatewayChange}
                                            defaultChecked={websiteFilters.payment_gateway === 'sticky.io' && true}
                                            disabled={isLoading}
                                        />
                                        <label className='form-check-label' htmlFor='sticky.io'>
                                            Sticky.io
                                        </label>
                                    </div>
                                    <div className='form-check form-check-inline'>
                                        <input
                                            className='form-check-input'
                                            type='radio'
                                            name='payment_gateway'
                                            id='hybrid'
                                            value='hybrid'
                                            onChange={onPaymentGatewayChange}
                                            defaultChecked={websiteFilters.payment_gateway === 'hybrid' && true}
                                            disabled={isLoading}
                                        />
                                        <label className='form-check-label' htmlFor='hybrid'>
                                            Hybrid
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className='col-md-3 mt-2'>
                                <label>Crypto Payment Enabled</label>
                                <div>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="is_crypto_enabled"
                                            id="crypto_enabled_all"
                                            value=""
                                            onChange={onPaymentGatewayChange}
                                            defaultChecked={websiteFilters.is_crypto_enabled === '' && true}
                                            disabled={isLoading}
                                        />
                                        <label className="form-check-label" htmlFor="crypto_enabled_all">All</label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="is_crypto_enabled"
                                            id="crypto_enabled_yes"
                                            value="true"
                                            onChange={onPaymentGatewayChange}
                                            defaultChecked={websiteFilters.is_crypto_enabled === 'true' && true}
                                            disabled={isLoading}
                                        />
                                        <label className="form-check-label" htmlFor="crypto_enabled_yes">Yes</label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="is_crypto_enabled"
                                            id="crypto_enabled_no"
                                            value="false"
                                            onChange={onPaymentGatewayChange}
                                            defaultChecked={websiteFilters.is_crypto_enabled === 'false' && true}
                                            disabled={isLoading}
                                        />
                                        <label className="form-check-label" htmlFor="crypto_enabled_no">No</label>
                                    </div>
                                </div>
                            </div>
                            <div className='col-md-3 mt-2'>
                                <button
                                    className='btn btn-primary'
                                    onClick={handleApplyFilter}
                                    disabled={isLoading}
                                >
                                    {isLoading === true && (
                                        <span
                                            className='spinner-border spinner-border-sm me-1'
                                            role='status'
                                            aria-hidden='true'
                                        ></span>
                                    )}
                                    Apply filter
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div className="my-4">
                <div className='table-responsive mt-3' >
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'website_id', title: 'Id' },
                            { name: 'website_url', title: 'Domain', component: tableCellText },
                            { name: 'monthly_earning', title: 'Current Month Earning', component: tableCellEarning },
                            { name: 'payment_gateway', title: 'Payment Gateway' },
                            { name: 'subscription_sub_account', title: 'Payment Gateway Configuration', component: tableCellPaymentGatewayConfig },
                            { name: 'server.name', title: 'Server Name' },
                            { name: 'database.name', title: 'Database Name' },
                            { name: 'rating', title: 'Rating' },
                            { name: 'vendor_name', title: 'Vendor Name' },
                            { name: 'created_at', title: 'Date' },
                            { name: 'recaptcha_website_id', title: 'Recaptcha Analytics', component: tableCellRecaptchaAnalytics },
                            { name: 'action', title: 'Actions', component: tableCellButton }
                        ]}
                        data={websiteData}
                        isLoading={isLoading}
                    ></Table>
                </div>
                {websiteData.length > 0 && !isLoading ? (
                    <Pagination
                        totalPages={totalPage}
                        currentPage={currentPage}
                        totalItems={totalRows}
                        itemsPerPage={limit}
                        onItemClick={changePage}
                    ></Pagination>
                ) : null}
                {showModel ? (
                    <div
                        className='modal fade show'
                        role='dialog'
                        style={{ display: 'block', backgroundColor: '#00000080' }}
                    >
                        <div className='modal-dialog modal-dialog-scrollable modal-lg'>
                            <div className='modal-content' style={{ height: '30%' }}>
                                <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                                    <h5 className='modal-title'>Set Help Tags</h5>
                                    <div onClick={() => hideSetTagPopup()} style={{ cursor: 'pointer' }}>
                                        <FontAwesomeIcon icon={faWindowClose} />
                                    </div>
                                </div>
                                <div className='modal-body'>
                                    <div className='container'>
                                        <div className='row mt-3'>
                                            <div className='col-md-6'>
                                                <label className='me-2 mt-2 d-flex align-items-center mb-1'>
                                                    Tags
                                                </label>
                                                <Select
                                                    name='tags'
                                                    options={helpTags}
                                                    isMulti
                                                    onChange={onHelpTagsChange}
                                                    className='mb-3'
                                                    isDisabled={isTagLoading}
                                                    value={selectedHelpTags}
                                                />
                                            </div>
                                            <div className='col-md-6'>
                                                <button
                                                    type='button'
                                                    className='btn btn-primary'
                                                    style={{ marginTop: '10%' }}
                                                    onClick={(e) => {
                                                        addWebsiteTags(e)
                                                    }}
                                                    disabled={isTagLoading}
                                                >
                                                    {isTagLoading === true && (
                                                        <span
                                                            className='spinner-border spinner-border-sm me-1'
                                                            role='status'
                                                            aria-hidden='true'
                                                        ></span>
                                                    )}
                                                    Add Tags
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </Container >
    )
}

export default observer(WebsiteConfig)
