import React from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import { Cell } from './../table/Definations'
import moment from 'moment'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'
import { ValueType } from 'react-select/src/types'
import _ from 'lodash'
import Select from 'react-select'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const WebsiteStatusCheck: React.FC<Props> = ({ rootStore }) => {
    const { WebsiteStatusStore, websiteStore } = rootStore
    const { setAllWebsites,
        websites,
        isLoading,
        totalOnlineSites,
        totalOfflineSites,
        websiteVersionSummary,
        checkingOnlineStatus,
        filter,
        filterWebsites,
        showWebsiteFilter,
        filteredWebsites } = WebsiteStatusStore

    const getAllWebsites = (e: any) => {
        setAllWebsites()
    }

    const TableCellStatus: React.FC<Cell> = (props) => {
        return (<h5 className='mb-0' style={{ minHeight: '28px' }}>
            {
                props.value === 'Online' ? <span className='badge text-bg-success'>{props.value}</span> : <span className='badge text-bg-danger'>{props.value}</span>
            }
        </h5>)
    }

    const TableCellTimeAgo: React.FC<Cell> = (data) => {
        if (data.value !== '' && data.value !== null) {
            const timeAgo = moment(data.value).fromNow()
            const value = `${data.value} (${timeAgo})`
            return (value)
        } else {
            return (data.value)
        }
    }

    const handleDomainChange = (value: ValueType<OptionType, IsMulti>) => {
        const selectedValue = _.get(value, 'value', '')
        filter.domain = selectedValue
    }

    const handleStatusChange = (value: ValueType<OptionType, false>) => {
        if (value) filter.status = value
    }

    const handleVersion = (version: string) => {
        if (showWebsiteFilter) {
            filter.version = version
            filterWebsites()
        }
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div>
            <h4 className='m-0 d-inline-block'>Check Website Status</h4>
            <button type='button' disabled={checkingOnlineStatus} className='btn btn-sm btn-primary float-end' onClick={getAllWebsites}>Check Online Status</button>
        </div>
        {
            websites.length > 0 &&
            <div className='w-100 d-flex justify-content-between py-3'>
                <div className='col card me-3'>
                    <div className='card-body d-flex flex-column align-items-center justify-content-center'>
                        <h5 className='card-title text-center'>Total Sites</h5>
                        <h1 className='text-center m-0'>{websites.length}</h1>
                    </div>
                </div>
                <div className='col card me-3'>
                    <div className='card-body d-flex flex-column align-items-center justify-content-center'>
                        <h5 className='card-title text-center'>Total Online Sites</h5>
                        <h1 className='text-center text-success m-0'>{totalOnlineSites}</h1>
                    </div>
                </div>
                <div className='col card me-3'>
                    <div className='card-body d-flex flex-column align-items-center justify-content-center'>
                        <h5 className='card-title text-center'>Total Offline Sites</h5>
                        <h1 className='text-center text-danger m-0'>{totalOfflineSites}</h1>
                    </div>
                </div>
                <div className='card col'>
                    <div className='card-body'>
                        <h5 className='card-title text-center'>Website Version Summary</h5>
                        <div className='d-flex flex-wrap justify-content-between'>
                            <table className='table table-sm table-bordered m-0 text-center'>
                                <thead>
                                    <tr>
                                        <th scope='col'>Version</th>
                                        <th scope='col'>Websites</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        websiteVersionSummary.map((value, index) => {
                                            return <tr key={index}>
                                                <td scope='col' role={showWebsiteFilter ? 'button' : 'cell'} className='cursor-pointer' onClick={() => { handleVersion(value.version) }}>{value.version}</td>
                                                <td scope='col'>{value.count}</td>
                                            </tr>
                                        })
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        }
        {
            showWebsiteFilter &&
            <div className='card w-100'>
                <div className='card-body'>
                    <div className='row'>
                        <div className='col-md-3'>
                            <label className='me-2 mb-2'>Website Url</label>
                            <Domain
                                onDomainChange={handleDomainChange}
                                websiteStore={websiteStore}
                                defaultDomain={filter.domain}
                                multiSelect={false}
                            />
                        </div>
                        <div className='col-md-3'>
                            <label className='mb-2'>Website Status</label>
                            <Select
                                value={filter.status}
                                onChange={handleStatusChange}
                                options={[
                                    { label: 'All', value: '' },
                                    { label: 'Online', value: 'Online' },
                                    { label: 'Offline', value: 'Offline' }]}
                                isMulti={false}
                                className='mb-3'
                            />
                        </div>
                        <div className='col-md-3 form-group'>
                            <label htmlFor='webVersion' className='mb-2'>Website Version</label>
                            <input
                                type='text'
                                className='form-control'
                                id='webVersion'
                                value={filter.version}
                                onChange={(e) => { filter.version = e.target.value.trim() }} />
                        </div>
                        <div className='col-md-3 mt-2'>
                            <button
                                className='btn btn-block bg-primary text-light mt-4'
                                onClick={filterWebsites}
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        }
        {
            <div className='table-responsive mt-3'>
                <Table
                    unique_key='_id'
                    columns={[
                        { name: 'website_id', title: 'Id' },
                        { name: 'website_url', title: 'Website Url' },
                        { name: 'status', title: 'Website Status', component: TableCellStatus },
                        { name: 'last_registered_user', title: 'Last User Registered', component: TableCellTimeAgo },
                        { name: 'last_transaction_time', title: 'Last Successful Transaction', component: TableCellTimeAgo },
                        { name: 'version', title: 'Website Version' }
                    ]}
                    data={filteredWebsites ? filteredWebsites : websites}
                    isLoading={isLoading}
                ></Table>
            </div>
        }
    </Container>
}

export default observer(WebsiteStatusCheck)
