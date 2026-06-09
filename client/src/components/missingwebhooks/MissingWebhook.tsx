import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { toJS } from 'mobx'
import Loader from '../loader/Loader'
import _ from 'lodash'

interface Props {
    rootStore: RootStore
}

const MissingWebhook: React.FC<Props> = ({ rootStore }) => {
    const { missingWebhookStore } = rootStore
    const { getMissingWebhookData, missingWebhookData, currentPage, totalPage, limit, totalRows, resolveMissingWebhookData, isLoading } = missingWebhookStore

    useEffect(() => {
        getMissingWebhookData(1)
    }, [getMissingWebhookData])

    const changePage = (pageNUM: number) => {
        getMissingWebhookData(pageNUM)
    }

    const tableCellText = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = toJS(data)
        const firstName = _.get(jsonData, 'first_name', '')
        const lastName = _.get(jsonData, 'last_name', '')
        const email = _.get(jsonData, 'email_address', '')
        return (<>
            <span>First Name : {firstName}</span> <br />
            <span>Last Name : {lastName}</span> <br />
            <span>Email : {email}</span>
        </>)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const row = toJS(data)
        const id = _.get(row, '_id', '')
        return (<>
            <button type='button' className="btn btn-primary me-3" onClick={
                () => handleSubmit(id)
            }
            >
                Resolve Webhook
            </button>
        </>)
    }

    const handleSubmit = (id: string) => {
        resolveMissingWebhookData(id)
    }
    const onChange = () => {
        getMissingWebhookData(1)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className="card mt-4">
            <div className="card-header">
                Missing Webhook List
            </div>
            <div className="card-body">
                <div className='row'>
                    <div className='col-12 text-end mt-2 align-self-end'>
                        <button className='btn btn-outline-dark mx-2 mb-4' onClick={onChange}>
                            Refresh
                        </button>
                    </div>
                    <div className='col-12'>
                        {isLoading ?
                            <div className='text-center'>
                                <Loader isLoading={true} color={'#007bff'} />
                            </div>
                            :
                            <>
                                <div className='table-responsive' >
                                    <Table
                                        unique_key='_id'
                                        columns={[
                                            { name: 'user', title: 'User Details', component: tableCellText },
                                            { name: 'website.website_url', title: 'Domain' },
                                            { name: 'subscription_id', title: 'Subscription Id' },
                                            { name: 'client_sub_account', title: 'Client Sub Account' },
                                            { name: 'pcp_transaction_date', title: 'Transaction Date' },
                                            { name: 'action', title: 'Actions', component: tableCellButton }
                                        ]}
                                        data={missingWebhookData}
                                    ></Table>
                                </div>
                                <Pagination
                                    totalPages={totalPage}
                                    currentPage={currentPage}
                                    totalItems={totalRows}
                                    itemsPerPage={limit}
                                    onItemClick={changePage}
                                ></Pagination>
                            </>
                        }
                    </div>
                </div>
            </div>
        </div>
    </Container>
}

export default observer(MissingWebhook)
