import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import moment from 'moment'
import { Cell } from './../table/Definations'
import { toJS } from 'mobx'
import Button from '../utils/Button'
import { NavLink } from 'react-router-dom'
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

const ApiLimitConfigurationList: React.FC<Props> = ({ rootStore }) => {
    const { ApiLimitConfigurationStore } = rootStore
    const { getApiConfigurationList, filter, apiConfigurationList, currentPage, totalPage, limit, totalRows, isLoading } = ApiLimitConfigurationStore
    useEffect(() => {
        getApiConfigurationList(1)
    }, [getApiConfigurationList])


    const changePage = (pageNum: number) => {
        getApiConfigurationList(pageNum)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value.trim()
        _.set(filter, name, value)
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const timeToShow = `${data.value} (${timeAgo})`
        return (timeToShow)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { _id: string }
        const jsonData = toJS(data)
        const editUrl = `/edit-api-limit-configuration/${jsonData._id}`
        return (<NavLink className="btn btn-sm btn-primary" to={editUrl}>Edit</NavLink>)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='card'>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <div className='row'>
                            <div className='col-md-3 mt-2'>
                                <label className='me-2 mb-2'>API End Point</label>
                                <input
                                    name='api_end_point'
                                    type='text'
                                    className='form-control'
                                    onChange={onChange}
                                />
                            </div>
                            <div className='col-md-3 mt-3'>
                                <Button disabled={isLoading} type='button' title='Apply Filter' classes='btn-primary mt-4' loading={isLoading} onClick={() => getApiConfigurationList(1)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className='card mt-4'>
            <div className='card-header d-flex justify-content-between'>
                API Limit Configuration
                <NavLink className="btn btn-sm btn-primary" to='/add-api-limit-configuration'>Add New API Configuration</NavLink>
            </div>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-md-12'>
                        <div className='table-responsive mt-3'>
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'api_end_point', title: 'API End point' },
                                    { name: 'max_attempt', title: 'Max Attempt' },
                                    { name: 'duration', title: 'Duration (In Minutes)' },
                                    { name: 'createdAt', title: 'Date', component: TableCellTimeAgo },
                                    { name: 'action', title: 'Action', component: tableCellButton }
                                ]}
                                data={apiConfigurationList}
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

export default observer(ApiLimitConfigurationList)
