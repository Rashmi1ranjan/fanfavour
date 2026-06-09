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

const BlockCodeList: React.FC<Props> = ({ rootStore }) => {
    const { BlockCodeStore } = rootStore
    const { setBlockCodeDetails, BlockCode, currentPage, totalPage, limit, totalRows, isLoading } = BlockCodeStore

    useEffect(() => {
        setBlockCodeDetails(1)
    }, [setBlockCodeDetails])

    const changePage = (pageNUM: number) => {
        setBlockCodeDetails(pageNUM)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const Url = '/edit-block-code/' + jsonData._id
        return (<>
            <NavLink className="link-primary p-0" style={{ textDecoration: 'underline' }} to={Url} >Edit</NavLink>
        </>)
    }

    const codeCell = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return (<>
            {jsonData.code}
        </>)
    }
    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row border-bottom mb-3'>
            <div className='col-md-6'>
                <h4 className='card-title'>Block Code List</h4>
            </div>
            <div className='col-md-6'>
                <NavLink className="float-end" to="/block-code" >Add</NavLink>
            </div>
        </div>
        <div className="mt-4">
            <div className='mb-2'>
                <div className='table-responsive' >
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'code', title: 'Code', component: codeCell },
                            { name: 'message', title: 'Message' },
                            { name: 'action', title: 'Actions', component: tableCellButton }
                        ]}
                        data={BlockCode}
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

export default observer(BlockCodeList)
