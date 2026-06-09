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

const AddOrUpdateWebsiteReferral: React.FC<Props> = ({ rootStore }) => {
    const { WebsiteReferralStore } = rootStore
    const { setWebsiteReferralData, clearWebsiteReferralData, getWebsiteReferralDataById, editWebsiteReferralData, isLoading } = WebsiteReferralStore
    const currentRoute = window.location.pathname.split('/')
    const id = currentRoute[currentRoute.length - 1]
    const history = useNavigate()

    useEffect(() => {
        clearWebsiteReferralData()
        if (id !== 'add-referral') {
            getWebsiteReferralDataById(id)
        }
    }, [])

    const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        const referralName = _.get(editWebsiteReferralData, 'name', '')
        if (referralName !== '') {
            editWebsiteReferralData.name = editWebsiteReferralData.name.trim()
            setWebsiteReferralData((success: boolean) => {
                if (success === true) {
                    history('/website-referral')
                }
            })
        } else {
            alert('Please fill data')
            return
        }
    }

    if (isLoading) {
        return <>Loading</>
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row'>
            <div className='col-md-6'>
                <div className='card'>
                    <div className="card-header"> {id !== 'add-referral' ? 'Edit' : 'Add'} Referral
                        <NavLink className="float-end text-decoration-none" to="/website-referral" style={{ textAlign: 'right' }} >Cancel</NavLink>
                    </div>
                    <div className="card-body">
                        <form>
                            <div className='form-group'>
                                <label className='mt-2 mb-2'>Referral Name</label>
                                <input
                                    name='referral_name'
                                    type='text'
                                    className='form-control mb-3'
                                    placeholder=''
                                    disabled={isLoading}
                                    value={editWebsiteReferralData.name}
                                    onChange={(e) => {
                                        editWebsiteReferralData.name = e.target.value
                                    }}
                                />
                            </div>
                            <button type='submit' className="btn btn-primary mt-2" disabled={isLoading} onClick={handleSubmit} >
                                {id !== 'add-referral' ? 'Update' : 'Add'} Referral
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </Container >
}

export default observer(AddOrUpdateWebsiteReferral)
