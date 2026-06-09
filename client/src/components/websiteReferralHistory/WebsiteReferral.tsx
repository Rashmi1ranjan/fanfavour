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

const WebsiteReferral: React.FC<Props> = ({ rootStore }) => {
    const { WebsiteReferralStore } = rootStore
    const { getWebsiteReferralData, websiteReferralData, currentPage, totalPage, limit, totalRows } = WebsiteReferralStore

    useEffect(() => {
        getWebsiteReferralData(1)
    }, [])

    const changePage = (pageNUM: number) => {
        getWebsiteReferralData(pageNUM)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const Url = '/edit-referral/' + jsonData._id
        return (<>
            <NavLink className="link-primary text-underline" to={Url} >Edit</NavLink>
        </>)
    }
    const dateFormat = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return <DateFormat date={jsonData.created_at} />
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='d-flex justify-content-between align-items-center'>
            <h4 className="card-title">Website Referral List</h4>
            <NavLink className="float-end text-decoration-none" to="/add-referral" style={{ textAlign: 'right' }} >Add Referral</NavLink>
        </div>
        <div className="row">
            <div className="col my-3">
                <div className='table-responsive' >
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'name', title: 'Name' },
                            { name: 'created_at', title: 'Date', component: dateFormat },
                            { name: 'action', title: 'Actions', component: tableCellButton }
                        ]}
                        data={websiteReferralData}
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

export default observer(WebsiteReferral)
