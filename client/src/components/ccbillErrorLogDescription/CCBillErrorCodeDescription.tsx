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

const CCBillErrorCodeDescription: React.FC<Props> = ({ rootStore }) => {
    const { ccbillErrorCodeDescriptionStore } = rootStore
    const { setCCBillErrorCodeDescriptionDetails, ccbillErrorCodeDescription, currentPage, totalPage, limit, totalRows } = ccbillErrorCodeDescriptionStore

    useEffect(() => {
        setCCBillErrorCodeDescriptionDetails(1)
    }, [setCCBillErrorCodeDescriptionDetails])

    const changePage = (pageNUM: number) => {
        setCCBillErrorCodeDescriptionDetails(pageNUM)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const Url = '/edit_ccbill_error_code_description/' + jsonData._id
        return (<>
            <NavLink className="link-primary text-underline" to={Url} >Edit</NavLink>
        </>)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className="card mt-4">
            <div className="card-header">
                CCBill Error Description List
                <NavLink className="float-end text-decoration-none" to="/add_ccbill_error_code_description" >Add CCBill Error Description</NavLink>
            </div>
            <div className="card-body">
                <div className='table-responsive' >
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'ccbill_error_code', title: 'ccbill_error_code' },
                            { name: 'description', title: 'description' },
                            { name: 'error_message', title: 'Error Message' },
                            { name: 'action', title: 'Actions', component: tableCellButton }
                        ]}
                        data={ccbillErrorCodeDescription}
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

export default observer(CCBillErrorCodeDescription)
