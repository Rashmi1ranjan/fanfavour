import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { NavLink } from 'react-router-dom'
import _ from 'lodash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWindowClose } from '@fortawesome/free-solid-svg-icons'
import Select from 'react-select'
import { ActionMeta, ValueType } from 'react-select/src/types'
import moment from 'moment'
import { Cell } from './../table/Definations'
import { OptionTypeNumericValue as OptionType, SortConfig } from '../../types/types'
import styled from 'styled-components'

type IsMulti = boolean

interface Props {
    rootStore: RootStore
}

const RadioInput = styled.input`
    border: 1px solid #8d8f91;
`

const BlockUserList: React.FC<Props> = ({ rootStore }) => {
    const { BlockUserStore, websiteStore } = rootStore
    const { getAllBlockCodeOption, setBlockUserDetails, BlockUser, currentPage, totalPage, limit, totalRows, BlockCodeData, getUsersListByBlockedUserId, blockedUsers, isLoading, isLoadingBlockedUsersList, filter, sortConfig, resetFilters } = BlockUserStore
    const { getWebsitesData, websiteData } = websiteStore
    const [showViewModel, setShowViewModel] = useState(false)

    useEffect(() => {
        return (() => {
            resetFilters()
        })
    }, [])

    useEffect(() => {
        getAllBlockCodeOption()
        setBlockUserDetails(1)
        getWebsitesData()
    }, [setBlockUserDetails])

    const changePage = (pageNUM: number) => {
        setBlockUserDetails(pageNUM)
    }

    const shouldSort = (sortConfigByTable: SortConfig) => {
        _.set(sortConfig, 'key', sortConfigByTable.key)
        _.set(sortConfig, 'direction', sortConfigByTable.direction)
        setBlockUserDetails(1)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const status = jsonData.status
        const domain_id = jsonData.domain_id
        const Url = '/edit-block-user/' + jsonData._id
        return (<>
            {status === 'processed' ? <div className='row'>
                {domain_id !== 0 &&
                    <div className='col-auto'>
                        <NavLink className="link-primary text-underline p-0" style={{ textDecoration: 'underline' }} to={Url} >Edit</NavLink>
                    </div>
                }
                <div className='col-auto d-flex'>
                    <button style={{ color: '#0d6efd' }} onClick={() => getUsers(jsonData._id)} className='btn btn-link p-0'>View Details</button>
                </div>
            </div>
                :
                <>In Processing</>
            }
        </>)
    }

    const getUsers = (id: string) => {
        setShowViewModel(true)
        getUsersListByBlockedUserId(id)
    }

    const BlockType = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { type: number }
        if (data.type === 1) {
            return <>Card Id</>
        } else if (data.type === 2) {
            return <>Card Name</>
        }
        return <>Email</>
    }

    const BlockReason = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { block_code_id: string }
        const blockData = BlockCodeData.filter((blockCode) => blockCode._id === data.block_code_id)
        if (blockData.length === 1) {
            return <>{blockData[0].message}</>
        }
        return <></>
    }

    const DomainName = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { domain_id: number }
        if (data.domain_id === 0) {
            return <>All</>
        }
        const domainData = websiteData.filter((website) => website.website_id === data.domain_id)
        if (domainData.length === 1) {
            return <>{domainData[0].website_url}</>
        }
        return <></>
    }

    const SourceDomainName = (objData: object) => {
        const sourceDomain = _.get(objData, 'data.source_domain', '')
        if (sourceDomain === '') {
            return <></>
        }
        const domainData = websiteData.filter((website) => website.website_id === sourceDomain)
        if (domainData.length === 1) {
            return <>{domainData[0].website_url}</>
        }
        return <></>
    }

    const blockedUserDetail = (objData: object) => {
        const data = _.get(objData, 'data.blocked_user_details', {})
        const userData = JSON.stringify(data)
        return (<>
            {userData}
        </>)
    }

    const websiteOptions: OptionType[] = websiteData.map((option, index) => (
        { label: `${index + 1}. ${option.website_url}`, value: option.website_id }
    ))

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name as string
        const selectedValue = value
        _.set(filter, name, selectedValue)
    }

    const filterRecords = () => {
        setBlockUserDetails(1)
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const formattedTime = moment.utc(data.value).format('YYYY-MM-DD HH:mm:ss')
        const timeToShow = `${formattedTime} (${timeAgo})`
        return (timeToShow)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row border-bottom mb-3'>
            <div className='col-md-6'>
                <h4 className='card-title'>Block User List</h4>
            </div>
            <div className='col-md-6'>
                <NavLink className="float-end" to="/add-block-user" >Add</NavLink>
            </div>
        </div>
        <div className='card'>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <form>
                            <div className='row'>
                                <div className='col-md-4'>
                                    <label className='me-2 mb-2'>Domain</label>
                                    <Select
                                        name='domain'
                                        onChange={handleChange}
                                        options={websiteOptions}
                                        isMulti={true}
                                    />
                                </div>
                                <div className='col-md-4'>
                                    <label className='me-2 mb-2'>Source Domain</label>
                                    <Select
                                        name='source_domain'
                                        onChange={handleChange}
                                        options={websiteOptions}
                                        isMulti={true}
                                    />
                                </div>
                                <div className='col-md-4'>
                                    <label className='me-2 mb-2'>Email</label>
                                    <input
                                        name='email'
                                        type='text'
                                        className='form-control'
                                        placeholder='Email'
                                        onChange={(e) => filter.email = e.target.value.trim()}
                                    />
                                </div>
                                <div className='col-md-4'>
                                    <label className='me-2 mb-2 mt-2'>Card Id</label>
                                    <input
                                        name='card'
                                        type='text'
                                        className='form-control'
                                        placeholder='Card Id'
                                        onChange={(e) => filter.card = e.target.value.trim()}
                                    />
                                </div>
                                <div className='col-md-4'>
                                    <label className='me-2 mt-2 mb-2'>Type</label>
                                    <div>
                                        <div className='form-check form-check-inline'>
                                            <RadioInput className='form-check-input' type='radio' name='lookup_by' id='lookup_by_all' value='all' onChange={() => filter.type = 'all'} defaultChecked={true} />
                                            <label className='form-check-label' htmlFor='lookup_by_all'>All</label>
                                        </div>
                                        <div className='form-check form-check-inline'>
                                            <RadioInput className='form-check-input' type='radio' name='lookup_by' id='lookup_by_email' value='email' onChange={() => filter.type = 'email'} />
                                            <label className='form-check-label' htmlFor='lookup_by_email'>Email</label>
                                        </div>
                                        <div className='form-check form-check-inline'>
                                            <RadioInput className='form-check-input' type='radio' name='lookup_by' id='lookup_by_card' value='card' onChange={() => filter.type = 'card'} />
                                            <label className='form-check-label' htmlFor='lookup_by_card'>Card Id</label>
                                        </div>
                                        <div className='form-check form-check-inline'>
                                            <RadioInput className='form-check-input' type='radio' name='lookup_by' id='lookup_by_card_name' value='card_name' onChange={() => filter.type = 'card_name'} />
                                            <label className='form-check-label' htmlFor='lookup_by_card_name'>Card Name</label>
                                        </div>
                                    </div>
                                </div>
                                <div className='col-md-3 mt-2'>
                                    <button type="button"
                                        className="btn btn-primary mt-4"
                                        onClick={filterRecords}
                                        disabled={isLoading}>
                                        {isLoading === true &&
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                                        Apply Filter</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div className="mt-4">
            <div className='mb-2'>
                <div className='table-responsive'>
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'domain_id', title: 'Domain', component: DomainName },
                            { name: 'source_domain', title: 'Source Domain', component: SourceDomainName },
                            { name: 'field', title: 'Email/Card Id/Card Name' },
                            { name: 'type', title: 'Type', component: BlockType },
                            { name: 'block_code_id', title: 'Block Reason', component: BlockReason },
                            { name: 'times_blocked', title: 'Times Blocked', sort: true },
                            // Comment for now because block in website in stopped
                            // { name: 'status', title: 'Status' },
                            { name: 'created_at', title: 'Date', sort: true, component: TableCellTimeAgo }
                            // Comment for now because block in website in stopped
                            // { name: 'action', title: 'Actions', component: tableCellButton }
                        ]}
                        data={BlockUser}
                        shouldSort={shouldSort}
                        isLoading={isLoading}
                        defaultSort={sortConfig}
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
        {showViewModel ?
            <div className='modal fade show' role='dialog' style={{ display: 'block', backgroundColor: '#00000080' }
            } >
                <div className='modal-dialog modal-dialog-centered modal-lg'>
                    <div className='modal-content'>
                        <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                            <h5 className='modal-title'>Blocked User Detail</h5>
                            <div
                                onClick={() => {
                                    setShowViewModel(false)
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <FontAwesomeIcon icon={faWindowClose} />
                            </div>
                        </div>
                        <div className='modal-body' style={{ display: 'contents', lineHeight: 'normal' }}>
                            <div className='container'>
                                {isLoadingBlockedUsersList === true ?
                                    <div className='text-center'>
                                        <div className='spinner-border' role='status' style={{ color: '#c6c6c6' }}>
                                            <span className='sr-only'>Loading...</span>
                                        </div>
                                    </div>
                                    :
                                    <div className='table-responsive'>
                                        <Table
                                            unique_key='_id'
                                            columns={[
                                                { name: 'domain_id', title: 'Domain', component: DomainName },
                                                { name: 'block_user_id', title: 'User Detail', component: blockedUserDetail, class: 'text-break' }
                                            ]}
                                            data={blockedUsers}
                                        ></Table>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div > : null}
    </Container>
}

export default observer(BlockUserList)
