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

const Database: React.FC<Props> = ({ rootStore }) => {
    const { databaseStore } = rootStore
    const { getDatabaseData, databaseData, currentPage, totalPage, limit, totalRows } = databaseStore

    useEffect(() => {
        getDatabaseData(1)
    }, [getDatabaseData])

    const changePage = (pageNUM: number) => {
        getDatabaseData(pageNUM)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const Url = '/edit_database/' + jsonData._id
        return (<>
            <NavLink className="link-primary text-underline" to={Url} >Edit</NavLink>
        </>)
    }

    const tableCellEarning = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const earning = jsonData.monthly_earning ? Number(jsonData.monthly_earning).toFixed(2) : '0.00'
        return (<>${earning}</>)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className="card mt-4">
            <div className="card-header">Database List
                <NavLink className="float-end text-decoration-none" to="/add_database" >Add Database</NavLink>
            </div>
            <div className="card-body">
                <div className='table-responsive' >
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'name', title: 'Name' },
                            { name: 'monthly_earning', title: 'Monthly Earning', component: tableCellEarning },
                            { name: 'created_at', title: 'Date' },
                            { name: 'action', title: 'Actions', component: tableCellButton }
                        ]}
                        data={databaseData}
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

export default observer(Database)
