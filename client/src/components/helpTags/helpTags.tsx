import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { NavLink } from 'react-router-dom'
import _ from 'lodash'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

interface Props {
    rootStore: RootStore
}

type OptionType = {
    value: string
    label: string
}

const HelpTags: React.FC<Props> = ({ rootStore }) => {
    const { HelpTagsStore } = rootStore
    const { getHelpTagsData, helpTagsData, currentPage, totalPage, limit, totalRows, deleteInfluencerHelpTag } = HelpTagsStore
    const [tagType, setTagType] = useState('')

    useEffect(() => {
        const filter = {
            tagType: tagType
        }
        getHelpTagsData(currentPage, filter)
    }, [])

    const changePage = (pageNUM: number) => {
        const filter = {
            tagType: tagType
        }
        getHelpTagsData(pageNUM, filter)
    }
    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const Url = '/influencer-help-tags/edit/' + jsonData._id
        return (<div style={{ textAlign: 'start' }}>
            <div className='d-inline-flex'>
                <div className='link-primary p-1 text-decoration-underline' style={{ cursor: 'pointer' }}>
                    <NavLink to={Url}>Edit</NavLink>
                </div>
                <div className='link-primary text-decoration-underline p-1' style={{ cursor: 'pointer' }} onClick={() => deleteHelpTag(jsonData._id)}>
                    Delete
                </div>
            </div>
        </div>)
    }

    const typeInfo = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return (<div style={{ textAlign: 'start' }}>
            {jsonData.type === 'for_help' ? 'help' : 'website'}
        </div>)
    }

    const deleteHelpTag = (id: string) => {
        const confirm = window.confirm('Are you sure want to delete this tag?')
        if (confirm === false) {
            return false
        }

        deleteInfluencerHelpTag(id, tagType, (success, message) => {
            if (success === true) {
                toast.success(message)
            } else {
                toast.error(message)
            }
        })
    }

    const statusOption = [
        { label: 'All', value: '' },
        { label: 'Help', value: 'for_help' },
        { label: 'Website', value: 'for_website' }
    ]

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const filter = {
            tagType: e.target.value
        }
        setTagType(e.target.value)
        getHelpTagsData(currentPage, filter)
    }

    const statusOptions = statusOption.map((option: { label: string, value: string }) => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className="row border-bottom py-2">
            <div className='col-md-6'>
                <h4>Help Tags</h4>
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </div>
            <div className='col-md-6'>
                <NavLink className="float-end text-decoration-underline me-3" to="/influencer-help-tags/add" style={{ fontSize: 'larger' }}>Add</NavLink>
            </div>
        </div>
        <div className="card-body px-0">
            <div className='row'>
                {/* <div className='col-md-3'>
                    <label className='mb-2'>Help Status</label>
                    <Select
                        name='status'
                        options={statusOption}
                        onChange={handleChange}
                        defaultValue={selectedStatusOption}
                        className='mb-3'
                    />
                </div> */}
                <div className='col-md-2'>
                    <label className='me-2 mb-2'>Tags Type</label>
                    <select
                        className='form-control form-select'
                        value={tagType}
                        onChange={handleChange}>
                        {statusOptions}
                    </select>
                </div>
            </div>
            <div className='table-responsive mt-3'>
                <Table
                    unique_key='_id'
                    columns={[
                        { name: 'title', title: 'Tag' },
                        { name: 'type', title: 'Help For', component: typeInfo },
                        { name: 'action', title: 'Actions', component: tableCellButton }
                    ]}
                    data={helpTagsData}
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

export default observer(HelpTags)
