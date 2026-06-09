import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import moment from 'moment'
import { ActionMeta } from 'react-select/src/types'
import { Cell } from './../table/Definations'
import { toJS } from 'mobx'
import Button from '../utils/Button'
import { v4 as uuid } from 'uuid'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

const WrongUserSubscriptionStatusLog: React.FC<Props> = ({ rootStore }) => {
    const { WrongUserSubscriptionStatusStore, websiteStore } = rootStore
    const {
        getWrongUserSubscriptionStatusList,
        filter,
        wrongUserSubscriptionStatusLogData,
        currentPage,
        totalPage,
        limit,
        totalRows,
        isLoading,
        markLogProcessed
    } = WrongUserSubscriptionStatusStore

    useEffect(() => {
        getWrongUserSubscriptionStatusList(1)
    }, [getWrongUserSubscriptionStatusList])

    const changePage = (pageNum: number) => {
        getWrongUserSubscriptionStatusList(pageNum)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value.trim()
        _.set(filter, name, value)
    }

    const handleChange = (value: string, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')
        if (name === 'domain') {
            filter.website_url = selectedValue
        }
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const dateFormat = moment(data.value).format('MM/DD/YYYY')
        const timeToShow = `${dateFormat} (${timeAgo})`
        return (timeToShow)
    }

    const filterRecords = () => {
        getWrongUserSubscriptionStatusList(1)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { is_fixed: boolean, _id: string }
        const jsonData = toJS(data)

        return (<Button
            disabled={data.is_fixed}
            type='button'
            title={jsonData.is_fixed === false ? 'Mark Fixed' : 'Fixed'}
            classes='btn-primary btn-sm'
            loading={isLoading}
            onClick={() => markProcessed(jsonData._id)}
        />)
    }

    const markProcessed = (logId: string) => {
        markLogProcessed(logId)
    }

    const transactionType = [
        { label: 'All', value: 'all' },
        { label: 'NEW', value: 'NEW' },
        { label: 'REBILL', value: 'REBILL' }
    ]

    const transactionTypeOptions = transactionType.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className="card-title">Wrong User Subscription Status Log</h4>
        <div className='card mt-4'>
            <div className='card-body'>
                <form>
                    <div className='row'>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Website</label>
                            <Domain
                                onDomainChange={handleChange}
                                websiteStore={websiteStore}
                                loading={isLoading}
                                defaultDomain={filter.website_url}
                                multiSelect={false}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>User Id</label>
                            <input
                                name='user_id'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                                value={filter.user_id}
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
                        <div className='col-md-2'>
                            <label className='me-2 mb-3'>Is Fixed?</label>
                            <div>
                                <div className='form-check form-check-inline'>
                                    <input className='form-check-input' type='radio' name='is_fixed' id='fixed_yes' value='true' onChange={onChange} />
                                    <label className='form-check-label' htmlFor='fixed_yes'>Yes</label>
                                </div>
                                <div className='form-check form-check-inline'>
                                    <input className='form-check-input' type='radio' name='is_fixed' id='fixed_no' value='false' onChange={onChange} defaultChecked={true} />
                                    <label className='form-check-label' htmlFor='fixed_no'>No</label>
                                </div>
                            </div>
                        </div>
                        <div className='col-md-3 mt-3'>
                            <button type='button'
                                className='btn btn-primary mt-4'
                                onClick={filterRecords}
                                disabled={isLoading}>
                                {isLoading === true &&
                                    <span className='spinner-border spinner-border-sm me-1' role='status' aria-hidden='true'></span>}
                                Apply Filter</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <div className='row'>
            <div className='col-12 col-md-12'>
                <div className='table-responsive mt-3'>
                    <Table
                        unique_key={uuid()}
                        columns={[
                            { name: 'website_url', title: 'Website' },
                            { name: 'user_id', title: 'User Id' },
                            { name: 'transaction_type', title: 'Transaction Type' },
                            { name: 'pcp_transaction_type', title: 'PCP Transaction Type' },
                            { name: 'createdAt', title: 'Date', component: TableCellTimeAgo },
                            { name: 'action', title: 'Action', component: tableCellButton }
                        ]}
                        data={wrongUserSubscriptionStatusLogData}
                        isLoading={isLoading}
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

export default observer(WrongUserSubscriptionStatusLog)
