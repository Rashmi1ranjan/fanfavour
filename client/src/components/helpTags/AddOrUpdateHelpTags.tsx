import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useNavigate } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import _ from 'lodash'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Select from 'react-select'

interface Props {
    rootStore: RootStore
}

const AddOrUpdateHelpTags: React.FC<Props> = ({ rootStore }) => {
    const { HelpTagsStore } = rootStore

    const {
        isLoading,
        getHelpTagDataById,
        editHelpTagsData,
        setHelpTag,
        clearData
    } = HelpTagsStore
    const currentRoute = window.location.pathname.split('/')
    const id = currentRoute[currentRoute.length - 1]
    const history = useNavigate()
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [isLoader, setIsLoader] = useState(true)
    const [isApiCall, setIsApiCall] = useState(false)

    useEffect(() => {
        if (isDataLoading === true) {
            clearData()
            if (id === 'add') {
                setIsDataLoading(false)
            } else if (isDataLoading === true) {
                setIsDataLoading(false)
                getHelpTagDataById(id, (success: boolean) => {
                    if (success) {
                        setIsLoader(false)
                    }
                })
            }
        }
    }, [id, isLoading, isDataLoading])

    const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        if (_.isEmpty(editHelpTagsData.title.trim())) {
            return toast.error('Title should not be Empty.')
        }
        setIsApiCall(true)
        setHelpTag((success: boolean, message: string) => {
            if (success === true) {
                toast.success(message)
                setTimeout(redirect, 3000)
            } else {
                toast.error(message)
            }
            setIsApiCall(false)
        })
    }

    const redirect = () => {
        clearTimeout(3000)
        history('/influencer-help-tags')
    }

    if (isDataLoading) {
        return <>Loading</>
    }

    const typeOptions = [
        { label: 'Help', value: 'for_help' },
        { label: 'Website', value: 'for_website' }
    ]

    const selectTypeOptions = typeOptions.map(option => (
        <option key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row'>
            <div className='col-md-12'>
                <div className="row border-bottom py-2">
                    <div className='col-6'>
                        <h4>{id !== 'add' ? 'Edit' : 'Add'} Tag</h4>
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
                    <div className='col-6'>
                        <NavLink className="float-end text-decoration-underline me-3" to="/influencer-help-tags" style={{ fontSize: 'larger' }}>Back</NavLink>
                    </div>
                </div>
                <div className='row'>
                    <div className='col-md-8'>
                        <div className="card-body px-3 px-md-0">
                            <div className='form-group'>
                                <label>Tag</label>
                                <input
                                    name='title'
                                    type='text'
                                    className='form-control'
                                    value={editHelpTagsData.title}
                                    onChange={(e) => {
                                        editHelpTagsData.title = e.target.value
                                    }}
                                />
                            </div>
                            <div className='form-group'>
                                <label className='mb-2 mt-2'>For</label>
                                <select
                                    className='form-control form-select mb-3'
                                    id='referral_type'
                                    name='referral_type'
                                    value={editHelpTagsData.type}
                                    onChange={(e) => {
                                        editHelpTagsData.type = e.target.value
                                    }}>
                                    {selectTypeOptions}
                                </select>
                            </div>
                            <button type='button' className="btn btn-primary mt-3" onClick={(e) => {
                                handleSubmit(e)
                            }}
                            disabled={isApiCall}
                            >
                                {id !== 'add' ? 'Update' : 'Add'}
                            </button>

                            <button type='button' className="btn btn-danger mt-3" style={{ marginLeft: '1%' }} onClick={(e) => {
                                history('/influencer-help-tags')
                            }}
                            disabled={isApiCall}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Container>
}

export default observer(AddOrUpdateHelpTags)
