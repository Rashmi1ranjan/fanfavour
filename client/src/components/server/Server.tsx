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

const Server: React.FC<Props> = ({ rootStore }) => {
    const { serverStore } = rootStore
    const { getServerData, serverData } = serverStore

    useEffect(() => {
        getServerData()
    }, [getServerData])

    const changePage = (pageNUM: number) => {
        getServerData()
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const Url = '/edit_server/' + jsonData._id
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
            <div className="card-header">
                Server List
                <NavLink className="float-end text-decoration-none" to="/add_server" >Add Server</NavLink>
            </div>
            <div className="card-body">
                <div className='table-responsive' >
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'name', title: 'Name' },
                            { name: 'monthly_earning', title: 'Monthly Earning', component: tableCellEarning },
                            { name: 'ip_address', title: 'Ip Address' },
                            { name: 'created_at', title: 'Date' },
                            { name: 'action', title: 'Actions', component: tableCellButton }
                        ]}
                        data={serverData}
                    ></Table>
                </div>
            </div>
        </div>
    </Container>
}

export default observer(Server)
