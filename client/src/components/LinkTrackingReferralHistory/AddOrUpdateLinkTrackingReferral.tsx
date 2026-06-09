import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useNavigate } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import _ from 'lodash'

interface Props {
    rootStore: RootStore
}

const AddOrUpdateLinkTrackingReferral: React.FC<Props> = ({ rootStore }) => {
    const { LinkTrackingReferralStore } = rootStore
    const { setLinkTrackingReferralData, clearLinkTrackingReferralData, getLinkTrackingReferralDataById, editLinkTrackingReferralData, isLoading } = LinkTrackingReferralStore
    const currentRoute = window.location.pathname.split('/')
    const id = currentRoute[currentRoute.length - 1]
    const history = useNavigate()

    useEffect(() => {
        clearLinkTrackingReferralData()
        if (id !== 'add-link-tracking-referral') {
            getLinkTrackingReferralDataById(id)
        }
    }, [])

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        const referralName = _.get(editLinkTrackingReferralData, 'name', '').trim()
        const email = _.get(editLinkTrackingReferralData, 'email', '').trim().toLowerCase()
        const password = _.get(editLinkTrackingReferralData, 'password', '').trim()

        if (!referralName) {
            alert('Please fill data')
            return
        }

        const isValidName = /^[a-zA-Z0-9 _]+$/.test(referralName)
        if (!isValidName) {
            alert('Referral name is not valid. Only alphanumeric characters, spaces, and underscores are allowed.')
            return
        }

        // ensure trimmed name is set before submission
        editLinkTrackingReferralData.name = referralName

        try {
            await setLinkTrackingReferralData((success: boolean) => {
                if (success) {
                    history('/link-tracking-referral')
                }
            })
        } catch (error: any) {
            console.error('Error submitting referral data:', error)
            alert(error?.message || 'Something went wrong while submitting data.')
        }
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row'>
            <div className='col-md-6'>
                <div className='card'>
                    <div className="card-header"> {id !== 'add-link-tracking-referral' ? 'Edit' : 'Add'} Referral
                        <NavLink className="float-end text-decoration-none" to="/link-tracking-referral" style={{ textAlign: 'right' }} >Cancel</NavLink>
                    </div>
                    <div className="card-body">
                        <form autoComplete='off'>
                            <div className='form-group'>
                                <label className='mt-2 mb-2' htmlFor='referral_name'>Referral Name</label>
                                <input
                                    name='referral_name'
                                    type='text'
                                    className='form-control mb-3'
                                    placeholder='Referral Name'
                                    disabled={isLoading}
                                    value={editLinkTrackingReferralData.name}
                                    autoComplete='off'
                                    onChange={(e) => {
                                        editLinkTrackingReferralData.name = e.target.value
                                    }}
                                    required={true}
                                />
                            </div>
                            <button type='submit' className="btn btn-primary mt-2" disabled={isLoading} onClick={handleSubmit}>
                                {id !== 'add-link-tracking-referral' ? 'Update' : 'Add'} Referral
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </Container >
}

export default observer(AddOrUpdateLinkTrackingReferral)
