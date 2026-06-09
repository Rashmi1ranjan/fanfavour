import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { NavLink } from 'react-router-dom'
import _ from 'lodash'
import Domain from '../layout/Domain'
import moment from 'moment'
import { Cell } from '../table/Definations'
import Button from '../utils/Button'

interface Props {
    rootStore: RootStore
}

const FanFavour: React.FC<Props> = ({ rootStore }) => {
    const { ModelStore, websiteStore } = rootStore
    const {
        getModelData,
        modelData,
        currentPage,
        totalPage,
        limit,
        totalRows,
        isLoading,
        modelFilters
    } = ModelStore

    useEffect(() => {
        getModelData(1, modelFilters)
    }, [getModelData])

    const changePage = (pageNUM: number) => {
        getModelData(pageNUM, modelFilters)
    }

    const handleApplyFilter = () => {
        getModelData(1, modelFilters)
    }

    const websiteLink = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const websiteUrl = jsonData.website_url
        const link = `http://${websiteUrl}`
        return (<>
            <a href={link} target='_blank' rel='noreferrer'>{websiteUrl}</a>
        </>
        )
    }

    const tableCellTimeAgo: React.FC<Cell> = ({ value }) => {
        const timeAgo = moment(value).fromNow()
        const time = moment(value).format('MM/DD/YYYY HH:mm:ss')
        return (<span data-bs-toggle='tooltip' data-bs-placement='top' title={time}>{timeAgo}</span>)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const Url = '/edit-model/' + jsonData._id
        return (
            <>
                <NavLink className='btn btn-outline-primary m-2' to={Url}>
                    Edit
                </NavLink>
                <Button disabled={isLoading} type='submit' title='Remove' classes='btn btn-outline-danger' loading={isLoading} onClick={() => handleRemoveModel(jsonData._id)} />
            </>
        )
    }

    const handleRemoveModel = async (modelId: string) => {
        if (window.confirm('Are you sure you want to remove this website from Fan Favour?')) {
            await ModelStore.removeModel(modelId)
            getModelData(1, modelFilters)
        }
    }

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <div className='row py-2'>
                <div className='col-md-6'>
                    <h4>Fan Favour Model List</h4>
                </div>
                <div className='col-md-6'>
                    <NavLink className='float-end text-decoration-underline me-3' to='/add-model' style={{ fontSize: 'larger' }}>Add Model</NavLink>
                    <NavLink className='float-end text-decoration-underline me-3' to='/change-featured-model-text' style={{ fontSize: 'larger' }}>Change Featured Model Text</NavLink>
                </div>
            </div>
            <div className='card'>
                <div className='card-body'>
                    <form>
                        <div className='row'>
                            <div className='col-3'>
                                <label className='me-2 mb-2'>Domain</label>
                                <Domain
                                    onDomainChange={(e) => { modelFilters.website_url = e.value }}
                                    websiteStore={websiteStore}
                                    loading={isLoading}
                                    defaultDomain={modelFilters.website_url}
                                    multiSelect={false}
                                />
                            </div>
                            <div className='col-3'>
                                <button type='button'
                                    className='btn btn-primary mt-4'
                                    onClick={handleApplyFilter}
                                    disabled={isLoading}>
                                    {isLoading === true &&
                                        <span className='spinner-border spinner-border-sm me-1' role='status' aria-hidden='true'></span>}
                                    Apply Filter</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div className='my-4'>
                <div className='table-responsive mt-3' >
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'display_order', title: 'Display Order' },
                            { name: 'website_url', title: 'Website Url', component: websiteLink },
                            { name: 'model_name', title: 'Model Name' },
                            { name: 'likes', title: 'Likes' },
                            { name: 'is_featured_model', title: 'Featured Model' },
                            { name: 'action', title: 'Actions', component: tableCellButton }
                        ]}
                        data={modelData}
                        isLoading={isLoading}
                    ></Table>
                </div>
                {modelData.length > 0 && !isLoading ? (
                    <Pagination
                        totalPages={totalPage}
                        currentPage={currentPage}
                        totalItems={totalRows}
                        itemsPerPage={limit}
                        onItemClick={changePage}
                    ></Pagination>
                ) : null}
            </div>
        </Container >
    )
}

export default observer(FanFavour)
