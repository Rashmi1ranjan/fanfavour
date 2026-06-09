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
import styled from 'styled-components'
import MergedDomainsPopup from '../layout/MergedDomainsPopup'
import AddNotePopup from '../layout/AddNotePopup'
import OldEmailPopup from '../layout/OldEmailPopup'
import { ToastContainer } from 'react-toastify'

interface Props {
    rootStore: RootStore
}

interface UniversalUserDetail {
    _id: string,
    email: string,
    name: string,
    default_payment_method: string,
    universal_login_merged_domains: string[],
    createdAt: string,
    notes: string[],
    old_email: { email: string, created_at: string }[]
}

interface PaymentMethodFormatter {
    [key: string]: string
}

const StyledSpan = styled.span`
    cursor: pointer;
`

const UniversalUsersDetail: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, UniversalLoginStore } = rootStore
    const [showViewPopup, setShowViewPopup] = useState(false)
    const [showAddNotePopup, setShowAddNotePopup] = useState(false)
    const [userId, setUserId] = useState('')
    const [showOldEmailPopup, setShowOldEmailPopup] = useState(false)
    const [userDetails, setUserDetails] = useState({ universal_login_merged_domains: [''], email: '', name: '', createdAt: '', old_email: [{ email: '', created_at: '' }] })

    const {
        filter,
        limit,
        currentPage,
        totalPage,
        totalRows,
        universalUserApiError,
        universalUserDetails,
        getUniversalUserDetails,
        isUniversalUserDetailsLoading,
        getNote
    } = UniversalLoginStore

    useEffect(() => {
        getUniversalUserDetails(1)
    }, [])

    const changePage = (pageNum: number) => {
        getUniversalUserDetails(pageNum)
    }

    const PaymentMethodCell = (objData: { value: string }) => {
        const paymentMethodFormatter: PaymentMethodFormatter = {
            credit_card: 'Credit Card',
            crypto_currency: 'Crypto'
        }
        const paymentMethod: string = _.get(objData, 'value', '')
        return (<>{paymentMethodFormatter[paymentMethod]}</>)
    }

    const DateCell = (objData: { data: UniversalUserDetail }) => {
        const jsonData = toJS(objData.data)
        const date = jsonData.createdAt
        const formatDate = moment(date).format('MM/DD/YYYY HH:mm:ss')
        return (<>{formatDate} ({moment(date).fromNow()})</>)
    }

    const tableCellAction = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const cardDetailsUrl = '/universal-login-cards?email=' + jsonData.email
        const logDetailsUrl = '/universal-login-logs?email=' + jsonData.email
        return (
            <>
                <StyledSpan
                    className='link-primary text-decoration-underline'
                    onClick={() => {
                        viewDetail(jsonData)
                    }}>
                    Merged Websites List
                </StyledSpan><br />
                <a className='link-primary text-underline' href={cardDetailsUrl} target='_blank'
                    rel='noreferrer'>Card Details</a><br />
                <a className='link-primary text-underline' href={logDetailsUrl} target='_blank'
                    rel='noreferrer'>Log Details</a><br />
                <StyledSpan
                    className='link-primary text-decoration-underline'
                    onClick={() => {
                        openAddNotePopup(jsonData._id)
                    }}>
                    Add Note
                </StyledSpan><br />
                {!_.isEmpty(jsonData.old_email) &&
                    <StyledSpan
                        className='link-primary text-decoration-underline'
                        onClick={() => {
                            viewOldEmailDetail(jsonData)
                        }}>
                        Old Email
                    </StyledSpan>
                }
            </>
        )
    }

    const viewDetail = (data: UniversalUserDetail) => {
        setUserDetails(data)
        setShowViewPopup(true)
    }

    const openAddNotePopup = (id: string) => {
        setUserId(id)
        getNote(id)
        setShowAddNotePopup(true)
    }

    const viewOldEmailDetail = (data: UniversalUserDetail) => {
        setUserDetails(data)
        setShowOldEmailPopup(true)
    }

    const applyFilter = () => {
        getUniversalUserDetails(1)
    }

    const onDomainChange = (value: { label: string, value: string }[]) => {
        const domains = []
        for (const domain of value) {
            domains.push(domain.value)
        }
        filter.domain = domains
    }

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <h4 className='card-title'>Universal Login Users</h4>
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
            <div className='card'>
                <div className='card-body'>
                    <div className='row'>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Domain</label>
                            <Domain
                                onDomainChange={onDomainChange}
                                websiteStore={websiteStore}
                                loading={isUniversalUserDetailsLoading}
                                defaultDomain={filter.domain}
                                multiSelect={true}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='mb-2'>Email</label>
                            <input
                                className='form-control mb-3'
                                value={filter.email}
                                name='email'
                                onChange={(e) => { filter.email = e.target.value }}
                                disabled={isUniversalUserDetailsLoading}
                            />
                        </div>
                        <div className='col-md-3 mt-4'>
                            <button
                                className='btn btn-block bg-primary text-light mb-1 me-3 mt-2'
                                onClick={() => applyFilter()}
                                disabled={isUniversalUserDetailsLoading}
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {universalUserApiError ?
                <div className='responsive alert alert-danger p-3 my-3 rounded'>
                    Error while getting universal user details
                </div>
                :
                <>
                    <div className='table-responsive mt-3'>
                        <Table
                            unique_key='_id'
                            columns={[
                                { name: 'email', title: 'Email' },
                                { name: 'name', title: 'Name' },
                                { name: 'default_payment_method', title: 'Default Payment Method', component: PaymentMethodCell },
                                { name: 'createdAt', title: 'Date', component: DateCell },
                                { name: 'action', title: 'Action', component: tableCellAction }
                            ]}
                            isLoading={isUniversalUserDetailsLoading}
                            data={universalUserDetails}
                        ></Table>
                    </div>
                    {(universalUserDetails.length > 0 && isUniversalUserDetailsLoading === false) &&
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
            {showViewPopup &&
                <MergedDomainsPopup userDetails={userDetails} setShowViewPopup={setShowViewPopup} />
            }
            {showAddNotePopup &&
                <AddNotePopup userId={userId} setShowAddNotePopup={setShowAddNotePopup} rootStore={rootStore} />
            }
            {showOldEmailPopup &&
                <OldEmailPopup oldEmailDetails={userDetails} setShowOldEmailPopup={setShowOldEmailPopup} />
            }
        </Container>
    )
}

export default observer(UniversalUsersDetail)
