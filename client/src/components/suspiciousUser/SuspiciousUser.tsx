import React, { useEffect, useState } from 'react'

import RootStore from '../../store/Root'
import Container from '../layout/Container'
import { observer } from 'mobx-react'
import Table from '../table/Table'
import { ActionMeta, ValueType } from 'react-select/src/types'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { faWindowClose } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { toJS } from 'mobx'
import 'react-date-range/dist/styles.css'
import styled from 'styled-components'
import Domain from '../layout/Domain'
import { domain } from 'process'
import { OptionType, TipInfo } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const Loader = styled.div`
    position: absolute
    top: 0
    bottom: 0
    left: 0
    right: 0
    z-index: 9
    display: flex
    justify-content: center
    align-items: center
    background: rgba(255, 255, 255, 0.8)
`

const SuspiciousUser: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, SuspiciousUserStore } = rootStore
    const { getSuspiciousUser, setSuspiciousUserNotes, suspiciousUserNotes, userList, totalPage, currentPage, totalRows, filter, limit } = SuspiciousUserStore
    const [isLoading, setIsLoading] = useState(true)
    const [showModel, setShowModel] = useState(false)

    useEffect(() => {
        setIsLoading(true)
        getSuspiciousUser(1, () => {
            setIsLoading(false)
        })
    }, [getSuspiciousUser])

    const changePage = (pageNum: number) => {
        setIsLoading(true)
        getSuspiciousUser(pageNum, () => {
            setIsLoading(false)
        })
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value
        if (name === 'user_id') {
            filter.user_id = value
        }
    }

    const handleChange = (
        value: ValueType<OptionType, IsMulti>,
        action: ActionMeta<OptionType>
    ) => {
        const name = action.name
        const selectedValue = _.get(value, 'value', '')
        if (name === 'domain') {
            filter.domain = selectedValue
        }
    }

    const TableCellUserInfo = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { website_url: string, user_id: string, email: string }
        const jsonData = toJS(data)
        const websiteUrl = (/(http(s?)):\/\//i.test(jsonData.website_url)) === true ? jsonData.website_url : `https://${jsonData.website_url}`
        const userCardListLink = `${websiteUrl}/admin/user-card-list?user_id=${jsonData.user_id}`
        return (
            <>
                <a href={userCardListLink} target='_blank' rel='noreferrer'>{jsonData.user_id}</a> <br />
                {jsonData.email}<br />
            </>
        )
    }

    const TableNoteInfo = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { notes: [] }
        const jsonData = toJS(data)
        const lastTip = jsonData.notes[jsonData.notes.length - 1]
        const totalTip = jsonData.notes[jsonData.notes.length - 2]
        return (
            <>
                <>{totalTip}</>
                <br />
                <>{lastTip}</>
                <br />
                {jsonData.notes.length > 2 ?
                    <div style={{ color: '#0d6efd', cursor: 'pointer' }} onClick={() => { viewDetail(jsonData) }}>View Older Notes</div> : null
                }
            </>
        )
    }

    const handlechangeDomain = (domainName: string) => {
        filter.domain = domainName
        getSuspiciousUser(1, () => {
            setIsLoading(false)
        })
    }

    const viewDetail = (data: TipInfo) => {
        setSuspiciousUserNotes(data)
        setShowModel(true)
    }

    const TableCellAmount = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { tip_amount: number }
        const jsonData = toJS(data)
        return <>${jsonData.tip_amount.toFixed(2)}</>
    }

    const TableCellMessageCount = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { type: string, user_message_count: number, model_message_count: number, total_user_message_count: number, total_model_message_count: number }
        const jsonData = toJS(data)
        if (jsonData.type === 'tip') {
            return <>
                <div><strong>Last 7 days: </strong>{jsonData.user_message_count} / {jsonData.model_message_count}</div>
                <div><strong>Lifetime: </strong>{jsonData.total_user_message_count} / {jsonData.total_model_message_count}</div>
            </>
        }
        return <></>
    }

    const tableCellDomainLink = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { website_url: string }
        const jsonData = toJS(data)
        return <div style={{ cursor: 'pointer', color: '#0d6efd' }} onClick={() => handlechangeDomain(jsonData.website_url)}>{jsonData.website_url}</div>
    }

    const tableCellUserChatLink = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { website_url: string, user_id: string, name: string }
        const jsonData = toJS(data)
        const websiteUrl = (/(http(s?)):\/\//i.test(jsonData.website_url)) === true ? jsonData.website_url : `https://${jsonData.website_url}`
        const url = `${websiteUrl}/private-chat/${jsonData.user_id}`
        return <a href={url} target='_blank' rel='noreferrer'>{jsonData.name}</a>
    }
    const TableCellType = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { type: string }
        const jsonData = toJS(data)
        return <div style={{ textTransform: 'capitalize' }}>{jsonData.type}</div>
    }

    const handleFilter = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        getSuspiciousUser(1, (success: boolean, message: string) => {
            setIsLoading(false)
            if (success === false) {
                toast.error(message)
                setTimeout('', 3000)
            }
        })
        setIsLoading(true)
        getSuspiciousUser(1, () => {
            setIsLoading(false)
        })
    }

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <div className='card mt-4'>
                <div className='card-header'>Suspicious User</div>
                <div className='card-body'>
                    <div className='row'>
                        <div className='col-12'>
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
                            <form>
                                <div className='row'>
                                    <div className='col-md-3'>
                                        <label className='me-2 mb-2'>Domain</label>
                                        <Domain
                                            onDomainChange={handleChange}
                                            websiteStore={websiteStore}
                                            loading={isLoading}
                                            defaultDomain={filter.domain}
                                            multiSelect={false}
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
                                    <div className='col-md-3 mt-4'>
                                        <button
                                            className='btn btn-block bg-primary text-light mb-1 me-3 mt-2'
                                            onClick={(e) => handleFilter(e)}
                                            disabled={isLoading}
                                        >
                                            Apply Filter
                                        </button>
                                    </div>
                                </div>
                            </form>
                            <div className='col-12 card-body px-0'>
                                {isLoading === true ? (
                                    <Loader>
                                        <div className='spinner-border' role='status'>
                                            <span className='sr-only'>Loading...</span>
                                        </div>
                                    </Loader>
                                ) : (
                                    <div className='table-responsive mt-3'>
                                        <Table
                                            unique_key='_id'
                                            columns={[
                                                { name: 'website_url', title: 'Domain', component: tableCellDomainLink },
                                                {
                                                    name: 'user_id',
                                                    title: 'User Id, Email',
                                                    component: TableCellUserInfo
                                                },
                                                { name: 'name', title: 'Name', component: tableCellUserChatLink },
                                                { name: 'type', title: 'Type', component: TableCellType },
                                                { name: 'count', title: 'Count' },
                                                { name: 'model_message_count', title: 'Message Interaction (user / model)', component: TableCellMessageCount },
                                                {
                                                    name: 'tip_amount',
                                                    title: 'Tip Amount',
                                                    component: TableCellAmount
                                                },
                                                {
                                                    name: 'notes',
                                                    title: 'Notes',
                                                    component: TableNoteInfo
                                                }
                                            ]}
                                            data={userList}
                                        ></Table>
                                    </div>
                                )}
                                {totalRows > 0 && isLoading == false && (
                                    <Pagination
                                        totalPages={totalPage}
                                        currentPage={currentPage}
                                        totalItems={totalRows}
                                        itemsPerPage={limit}
                                        isLoading={isLoading}
                                        onItemClick={changePage}
                                    ></Pagination>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showModel ?
                <div className='modal fade show' role='dialog' style={{ display: 'block', backgroundColor: '#00000080' }}>
                    <div className='modal-dialog modal-dialog-scrollable modal-lg'>
                        <div className='modal-content'>
                            <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                                <h5 className='modal-title'>Notes</h5>
                                <div onClick={() => setShowModel(false)} style={{ cursor: 'pointer' }}>
                                    <FontAwesomeIcon icon={faWindowClose} />
                                </div>
                            </div>
                            <div className='modal-body'>
                                {(suspiciousUserNotes.notes !== undefined) ?
                                    suspiciousUserNotes.notes.slice().reverse().map((note: string, index: number) => {
                                        return <table className='table table-sm table-bordered table-hover' key={index}>
                                            <div>
                                                <div className='mb-0'>{note}</div>
                                            </div>

                                        </table>
                                    }) : null
                                }
                            </div>
                        </div>
                    </div>
                </div > : null}
        </Container>
    )
}

export default observer(SuspiciousUser)
