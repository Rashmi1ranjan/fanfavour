import React, { useEffect, useState } from 'react'
import Select from 'react-select'
import { observer } from 'mobx-react'
import moment from 'moment'
import RootStore from '../../store/Root'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import Domain from '../layout/Domain'
import _ from 'lodash'
import { ActionMeta, ValueType } from 'react-select/src/types'
import { OptionType, SortConfig } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const InfluencerActivity: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore, InfluencerActivityStore } = rootStore
    const {
        filter,
        isLoading,
        totalPages,
        currentPage,
        totalRows,
        limit,
        influencerActivity,
        getInfluencerActivity
    } = InfluencerActivityStore

    useEffect(() => {
        getInfluencerActivity(1)
    }, [])

    const handleChange = (selectedOption: OptionType) => {
        _.set(filter, 'domain', selectedOption.value)
        getInfluencerActivity(1)
    }

    const changePage = (pageNum: number) => {
        getInfluencerActivity(pageNum)
    }

    const shouldSort = (sortConfig: SortConfig) => {
        _.set(filter, 'sortBy', sortConfig)
        getInfluencerActivity(1)
    }

    const getFormatDate = (objData: { value: string | Date }) => {
        const value = _.get(objData, 'value', '')
        if (_.isEmpty(value)) {
            return <></>
        }
        const date = moment.utc(value).format('YYYY-MM-DD, h:mm A')
        return <>
            {date} (<i className='fa fa-clock-o' />{moment.utc(date).fromNow()})
        </>
    }

    const domainLink = (data: { value: string }) => {
        const redirectLink = `https://${data.value}`
        return (<a href={redirectLink} target="_blank" rel='noreferrer'>{data.value}</a>)
    }

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <h4>Influencer Activity</h4>
            <hr />
            <div className='row'>
                <div className='col-md-4'>
                    <label className='me-2 mb-2'>Domain</label>
                    <Domain
                        onDomainChange={handleChange}
                        websiteStore={websiteStore}
                        loading={isLoading}
                        defaultDomain={filter.domain}
                        multiSelect={false}
                    />
                </div>
            </div>
            <div className='my-4'>
                <Table
                    unique_key='_id'
                    columns={[
                        { name: 'domain', title: 'Domain', sort: true, component: domainLink },
                        { name: 'modal_last_seen', title: 'Modal last seen', sort: true, component: getFormatDate },
                        { name: 'content_manager_last_seen', title: 'Content manager last seen', sort: true, component: getFormatDate },
                        { name: 'date_of_last_blog_added', title: 'Last blog added time', sort: true, component: getFormatDate },
                        { name: 'date_of_last_mass_message', title: 'Last mass message time', sort: true, component: getFormatDate }
                    ]}
                    isLoading={isLoading}
                    data={influencerActivity}
                    shouldSort={shouldSort}
                    defaultSort={filter.sortBy}
                ></Table>
            </div>
            <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                totalItems={totalRows}
                itemsPerPage={limit}
                onItemClick={changePage}
            ></Pagination>
        </Container>
    )

}

export default observer(InfluencerActivity)
