import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import _ from 'lodash'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import Domain from '../layout/Domain'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { toJS } from 'mobx'
import moment from 'moment'

interface Props {
    rootStore: RootStore
}

interface AllWebsiteUserDetail {
    _id: string,
    email: string,
    domain: string,
    default_payment_method: string,
    createdAt: string
}

interface PaymentMethodFormatter {
    [key: string]: string
}

const AllWebsiteUserDetails: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, UniversalLoginStore } = rootStore

    const {
        allWebsiteUserfilter,
        limit,
        currentPage,
        totalPage,
        totalRows,
        isAllWebsiteUserDetailsApiError,
        allWebsiteUserDetails,
        getAllWebsiteUserDetails,
        isAllWebsiteUserDetailsLoading
    } = UniversalLoginStore

    const changePage = (pageNum: number) => {
        getAllWebsiteUserDetails(pageNum)
    }

    const PaymentMethodCell = (objData: { value: string }) => {
        const paymentMethodFormatter: PaymentMethodFormatter = {
            credit_card: 'Credit Card',
            crypto_currency: 'Crypto'
        }
        const paymentMethod: string = _.get(objData, 'value', '')
        return (<>{paymentMethodFormatter[paymentMethod]}</>)
    }

    const DateCell = (objData: { data: AllWebsiteUserDetail }) => {
        const jsonData = toJS(objData.data)
        const date = jsonData.createdAt
        const formatDate = moment(date).format('MM/DD/YYYY HH:mm:ss')
        return (<>{formatDate} ({moment(date).fromNow()})</>)
    }

    const applyFilter = () => {
        getAllWebsiteUserDetails(1)
    }

    const onDomainChange = (value: { label: string, value: string }[]) => {
        const domains = []
        for (const domain of value) {
            domains.push(domain.value)
        }
        allWebsiteUserfilter.domain = domains
    }

    const TableCellWebsiteLink = (objData: object) => {
        const website = _.get(objData, 'value', '')
        const url = `https://${website}`
        return (<a href={url} target='_blank' rel='noreferrer'>{website}</a>)
    }

    useEffect(() => {
        getAllWebsiteUserDetails(1)
    }, [])

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <h4 className='card-title'>All Website Users</h4>
            <div className='card'>
                <div className='card-body'>
                    <div className='row'>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Domain</label>
                            <Domain
                                onDomainChange={onDomainChange}
                                websiteStore={websiteStore}
                                loading={isAllWebsiteUserDetailsLoading}
                                defaultDomain={allWebsiteUserfilter.domain}
                                multiSelect={true}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='mb-2'>Email</label>
                            <input
                                className='form-control mb-3'
                                value={allWebsiteUserfilter.email}
                                name='email'
                                onChange={(e) => { allWebsiteUserfilter.email = e.target.value }}
                                disabled={isAllWebsiteUserDetailsLoading}
                            />
                        </div>
                        <div className='col-md-3 mt-4'>
                            <button
                                className='btn btn-block bg-primary text-light mb-1 me-3 mt-2'
                                onClick={() => applyFilter()}
                                disabled={isAllWebsiteUserDetailsLoading}
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {isAllWebsiteUserDetailsApiError ?
                <div className='responsive alert alert-danger p-3 my-3 rounded'>
                    Error while getting non-universal user details
                </div>
                :
                <>
                    <div className='table-responsive mt-3'>
                        <Table
                            unique_key='_id'
                            columns={[
                                { name: 'domain', title: 'Domain', component: TableCellWebsiteLink },
                                { name: 'email', title: 'Email' },
                                { name: 'default_payment_method', title: 'Default Payment Method', component: PaymentMethodCell },
                                { name: 'createdAt', title: 'Created At', component: DateCell }
                            ]}
                            isLoading={isAllWebsiteUserDetailsLoading}
                            data={allWebsiteUserDetails}
                        ></Table>
                    </div>
                    {(allWebsiteUserDetails.length > 0 && isAllWebsiteUserDetailsLoading === false) &&
                        <Pagination
                            totalPages={totalPage}
                            currentPage={currentPage}
                            totalItems={totalRows}
                            itemsPerPage={limit}
                            onItemClick={changePage}
                        ></Pagination>
                    }
                </>
            }
        </Container>
    )
}

export default observer(AllWebsiteUserDetails)
