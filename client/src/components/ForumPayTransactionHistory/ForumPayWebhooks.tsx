import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import moment from 'moment'
import { Cell } from './../table/Definations'
import { ToastContainer } from 'react-toastify'
import { v4 as uuid } from 'uuid'

interface Props {
    rootStore: RootStore
}

const ForumPayWebhooks: React.FC<Props> = ({ rootStore }) => {
    const { ForumPayWebhookStore } = rootStore
    const { getForumPayWebhooksList, filter, forumPayWebhookData, currentPage, totalPage, limit, totalRows, isLoading } = ForumPayWebhookStore

    useEffect(() => {
        getForumPayWebhooksList(1)
    }, [getForumPayWebhooksList])

    const changePage = (pageNum: number) => {
        getForumPayWebhooksList(pageNum)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value.trim()
        _.set(filter, name, value)
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const dateFormat = moment(data.value).format('MM/DD/YYYY')
        const timeToShow = `${dateFormat} (${timeAgo})`
        return (timeToShow)
    }

    const filterRecords = () => {
        getForumPayWebhooksList(1)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4>
            Forum Pay Webhooks
        </h4>
        <div className='card mt-4'>
            <div className='card-body'>
                <form>
                    <div className='row'>
                        <div className='col-md-3 mt-2'>
                            <label className='me-2 mb-2'>PCP Transaction Id</label>
                            <input
                                name='pcp_transaction_id'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                                value={filter.pcp_transaction_id}
                            />
                        </div>
                        <div className='col-md-3 mt-2'>
                            <label className='me-2 mb-2'>Payment Transaction Id</label>
                            <input
                                name='transaction_id'
                                type='text'
                                className='form-control'
                                onChange={onChange}
                                value={filter.transaction_id}
                            />
                        </div>
                        <div className='col-md-3 mt-3'>
                            <button type="button"
                                className="btn btn-primary mt-4"
                                onClick={filterRecords}
                                disabled={isLoading}>
                                {isLoading === true &&
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                                Apply Filter</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <div className='mt-4 mb-4'>
            <ToastContainer
                position='top-right'
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            <div className='table-responsive mt-3'>
                <Table
                    unique_key={uuid()}
                    columns={[
                        { name: 'body.currency', title: 'Currency' },
                        { name: 'body.payment_id', title: 'Payment Transaction Id' },
                        { name: 'body.address', title: 'Address' },
                        { name: 'body.pos_id', title: 'Pos Id' },
                        { name: 'body.reference_no', title: 'PCP Transaction Id' },
                        { name: 'is_processed', title: 'is_processed' },
                        { name: 'created_at', title: 'Date', component: TableCellTimeAgo }
                    ]}
                    data={forumPayWebhookData}
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
    </Container>
}

export default observer(ForumPayWebhooks)
