import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import Table from '../table/Table'
import { StyledLink, TableCellTimeAgo } from './Queue'
import Pagination from '../table/Pagination'
import _ from 'lodash'
import { faInfoCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import styled from 'styled-components'

interface Props {
    rootStore: RootStore
}

const ModalBody = styled.div`
    max-height: 80vh;
    overflow-y: auto;
`

const Popup = styled.div`
    display: block; 
    background-color: #00000080; 
    overflow: hidden;

    b {
        padding-right: 1rem;
    }

    .pointer {
        cursor: pointer;
    }
`

const Errors: React.FC<Props> = ({ rootStore }) => {

    const { VideoProcessingStore } = rootStore
    const { getErrors, data, loading, error, pagination } = VideoProcessingStore
    const { totalPage, currentPage, totalRows, limit } = pagination.errors
    const [showPopup, setShowPopup] = useState(false)
    const [popupInfo, setPopupInfo] = useState({ videoId: '', error: '' })

    const changePage = (page: number) => {
        getErrors(page)
    }

    const TableCellEventDetails = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))

        if (!jsonData.error) return <></>

        return (<span className='px-1' style={{ cursor: 'pointer' }} onClick={() => {
            setShowPopup(true)
            setPopupInfo({ videoId: jsonData.object_id, error: jsonData.error })
        }}>
            <FontAwesomeIcon icon={faInfoCircle} />
        </span>)
    }

    useEffect(() => {
        getErrors(1)
    }, [])

    const TableCellWebsiteLink = (objData: object) => {
        const website = _.get(objData, 'value', '')
        const url = `https://${website}`
        return (<a href={url} target='_blank' rel='noreferrer'>{website}</a>)
    }

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <div className='d-flex align-items-baseline justify-content-between'>
                <h4 className='card-title'>Video Processing Errors</h4>
                <StyledLink disabled={loading.errors} className={loading.errors ? 'text-muted' : 'text-primary'} onClick={() => { getErrors(1) }}>Refresh</StyledLink>
            </div>
            {error.errors ?
                <div className='responsive alert alert-danger p-3 my-3 rounded'>
                    {error.errors}
                </div>
                :
                <>
                    <div className='table-responsive mt-3'>
                        <Table
                            unique_key='_id'
                            columns={[
                                { name: 'domain', title: 'Domain', component: TableCellWebsiteLink },
                                { name: 'object_id', title: 'Video ID' },
                                { name: 'created_at', title: 'Date', component: TableCellTimeAgo },
                                { name: 'error', title: 'Error Details', component: TableCellEventDetails }
                            ]}
                            data={data.errors}
                            isLoading={loading.errors}
                        ></Table>
                    </div>
                    {
                        !loading.errors &&
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPage}
                            totalItems={totalRows}
                            itemsPerPage={limit}
                            onItemClick={changePage}
                        ></Pagination>
                    }
                </>
            }
            {showPopup &&
                <Popup className='modal fade show'>
                    <div className='modal-dialog modal-lg modal-dialog-centered justify-content-center'>
                        <div className='modal-content'>
                            <div className='modal-header d-flex justify-content-between'>
                                <b style={{ paddingRight: '1rem' }}>Video ID : {popupInfo.videoId}</b>
                                <div style={{ cursor: 'pointer' }} className='p-1 pointer' onClick={() => {
                                    document.body.style.overflow = 'auto'
                                    setShowPopup(false)
                                }}>
                                    <FontAwesomeIcon icon={faXmark} />
                                </div>
                            </div>
                            <ModalBody className='modal-body'>
                                <p><b>Error :</b>&nbsp; {popupInfo.error}</p>
                            </ModalBody>
                        </div>
                    </div>
                </Popup>
            }
        </Container>
    )
}

export default observer(Errors)
