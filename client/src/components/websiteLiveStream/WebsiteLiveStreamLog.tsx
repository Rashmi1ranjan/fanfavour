import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { Cell } from './../table/Definations'
import moment from 'moment'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWindowClose } from '@fortawesome/free-solid-svg-icons'
import { ActionMeta, ValueType } from 'react-select/src/types'
import _ from 'lodash'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const TableCellDate: React.FC<Cell> = (props) => {
    const date = moment(props.value).format('DD-MM-YYYY hh:mm:ss A')
    return (date)
}

const WebsiteLiveStreamLog: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, WebsiteLiveStreamStore } = rootStore
    const { setWebsiteLiveStreamLog, clearData, isLoading, websiteLiveStream, totalPage, currentPage, totalRows, limit, filter, setVideoStreamUrl, liveStreamUrl, liveStreamUrlMessage } = WebsiteLiveStreamStore
    const [showViewModel, setShowViewModel] = useState(false)
    const changePage = (pageNUM: number) => {
        setWebsiteLiveStreamLog(pageNUM)
    }

    useEffect(() => {
        clearData()
        setWebsiteLiveStreamLog(1)
    }, [clearData, setWebsiteLiveStreamLog])

    const TableCellLink: React.FC<Cell> = (props) => {
        return (<>
            <button
                className='btn btn-primary btn-sm'
                onClick={
                    () => { getStreamUrl(props.value) }
                }
            >View Stream</button>
        </>)
    }

    const TableCellRedirectLink: React.FC<Cell> = (props) => {
        const redirectLink = `https://${props.data.domain}/private-chat/${props.data.user_id}`
        return (<>
            {
                props.data.user_id !== undefined ? <a href={redirectLink} target='_blank' rel='noreferrer'>@{props.value}</a> : <>{props.value}</>
            }
        </>)
    }

    const TableCellAmount: React.FC<Cell> = (data) => {
        const amount = data.value != '' ? `$${data.value}` : '$0.00'
        return (amount)
    }

    const getStreamUrl = (stream_id: string) => {
        setVideoStreamUrl(stream_id)
        setShowViewModel(true)
    }

    const handleEditDialogClose = () => {
        setShowViewModel(false)
    }

    const onDomainChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const selectedValue = _.get(value, 'value', '')
        filter.domain = selectedValue
        setWebsiteLiveStreamLog(1)
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        const timeAgo = moment(data.value).fromNow()
        const timeToShow = `${data.value} (${timeAgo})`
        return (timeToShow)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='card mt-4'>
            <div className='card-header'>
                {isLoading ? 'Loading...' : 'Website Live Stream Log'}
            </div>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-md-3'>
                        <label className='me-2 mb-2'>Domain</label>
                        <Domain
                            onDomainChange={onDomainChange}
                            websiteStore={websiteStore}
                            loading={isLoading}
                            defaultDomain=''
                            multiSelect={false}
                        />
                    </div>
                </div>
                {isLoading ?
                    'Loading..'
                    :
                    <>
                        <div className='table-responsive mt-3'>
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'domain_id', title: 'Id' },
                                    { name: 'domain', title: 'Website' },
                                    { name: 'username', title: 'Username', component: TableCellRedirectLink },
                                    { name: 'tips', title: 'Tips', component: TableCellAmount },
                                    { name: 'pre_tip', title: 'Pre Tip', component: TableCellAmount },
                                    { name: 'stream_start_time', title: 'Stream Start time', component: TableCellTimeAgo },
                                    { name: 'stream_end_time', title: 'Stream End time', component: TableCellDate },
                                    { name: 'duration', title: 'Stream Duration' },
                                    { name: 'max_users', title: 'Max users' },
                                    { name: 'stream_type', title: 'Stream Type' },
                                    { name: 'stream_id', title: 'Stream Video', component: TableCellLink }
                                ]}
                                data={websiteLiveStream}
                            ></Table>
                        </div>
                        {
                            totalPage > 0 ?
                                <Pagination
                                    totalPages={totalPage}
                                    currentPage={currentPage}
                                    totalItems={totalRows}
                                    itemsPerPage={limit}
                                    onItemClick={changePage}
                                ></Pagination>
                                : null
                        }
                    </>
                }
            </div>
        </div>

        {showViewModel ?
            <div className='modal fade show' role='dialog' style={{ display: 'block', backgroundColor: '#00000080' }
            } >
                <div className='modal-dialog modal-dialog-centered modal-lg'>
                    <div className='modal-content'>
                        <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                            <h5 className='modal-title'>Stream Video</h5>
                            <div onClick={() => {
                                handleEditDialogClose()
                            }} style={{ cursor: 'pointer' }}>
                                <FontAwesomeIcon icon={faWindowClose} />
                            </div>
                        </div>
                        <div className='modal-body' style={{ display: 'contents', lineHeight: 'normal' }}>
                            <div className='container'>
                                {
                                    liveStreamUrl != '' ?
                                        <div className='text-center'>
                                            <video controls style={{ maxWidth: '100%' }}>
                                                <source src={liveStreamUrl}></source>
                                            </video>
                                        </div>
                                        :
                                        <div className='text-center' style={{ padding: '15px', fontWeight: 'bold' }}>
                                            {liveStreamUrlMessage}
                                        </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div > : null}
    </Container >
}

export default observer(WebsiteLiveStreamLog)
