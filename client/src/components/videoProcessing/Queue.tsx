import React, { useEffect } from 'react'
import { observer } from 'mobx-react'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import Table from '../table/Table'
import { Cell } from '../table/Definations'
import moment from 'moment'
import styled from 'styled-components'
import _ from 'lodash'

interface Props {
    rootStore: RootStore
}

export const StyledLink = styled.button`
    cursor: pointer;
    float: right;
    text-decoration: underline;
    background: transparent;
    outline: none;
    border: none;
    `

export const TableCellTimeAgo: React.FC<Cell> = (data) => {
    const date = moment(data.value)
    const formattedDate = date.format('DD/MM/YYYY')
    const timeAgo = date.fromNow()
    return (`${formattedDate} (${timeAgo})`)
}

const Queue: React.FC<Props> = ({ rootStore }) => {
    const { VideoProcessingStore } = rootStore
    const { getQueue, data, loading, error } = VideoProcessingStore

    useEffect(() => {
        getQueue()
    }, [])

    const TableCellWebsiteLink = (objData: object) => {
        const website = _.get(objData, 'value', '')
        const url = `https://${website}`
        return (<a href={url} target='_blank' rel='noreferrer'>{website}</a>)
    }

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <div className='d-flex align-items-baseline justify-content-between'>
                <h4 className='card-title'>Video Processing Queue</h4>
                <StyledLink disabled={loading.queue} className={loading.queue ? 'text-muted' : 'text-primary'} onClick={() => { getQueue() }}>Refresh</StyledLink>
            </div>
            {error.queue ?
                <div className='responsive alert alert-danger p-3 my-3 rounded'>
                    {error.queue}
                </div>
                :
                <>
                    <div className='table-responsive mt-3'>
                        <Table
                            unique_key='_id'
                            columns={[
                                { name: 'website_url', title: 'Website', component: TableCellWebsiteLink },
                                { name: 'createdAt', title: 'Time', component: TableCellTimeAgo },
                                { name: 'is_mass_message', title: 'Is mass message' },
                                { name: 'udid', title: 'UDID' },
                                { name: 'video_id', title: 'Video id' }
                            ]}
                            data={data.queue}
                            isLoading={loading.queue}
                        ></Table>
                    </div>
                </>
            }
        </Container>
    )
}

export default observer(Queue)
