import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import moment from 'moment'
import { Cell } from './../table/Definations'
import styled from 'styled-components'

interface Props {
    rootStore: RootStore
}

const Loader = styled.div`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 9;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(255,255,255,0.8);
`

const StickyIoPaymentProfiles: React.FC<Props> = ({ rootStore }) => {
    const { StickyIoPaymentProfilesStore } = rootStore
    const { getStickyIoPaymentProfileList, filter, stickyIoPaymentProfileData, currentPage, totalPage, limit, totalRows, isLoading, refreshStickyIoPaymentProfile } = StickyIoPaymentProfilesStore

    useEffect(() => {
        getStickyIoPaymentProfileList(1)
    }, [getStickyIoPaymentProfileList])

    const changePage = (pageNum: number) => {
        getStickyIoPaymentProfileList(pageNum)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value

        if (name === 'gateway_active') {
            filter.gateway_active = value
        }  else if (name === 'gateway_alias') {
            filter.gateway_alias = value.trim()
        }
    }

    const gatewayActiveStatus = [
        { label: 'All', value: 'all' },
        { label: 'Enabled', value: '1' },
        { label: 'Disabled', value: '0' }
    ]

    const gatewayActiveStatusOptions = gatewayActiveStatus.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const TableCellTimeAgo : React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const timeToShow = `${data.value} (${timeAgo})`
        return (timeToShow)
    }

    const TableCellGatewayStatus : React.FC<Cell> = (data) => {
        const status = data.value === '1' ? 'Enabled' : 'Disabled'
        return (status)
    }

    const filterRecords = () => {
        getStickyIoPaymentProfileList(1)
    }

    const refreshProfile = () => {
        refreshStickyIoPaymentProfile()
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='card'>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <form>
                            <div className='row'>
                                <div className='col-md-3'>
                                    <label className='me-2 mb-2'>Gateway Status</label>
                                    <select
                                        className='form-control form-select'
                                        id='gateway_active'
                                        name='gateway_active'
                                        onChange={onChange}>
                                        {gatewayActiveStatusOptions}
                                    </select>
                                </div>
                                <div className='col-md-3'>
                                    <label className='me-2 mb-2'>Gateway Alias</label>
                                    <input
                                        name='gateway_alias'
                                        type='text'
                                        className='form-control'
                                        onChange={onChange}
                                    />
                                </div>
                                <div className='col-md-3'>
                                    <button type="button"
                                        className="btn btn-primary mt-4"
                                        onClick={filterRecords}
                                        disabled={isLoading}>
                                        {isLoading === true &&
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                                    Apply Filter</button>
                                </div>

                                <div className='col-md-3'>
                                    <button type="button"
                                        className="btn btn-primary mt-4"
                                        onClick={refreshProfile}
                                        disabled={isLoading}>
                                        {isLoading === true &&
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                                    Refresh Payment Profiles</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div className='card mt-4'>
            <div className='card-header'>Sticky Io Payment Profiles</div>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <div className='table-responsive mt-3'>
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'gateway_id', title: 'Gateway Id' },
                                    { name: 'gateway_type', title: 'Gateway Type' },
                                    { name: 'gateway_provider', title: 'Gateway Provider' },
                                    { name: 'gateway_active', title: 'Gateway Status', component: TableCellGatewayStatus },
                                    { name: 'gateway_alias', title: 'Gateway Alias' },
                                    { name: 'createdAt', title: 'DATE', component: TableCellTimeAgo }
                                ]}
                                data={stickyIoPaymentProfileData}
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
            </div>
        </div>
    </Container>
}

export default observer(StickyIoPaymentProfiles)
