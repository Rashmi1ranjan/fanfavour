import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { NavLink } from 'react-router-dom'
import _ from 'lodash'

interface Props {
    rootStore: RootStore
}

const MangeLinkTrackingUsers: React.FC<Props> = ({ rootStore }) => {
    const { LinkTrackingReferralStore } = rootStore
    const { getUserData, linkTrackingReferralUserData, currentPage, totalPage, limit, totalRows, isLoading, deleteLinkTrackingReferralUserById } = LinkTrackingReferralStore

    useEffect(() => {
        if (linkTrackingReferralUserData.length === 0) {
            getUserData(1)
        }
    }, [])

    const changePage = (pageNUM: number) => {
        getUserData(pageNUM)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const EditUrl = `/link-tracking-users/edit-user/${jsonData._id}`

        const deleteHandler = () => {
            // add confirmation and delete only if confirmed
            const isConfirmed = window.confirm('Are you sure you want to delete this user?')
            if (isConfirmed) {
                deleteLinkTrackingReferralUserById(jsonData._id)
            }
        }

        return (<>
            <NavLink className="link-primary text-underline me-3" to={EditUrl} >Edit</NavLink>
            <button className="btn btn-link link-danger text-underline p-0 border-0 bg-transparent" onClick={deleteHandler}>Delete</button>
        </>)
    }

    const renderReferralNames = (objData: object) => {
        const data: any = _.get(objData, 'data', {})

        return (
            <>
                {data?.referral_links && data.referral_links.map((item: any, index: number) => (
                    <span key={index} className="badge bg-primary me-1">{item.name}</span>
                ))}
            </>
        )
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='d-flex justify-content-between align-items-center'>
            <h4 className="card-title">Link Tracking Users</h4>
            <NavLink className="link-primary text-underline me-3" to='/link-tracking-users/add-user'>Add User</NavLink>
        </div>
        <div className="row">
            <div className="col my-3">
                <div className='table-responsive' >
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'name', title: 'Name' },
                            { name: 'email', title: 'Email' },
                            { name: 'referral_links', title: 'Referrals', component: renderReferralNames },
                            { name: 'action', title: 'Actions', component: tableCellButton }
                        ]}
                        data={linkTrackingReferralUserData}
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

export default observer(MangeLinkTrackingUsers)
