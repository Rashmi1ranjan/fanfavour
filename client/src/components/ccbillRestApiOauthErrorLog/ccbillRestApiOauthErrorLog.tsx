import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import Table from '../table/Table'
import { ActionMeta, ValueType } from 'react-select/src/types'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { Cell } from './../table/Definations'
import moment from 'moment'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faWindowClose } from '@fortawesome/free-solid-svg-icons'
import Domain from '../layout/Domain'
import { CCBillCardOauthErrorDetail, OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

const CCBillRestApiOauthErrorLog: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, CCBillRestApiOauthErrorLogStore } = rootStore
    const [selectedWebsite, setSelectedWebsite] = useState<string>('')
    const [userId, setUserId] = useState<string>('')
    const [email, setUserEmail] = useState<string>('')
    const [isProcessed, setIsProcessed] = useState<string>('false')
    const [logDetail, setLogDetail] = useState<CCBillCardOauthErrorDetail>()
    const [showViewModel, setShowViewModel] = useState(false)

    const filter = {
        domain: selectedWebsite,
        email: email,
        user_id: userId,
        is_processed: isProcessed
    }
    const { logList, totalPage, isLoading, currentPage, totalRows, getOauthErrorLog } = CCBillRestApiOauthErrorLogStore

    const changePage = (pageNUM: number) => {
        getOauthErrorLog(pageNUM, filter)
    }

    useEffect(() => {
        getOauthErrorLog(1, filter)
    }, [getOauthErrorLog])

    const handleChange = (value: ValueType<OptionType, false>, action: ActionMeta<OptionType>) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')
        if (name === 'domain') {
            filter.domain = selectedValue
        }
        setSelectedWebsite(selectedValue)
        getOauthErrorLog(1, filter)
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value
        if (name === 'user_id') {
            filter.user_id = value
            setUserId(value)
        }
        if (name === 'email') {
            filter.email = value
            setUserEmail(value)
        }
        if (name === 'is_processed') {
            filter.is_processed = value
            setIsProcessed(value)
        }
        getOauthErrorLog(1, filter)
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const timeToShow = `${data.value} (${timeAgo})`
        return (timeToShow)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return (<>
            <div onClick={() => {
                viewDetail(jsonData)
            }}>
                <FontAwesomeIcon icon={faInfoCircle} />
            </div>
        </>)
    }

    const viewDetail = (jsonData: CCBillCardOauthErrorDetail) => {
        setLogDetail(jsonData)
        setShowViewModel(true)
    }

    const handleEditDialogClose = () => {
        setLogDetail(undefined)
        setShowViewModel(false)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='card mt-4'>
            <div className='card-header'>CCBill Rest API Oauth Error Logs</div>
            <div className='card-body'>
                <form>
                    <div className='row'>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Domain</label>
                            <Domain
                                onDomainChange={handleChange}
                                websiteStore={websiteStore}
                                loading={isLoading}
                                defaultDomain={selectedWebsite}
                                multiSelect={false}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Email</label>
                            <input
                                name='email'
                                type='text'
                                className='form-control mb-3'
                                onChange={onChange}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>User Id</label>
                            <input
                                name='user_id'
                                type='text'
                                className='form-control mb-3'
                                onChange={onChange}
                            />
                        </div>
                    </div>
                </form>
                {isLoading ?
                    'Loading..'
                    :
                    <>
                        <div className='table-responsive mt-3'>
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'domain', title: 'Domain' },
                                    { name: 'user_id', title: 'User Id' },
                                    { name: 'email', title: 'Email' },
                                    { name: 'ccbill_error_message', title: 'CCbill Error Message' },
                                    { name: 'ccbill_error_code', title: 'CCbill Error Code' },
                                    { name: 'ccbill_url', title: 'CCBill Url' },
                                    { name: 'createdAt', title: 'Date', component: TableCellTimeAgo },
                                    { name: '_id', title: 'Action', component: tableCellButton }
                                ]}
                                data={logList}
                            ></Table>
                        </div>
                        <Pagination
                            totalPages={totalPage}
                            currentPage={currentPage}
                            totalItems={totalRows}
                            itemsPerPage={20}
                            onItemClick={changePage}
                        ></Pagination>
                    </>
                }
            </div>
        </div>
        {showViewModel &&
            <div className='modal fade show' role='dialog' style={{ display: 'block', backgroundColor: '#00000080' }
            } >
                <div className='modal-dialog modal-dialog-centered modal-lg'>
                    <div className='modal-content'>
                        <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                            <h5 className='modal-title'>CCBill Rest Api Log Detail</h5>
                            <div onClick={handleEditDialogClose} style={{ cursor: 'pointer' }}>
                                <FontAwesomeIcon icon={faWindowClose} />
                            </div>
                        </div>
                        <div className='modal-body' style={{ display: 'contents', lineHeight: 'normal' }}>
                            <div className='container'>
                                <div className='row mt-3'>
                                    <div className='col-md-4'>domain:</div>
                                    <div className='col-md-8'>{logDetail?.domain}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>User id:</div>
                                    <div className='col-md-8'>{logDetail?.user_id}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Email:</div>
                                    <div className='col-md-8'>{logDetail?.email}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>Url:</div>
                                    <div className='col-md-8'>{logDetail?.ccbill_url}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>response:</div>
                                    <div className='col-md-8'>
                                        <span className={'text-break'}>
                                            {JSON.stringify(logDetail?.ccbill_response)}
                                        </span>
                                    </div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>CCBill error code:</div>
                                    <div className='col-md-8'>{logDetail?.ccbill_error_code}</div>
                                </div>
                                <hr />
                                <div className='row'>
                                    <div className='col-md-4'>CCBill Error Message:</div>
                                    <div className='col-md-8'>{logDetail?.ccbill_error_message}</div>
                                </div>
                                <hr />
                            </div>
                        </div>
                    </div>
                </div>
            </div>}
    </Container>
}

export default observer(CCBillRestApiOauthErrorLog)
