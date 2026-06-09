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

const CCBillRestApiErrorCodeDescription: React.FC<Props> = ({ rootStore }) => {
    const { CCBillRestApiErrorCodeDescriptionStore } = rootStore
    const { setCCBillRestApiErrorCodeDescriptionDetails, ccbillRestApiErrorCodeDescription, currentPage, totalPage, limit, totalRows } = CCBillRestApiErrorCodeDescriptionStore

    useEffect(() => {
        setCCBillRestApiErrorCodeDescriptionDetails(1)
    }, [setCCBillRestApiErrorCodeDescriptionDetails])

    const changePage = (pageNUM: number) => {
        setCCBillRestApiErrorCodeDescriptionDetails(pageNUM)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const Url = '/edit_ccbill_rest_api_error_code_description/' + jsonData._id
        return (<>
            <NavLink className="link-primary text-underline" to={Url} >Edit</NavLink>
        </>)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className="card mt-4">
            <div className="card-header">
                CCBill Rest Api Error Description List
                <NavLink className="float-end text-decoration-none" to="/add_ccbill_rest_api_error_code_description" >Add CCBill Rest Api Error Description</NavLink>
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
                        data={ccbillRestApiErrorCodeDescription}
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

export default observer(CCBillRestApiErrorCodeDescription)
