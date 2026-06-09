import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { NavLink } from 'react-router-dom'
import DateFormat from './../utils/DateFormat'
import _ from 'lodash'

interface Props {
    rootStore: RootStore
}

const LinkTrackingReferral: React.FC<Props> = ({ rootStore }) => {
    const { LinkTrackingReferralStore } = rootStore
    const { getLinkTrackingReferralData, linkTrackingReferralData, currentPage, totalPage, limit, totalRows, isLoading } = LinkTrackingReferralStore

    useEffect(() => {
        if (linkTrackingReferralData.length === 0) {
            getLinkTrackingReferralData(1)
        }
    }, [])

    const changePage = (pageNUM: number) => {
        getLinkTrackingReferralData(pageNUM)
    }

    const dateFormat = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return <DateFormat date={jsonData.created_at} />
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='d-flex justify-content-between align-items-center'>
            <h4 className="card-title">Link List</h4>
            <NavLink className="float-end text-decoration-none" to="/add-link-tracking-referral" style={{ textAlign: 'right' }} >Add Referral</NavLink>
        </div>
        <div className="row">
            <div className="col my-3">
                <div className='table-responsive'>
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'name', title: 'Name' },
                            { name: 'created_at', title: 'Date', component: dateFormat }
                        ]}
                        data={linkTrackingReferralData}
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

export default observer(LinkTrackingReferral)
