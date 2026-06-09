import React, { useEffect } from 'react'
import Select from 'react-select'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useNavigate, useParams } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import _ from 'lodash'

interface Props {
    rootStore: RootStore
}

const AddOrUpdateUser: React.FC<Props> = ({ rootStore }) => {
    const { LinkTrackingReferralStore } = rootStore
    const {
        saveReferralLinkUserData,
        clearLinkTrackingReferralUserData,
        getLinkTrackingReferralUserDataById,
        editLinkTrackingReferralUserData,
        isLoading,
        getAllLinkTrackingReferralWebsiteOptions,
        allLinkTrackingReferralOptions,
        updateReferralLinkUserData
    } = LinkTrackingReferralStore
    const { id } = useParams()
    const history = useNavigate()

    useEffect(() => {
        getAllLinkTrackingReferralWebsiteOptions()
        clearLinkTrackingReferralUserData()
        if (id !== undefined) {
            getLinkTrackingReferralUserDataById(id)
        }
    }, [])

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        const name = _.get(editLinkTrackingReferralUserData, 'name', '').trim()
        const email = _.get(editLinkTrackingReferralUserData, 'email', '').trim().toLowerCase()
        const password = _.get(editLinkTrackingReferralUserData, 'password', '').trim()

        if (_.isEmpty(editLinkTrackingReferralUserData.referral_links)) {
            alert('Please select at least one referral link.')
            return
        }

        if (!email) {
            alert('Please enter an email address.')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address.')
            return
        }

        if (id === undefined) {
            if (!password) {
                alert('Please enter a password.')
                return
            }

            if (password.length < 6) {
                alert('Password must be at least 6 characters long.')
                return
            }
        }

        // ensure trimmed name is set before submission
        editLinkTrackingReferralUserData.name = name

        // Normalize referral_links to be an array of IDs
        const normalizedReferralLinks = editLinkTrackingReferralUserData.referral_links.map((link: any) => {
            return (typeof link === 'object' && link !== null) ? link._id : link
        })
        editLinkTrackingReferralUserData.referral_links = normalizedReferralLinks

        try {
            if (id === undefined) {
                await saveReferralLinkUserData((success: boolean) => {
                    if (success) {
                        history('/link-tracking-users')
                    }
                })
            } else {
                await updateReferralLinkUserData((success: boolean) => {
                    if (success) {
                        history('/link-tracking-users')
                    }
                })
            }
        } catch (error: any) {
            console.error('Error submitting data:', error)
            alert(error?.message || 'Something went wrong while submitting data.')
        }
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row'>
            <div className='col-md-6'>
                <div className='card'>
                    <div className="card-header"> {id !== undefined ? 'Edit' : 'Add'} User
                        <NavLink className="float-end text-decoration-none" to="/link-tracking-users" style={{ textAlign: 'right' }} >Cancel</NavLink>
                    </div>
                    <div className="card-body">
                        <form autoComplete='off'>
                            <div className='form-group'>
                                <label className='mt-2 mb-2' htmlFor='name'>Referral Links</label>
                                <Select
                                    isMulti
                                    name="referral_links"
                                    options={allLinkTrackingReferralOptions.map((item: any) => ({ label: item.name, value: item._id }))}
                                    className="basic-multi-select mb-3"
                                    classNamePrefix="select"
                                    value={allLinkTrackingReferralOptions
                                        .map((item: any) => ({ label: item.name, value: item._id }))
                                        .filter((option: any) => {
                                            return editLinkTrackingReferralUserData.referral_links.some((link: any) => {
                                                const linkId = (typeof link === 'object' && link !== null) ? link._id : link
                                                return linkId === option.value
                                            })
                                        })
                                    }
                                    onChange={(selectedOption: any) => {
                                        editLinkTrackingReferralUserData.referral_links = selectedOption ? selectedOption.map((item: any) => item.value) : []
                                    }}
                                />
                                <label className='mt-2 mb-2' htmlFor='name'>Name</label>
                                <input
                                    name='name'
                                    type='text'
                                    className='form-control mb-3'
                                    placeholder='Name'
                                    disabled={isLoading}
                                    value={editLinkTrackingReferralUserData.name}
                                    autoComplete='off'
                                    onChange={(e) => {
                                        editLinkTrackingReferralUserData.name = e.target.value
                                    }}
                                />
                                <label className='mt-2 mb-2' htmlFor='email'>Email</label>
                                <input
                                    name='email'
                                    type='email'
                                    className='form-control mb-3'
                                    placeholder='Email'
                                    disabled={isLoading}
                                    value={editLinkTrackingReferralUserData.email}
                                    autoComplete='off'
                                    onChange={(e) => {
                                        editLinkTrackingReferralUserData.email = e.target.value
                                    }}
                                />
                                <label className='mt-2 mb-2' htmlFor='password'>Password</label>
                                <input
                                    name='password'
                                    type='password'
                                    className='form-control mb-3'
                                    placeholder='Password'
                                    disabled={isLoading}
                                    value={editLinkTrackingReferralUserData.password}
                                    autoComplete='off'
                                    onChange={(e) => {
                                        editLinkTrackingReferralUserData.password = e.target.value
                                    }}
                                />
                            </div>
                            <button type='submit' className="btn btn-primary mt-2" disabled={isLoading} onClick={handleSubmit} >
                                {id !== 'add-user' ? 'Update' : 'Add'} User
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </Container >
}

export default observer(AddOrUpdateUser)
