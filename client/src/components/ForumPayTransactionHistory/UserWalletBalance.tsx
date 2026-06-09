import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import moment from 'moment'
import { Cell } from './../table/Definations'
import { ToastContainer } from 'react-toastify'
import { ActionMeta, ValueType } from 'react-select/src/types'
import { v4 as uuid } from 'uuid'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import MergedDomainsPopup from '../layout/MergedDomainsPopup'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const StyledSpan = styled.span`
    text-decoration: underline;
    cursor: pointer;
`

const UserWalletBalance: React.FC<Props> = ({ rootStore }) => {
    const { UserWalletBalanceStore, websiteStore } = rootStore
    const {
        getUsersWalletDetailsList,
        filter,
        usersWalletDetails,
        currentPage,
        totalPage,
        limit,
        totalRows,
        isLoading
    } = UserWalletBalanceStore
    const [showViewPopup, setShowViewPopup] = useState(false)
    const [userDetails, setUserDetails] = useState({ universal_login_merged_domains: [''], email: '', name: '', createdAt: '' })

    useEffect(() => {
        getUsersWalletDetailsList(1)
    }, [getUsersWalletDetailsList])

    const changePage = (pageNum: number) => {
        getUsersWalletDetailsList(pageNum)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value.trim()
        _.set(filter, name, value)
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const dateFormat = moment(data.value).format('MM/DD/YYYY hh:mm:ss A')
        const timeToShow = `${dateFormat} (${timeAgo})`
        return (timeToShow)
    }

    const filterRecords = () => {
        getUsersWalletDetailsList(1)
    }

    const TableCellTransactionAmount: React.FC<Cell> = (data) => {
        const amount = `$${parseFloat(data.value).toFixed(2)}`
        return (amount)
    }

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')
        if (name === 'domain') {
            filter.domain = selectedValue
        }
    }

    const TableDomainComponent: React.FC<Cell> = (data) => {
        const isUniversalWallet = _.get(data, 'data.universal_wallet', false)
        const universalLoginMergedDomains = _.get(data, 'data.universal_login_merged_domains', [])
        const universalLoginEmail = _.get(data, 'data.email', '')
        const universalLoginName = _.get(data, 'data.name', '')
        const universalLoginCreatedAt = _.get(data, 'data.createdAt', '')

        const userDetail = {
            universal_login_merged_domains: universalLoginMergedDomains,
            email: universalLoginEmail,
            name: universalLoginName,
            createdAt: universalLoginCreatedAt
        }
        const domain = _.get(data, 'value', '')
        const url = `https://${domain}`

        if (isUniversalWallet && universalLoginMergedDomains.length >= 1) {
            return <StyledSpan
                className='link-primary text-underline'
                onClick={() => {
                    setUserDetails(userDetail)
                    setShowViewPopup(true)
                }}
            >
                Show All Domains
            </StyledSpan>
        }

        return <a
            className='link-primary text-underline'
            href={url}
            target='_blank'
            rel='noreferrer'
        >
            {domain}
        </a>
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4>
            Users Wallet Balance
        </h4>
        <div className='card mt-4'>
            <div className='card-body'>
                <form>
                    <div className='row'>
                        <div className='col-md-3 mt-2'>
                            <label className='me-2 mb-2'>Website</label>
                            <Domain
                                onDomainChange={handleChange}
                                websiteStore={websiteStore}
                                loading={isLoading}
                                defaultDomain={filter.domain}
                                multiSelect={false}
                            />
                        </div>
                        <div className='col-md-3 mt-2'>
                            <label className='me-2 mb-2'>Email</label>
                            <input
                                name='email'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                                value={filter.email}
                            />
                        </div>
                        <div className='col-md-3 mt-3'>
                            <button type='button'
                                className='btn btn-primary mt-4'
                                onClick={filterRecords}
                                disabled={isLoading}>
                                {isLoading === true &&
                                    <span className='spinner-border spinner-border-sm me-1' role='status' aria-hidden='true'></span>}
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <div className='mt-4 mb-4'>
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
            <div className='table-responsive'>
                <Table
                    unique_key={uuid()}
                    columns={[
                        { name: 'domain', title: 'Domain', component: TableDomainComponent },
                        { name: 'email', title: 'Email' },
                        { name: 'universal_wallet', title: 'Is Universal Wallet' },
                        { name: 'amount', title: 'Current Balance', component: TableCellTransactionAmount },
                        { name: 'createdAt', title: 'Date', component: TableCellTimeAgo },
                        { name: 'updatedAt', title: 'Last Updated Date', component: TableCellTimeAgo }
                    ]}
                    data={usersWalletDetails}
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
        {showViewPopup &&
            <MergedDomainsPopup userDetails={userDetails} setShowViewPopup={setShowViewPopup} />
        }
    </Container>
}

export default observer(UserWalletBalance)
