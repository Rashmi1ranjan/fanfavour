import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import Select from 'react-select'
import { ActionMeta, ValueType } from 'react-select/src/types'
import moment from 'moment'
import { Cell } from './../table/Definations'
import DateRange from './../utils/DateRange'
import { ToastContainer } from 'react-toastify'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faWindowClose, faUndo } from '@fortawesome/free-solid-svg-icons'
import Button from './../utils/Button'
import Domain from '../layout/Domain'
import { v4 as uuid } from 'uuid'
import { ForumPayTransactionDetails, OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const ForumPayTransactionHistory: React.FC<Props> = ({ rootStore }) => {
    const { ForumPayTransactionHistoryStore, websiteStore } = rootStore
    const {
        getForumPayTransactionHistoryList,
        filter,
        ForumPayTransactionHistoryData,
        currentPage,
        totalPage,
        limit,
        totalRows,
        isLoading,
        updateTransactionStatusByTransactionId,
        exportForumPayTransactionHistory
    } = ForumPayTransactionHistoryStore

    const [transactionDetail, setTransactionDetail] = useState<ForumPayTransactionDetails | boolean>(false)

    useEffect(() => {
        getForumPayTransactionHistoryList(1)
    }, [getForumPayTransactionHistoryList])

    const changePage = (pageNum: number) => {
        getForumPayTransactionHistoryList(pageNum)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value.trim()
        _.set(filter, name, value)
    }

    const handleChange = (value: ValueType<OptionType, true>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')

        if (name === 'domain') {
            filter.domain = selectedValue
        }

        if (name === 'content_type') {
            const contentType = []
            for (const content_type of value) {
                contentType.push(content_type.value)
            }
            filter.content_type = contentType
        }

        if (name === 'wallet_transaction_status') {
            const walletTransactionStatus = []
            for (const wallet_transaction_status of value) {
                walletTransactionStatus.push(wallet_transaction_status.value)
            }
            filter.wallet_transaction_status = walletTransactionStatus
        }
    }

    const transactionType = [
        { label: 'All', value: 'all' },
        { label: 'Credit', value: 'credit' },
        { label: 'Debit', value: 'debit' }
    ]

    const transactionTypeOptions = transactionType.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const transactionStatusType = [
        { label: 'All', value: 'all' },
        { label: 'Success', value: 'success' },
        { label: 'Cancelled', value: 'failed' },
        { label: 'Processing', value: 'processing' }
    ]

    const transactionStatusTypeOptions = transactionStatusType.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const contentType = [
        { label: 'ADD FUND', value: 'add_fund' },
        { label: 'SUBSCRIPTION', value: 'subscription' },
        { label: 'EXCLUSIVE CONTENT', value: 'blog' },
        { label: 'CHAT', value: 'chat' },
        { label: 'TIPS', value: 'tips' },
        { label: 'REBILL', value: 'rebill' },
        { label: 'PAY PER MESSAGE', value: 'chat_pay_per_message' }
    ]

    const content_type: OptionType[] = []
    const contentTypeOption: OptionType[] = contentType.map((option: { label: string, value: string }) => (
        { label: option.label, value: option.value }
    ))
    content_type.push(...contentTypeOption)

    const walletTransactionStatusType = [
        { label: 'Processing', value: 'pending' },
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
        { label: 'Region Error', value: 'region_error' },
        { label: 'Error', value: 'error' }
    ]

    const walletTransactionStatus: OptionType[] = []
    const walletTransactionStatusTypeOptions: OptionType[] = walletTransactionStatusType.map((option: { label: string, value: string }) => (
        { label: option.label, value: option.value }
    ))
    walletTransactionStatus.push(...walletTransactionStatusTypeOptions)

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const dateFormat = moment(data.value).format('MM/DD/YYYY')
        const timeToShow = `${dateFormat} (${timeAgo})`
        return (timeToShow)
    }

    const filterRecords = () => {
        getForumPayTransactionHistoryList(1)
    }

    const onDateChange = (start_date: string, end_date: string) => {
        filter.start_date = start_date
        filter.end_date = end_date
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { transaction_status: string }
        const jsonData = JSON.parse(JSON.stringify(data))
        return (<div className='d-flex'>
            <button
                className='btn btn-info btn-sm me-1 text-white'
                onClick={() => {
                    viewDetail(jsonData)
                }}><FontAwesomeIcon icon={faInfoCircle} /></button>
            {
                data.transaction_status === 'processing' &&
                <Button
                    disabled={isLoading}
                    type='button'
                    title=''
                    icon={<FontAwesomeIcon icon={faUndo} />}
                    classes='btn-primary btn-sm'
                    loading={isLoading}
                    onClick={() => updateTransactionStatusByTransactionId(jsonData._id)}
                />
            }
        </div>)
    }

    const TableCellUserInfo = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return (<>{jsonData.user_id}<br />{jsonData.email}<br />{jsonData.ip_address}</>)
    }

    const TableCellTransactionInfo = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))

        const amount = `$${parseFloat(jsonData.amount).toFixed(2)}`
        const crypto_currency = _.get(jsonData, 'transaction_info.crypto_currency', '')
        const content_type = getContentType(_.get(jsonData, 'transaction_info.content_type', ''))

        return (<>{amount}<br />{crypto_currency}<br />{content_type}</>)
    }

    const TableCellTransactionStatus: React.FC<Cell> = (data) => {
        const status = data.value === 'failed' ? 'Cancelled' : data.value
        return (status)
    }

    const getContentType = (type: string) => {
        switch (type) {
        case 'add_fund':
            return 'Add Fund'
        case 'subscription':
            return 'Subscription'
        case 'blog':
            return 'Exclusive Content'
        case 'chat':
            return 'Message Unlock'
        case 'tips':
            return 'Tips'
        case 'rebill':
            return 'Rebill'
        case 'chat_pay_per_message':
            return 'Pay Per Message'
        default:
            break
        }
    }

    const viewDetail = (data: ForumPayTransactionDetails) => {
        setTransactionDetail(data)
    }

    const exportCSV = () => {
        exportForumPayTransactionHistory()
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4>
            Forum Pay Transaction History
        </h4>
        <div className='card mt-4'>
            <div className='card-body'>
                <ToastContainer
                    position='top-right'
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
                <form>
                    <div className='row'>
                        <div className='col-md-3'>
                            <DateRange
                                title='Date Range'
                                id='date_range'
                                name='date_range'
                                startDate={''}
                                endDate={''}
                                onDateChange={onDateChange}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Website</label>
                            <Domain
                                onDomainChange={handleChange}
                                websiteStore={websiteStore}
                                loading={isLoading}
                                defaultDomain={filter.domain}
                                multiSelect={false}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Transaction Type</label>
                            <select
                                className='form-control form-select'
                                id='transaction_type'
                                name='transaction_type'
                                onChange={onChange}>
                                {transactionTypeOptions}
                            </select>
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>PCP Transaction Id</label>
                            <input
                                name='pcp_transaction_id'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3 mt-2'>
                            <label className='me-2 mb-2'>User Id</label>
                            <input
                                name='user_id'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3 mt-2'>
                            <label className='me-2 mb-2'>Email</label>
                            <input
                                name='email'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3 mt-2'>
                            <label className='me-2 mb-2'>Payment Transaction Id</label>
                            <input
                                name='transaction_id'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3 mt-2'>
                            <label className='me-2 mb-2'>Content Type</label>
                            <Select
                                id='content_type'
                                name='content_type'
                                onChange={handleChange}
                                isMulti
                                options={content_type}
                            />
                        </div>
                        <div className='col-md-3 mt-2'>
                            <label className='me-2 mb-2'>Status</label>
                            <select
                                className='form-control form-select'
                                id='transaction_status'
                                name='transaction_status'
                                onChange={onChange}
                            >
                                {transactionStatusTypeOptions}
                            </select>
                        </div>
                        <div className='col-md-3 mt-2'>
                            <label className='me-2 mb-2'>MC Transaction Status</label>
                            <Select
                                id='wallet_transaction_status'
                                name='wallet_transaction_status'
                                onChange={handleChange}
                                isMulti
                                options={walletTransactionStatus}
                            />
                        </div>
                        <div className='col-md-3 mt-4'>
                            <button type="button"
                                className="btn btn-primary mt-3 me-2"
                                onClick={filterRecords}
                                disabled={isLoading}>
                                {isLoading === true &&
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                                Apply Filter</button>
                            <button type="button"
                                className="btn btn-outline-primary mt-3"
                                onClick={exportCSV}
                                disabled={isLoading}>
                                {isLoading === true &&
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                                Export CSV</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <div className='mt-4 mb-4'>
            <div className='table-responsive mt-3'>
                <Table
                    unique_key={uuid()}
                    columns={[
                        { name: 'domain', title: 'website' },
                        { name: 'user_id', title: 'User Id, Email, IP Address', component: TableCellUserInfo },
                        { name: 'amount', title: 'Amount, Crypto Currency, Content Type', component: TableCellTransactionInfo },
                        { name: 'transaction_type', title: 'Transaction Type' },
                        { name: 'transaction_info.payment_id', title: 'Payment Transaction Id' },
                        { name: 'pcp_transaction_id', title: 'PCP Transaction Id' },
                        { name: 'transaction_status', title: 'Status', component: TableCellTransactionStatus },
                        { name: 'wallet_transaction_status', title: 'Wallet Transaction Status' },
                        { name: 'mst_created_date', title: 'Date (MST)', component: TableCellTimeAgo },
                        { name: 'transaction_info', title: 'Info', component: tableCellButton }
                    ]}
                    data={ForumPayTransactionHistoryData}
                    isLoading={isLoading}
                ></Table>
            </div>
            {(isLoading == false && totalRows > 0) &&
                <>
                    <Pagination
                        totalPages={totalPage}
                        currentPage={currentPage}
                        totalItems={totalRows}
                        itemsPerPage={limit}
                        onItemClick={changePage}
                    ></Pagination>
                </>
            }
        </div>
        {transactionDetail &&
            <div className='modal fade show' role='dialog' style={{ display: 'block', backgroundColor: '#00000080' }
            }>
                <div className='modal-dialog modal-dialog-scrollable modal-lg'>
                    <div className='modal-content'>
                        <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                            <h5 className='modal-title'>Forumpay Transaction Log</h5>
                            <div onClick={() => setTransactionDetail(false)} style={{ cursor: 'pointer' }}>
                                <FontAwesomeIcon icon={faWindowClose} />
                            </div>
                        </div>
                        <div className='modal-body'>
                            <div className='container'>
                                <div className='row'>
                                    <div className='col-md-4'>
                                        Website Response:
                                    </div>
                                    <div className='col-md-8'>
                                        <span className={'text-break'}>
                                            {typeof transactionDetail === 'object' && JSON.stringify(transactionDetail.transaction_info)}
                                        </span>
                                    </div>
                                </div>
                                {(typeof transactionDetail === 'object' && transactionDetail.transaction_type === 'credit') &&
                                    <>
                                        <hr />
                                        <div className='row'>
                                            <div className='col-md-4'>
                                                Forumpay Response:
                                            </div>
                                            <div className='col-md-8'>
                                                <span className={'text-break'}>
                                                    {typeof transactionDetail === 'object' && JSON.stringify(transactionDetail.forumpay_response)}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        }
    </Container>
}

export default observer(ForumPayTransactionHistory)
