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

const CCBillErrorDescription: React.FC<Props> = ({ rootStore }) => {
    const { declineCodeDescriptionStore } = rootStore
    const { setDeclineCodeDescriptionDetails, declineCodeDescription, currentPage, totalPage, limit, totalRows } = declineCodeDescriptionStore

    useEffect(() => {
        setDeclineCodeDescriptionDetails(1)
    }, [setDeclineCodeDescriptionDetails])

    const changePage = (pageNUM: number) => {
        setDeclineCodeDescriptionDetails(pageNUM)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const Url = '/edit_decline_code_description/' + jsonData._id
        return (<>
            <NavLink className="link-primary text-underline" to={Url} >Edit</NavLink>
        </>)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className="card mt-4">
            <div className="card-header">
                Decline Code Description List
                <NavLink className="float-end text-decoration-none" to="/add_decline_code_description" >Add Decline Code</NavLink>
            </div>
            <div className="card-body">
                <div className='table-responsive' >
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'decline_code', title: 'Decline code' },
                            { name: 'description', title: 'Description' },
                            { name: 'error_message', title: 'MG Card Error Message' },
                            { name: 'link_to_change_card', title: 'Linked to Change Card Page' },
                            { name: 'link_text', title: 'Link Text for Change Card Page' },
                            { name: 'payment_gateway', title: 'Payment Gateway' },
                            { name: 'action', title: 'Actions', component: tableCellButton }
                        ]}
                        data={declineCodeDescription}
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

export default observer(CCBillErrorDescription)
