import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useNavigate, NavLink } from 'react-router-dom'
import _ from 'lodash'
import { useForm } from 'react-hook-form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons'
import styled from 'styled-components'
import { DeclineCodeDescription } from '../../types/types'

interface Props {
    rootStore: RootStore
}

const BackLink = styled.div`
    a, a: hover {
        color: var(--bs-body-color);
        text-decoration: none;
    }
`

const AddDeclineCodeDescription: React.FC<Props> = ({ rootStore }) => {
    const { declineCodeDescriptionStore } = rootStore
    const { editDeclineCodeDescription, clearDeclineCodeData, setDeclineCodeDescriptionData, isLoading, isDataSending } = declineCodeDescriptionStore
    const history = useNavigate()
    const { register, handleSubmit, formState: { errors } } = useForm()

    useEffect(() => {
        clearDeclineCodeData()
    }, [])

    const onSubmit = (data: DeclineCodeDescription) => {
        editDeclineCodeDescription.decline_code = data.decline_code
        editDeclineCodeDescription.description = data.description
        editDeclineCodeDescription.error_message = data.error_message
        editDeclineCodeDescription.link_to_change_card = data.link_to_change_card
        editDeclineCodeDescription.link_text = data.link_text
        editDeclineCodeDescription.payment_gateway = data.payment_gateway
        setDeclineCodeDescriptionData((status: boolean) => {
            if (status === true) {
                history('/decline_code_description')
            }
        })
    }

    if (isLoading) {
        return <>Loading</>
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row'>
            <div className='col-md-12'>
                <div className='card'>
                    <div className="card-header">
                        <BackLink>
                            <NavLink to="/decline_code_description" >
                                <FontAwesomeIcon icon={faChevronLeft} className='me-2' />
                                Add Decline Code
                            </NavLink>
                        </BackLink>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className='form-group'>
                                <label className='mb-2'>Payment Gateway</label>
                                <div className="mb-3">
                                    <div className="form-check form-check-inline">
                                        <input className="form-check-input" type="radio" name='payment_gateway' id="ccbill" value="ccbill" ref={register({
                                            required: 'Please Select Payment Gateway'
                                        })} />
                                        <label className="form-check-label" htmlFor="ccbill">CCBill</label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input className="form-check-input" type="radio" name='payment_gateway' id="sticky_io" value="sticky.io" ref={register({
                                            required: 'Please Select Payment Gateway'
                                        })} />
                                        <label className="form-check-label" htmlFor="sticky_io">Sticky.io</label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input className="form-check-input" type="radio" name='payment_gateway' id="forumpay" value="forumpay" ref={register({
                                            required: 'Please Select Payment Gateway'
                                        })} />
                                        <label className="form-check-label" htmlFor="forumpay">ForumPay</label>
                                    </div>
                                    {(errors.payment_gateway) && <p className="text-danger">{errors.payment_gateway.message}</p>}
                                </div>
                            </div>
                            <div className='form-group mb-3'>
                                <label className='mb-2'>Decline code</label>
                                <input
                                    name='decline_code'
                                    type='text'
                                    className='form-control'
                                    placeholder=''
                                    ref={register({
                                        required: 'Please enter decline code'
                                    })}
                                />
                                {(errors.decline_code) && <p className="text-danger">{errors.decline_code.message}</p>}
                            </div>
                            <div className='form-group mb-3'>
                                <label className='mb-2'>Description</label>
                                <input
                                    name='description'
                                    type='text'
                                    className='form-control'
                                    placeholder=''
                                    ref={register({
                                        required: 'Please enter description'
                                    })}
                                />
                                {(errors.description) && <p className="text-danger">{errors.description.message}</p>}
                            </div>
                            <div className='form-group mb-3'>
                                <label className='mb-2'>MG Card Error Message</label>
                                <textarea
                                    name='error_message'
                                    className='form-control'
                                    placeholder='MG Card Error Message'
                                    rows={4}
                                    ref={register}
                                ></textarea>
                                <small className="form-text text-muted">This message will be presented to user on error.</small>
                            </div>
                            <div className="form-group mb-3">
                                <div className='form-check'>
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="link_to_change_card"
                                        name="link_to_change_card"
                                        ref={register}
                                    />
                                    <label className="form-check-label" htmlFor="link_to_change_card">Link to Change Card Page</label>
                                </div>
                                <small className="form-text text-muted">Check if you like to provide a link to add new card page.</small>
                            </div>
                            <div className='form-group mb-3'>
                                <label className='mb-2'>Link Text for Change Card Page</label>
                                <input
                                    name='link_text'
                                    type='text'
                                    className='form-control'
                                    placeholder='Link Text for Change Card Page'
                                    ref={register}
                                />
                                <small className="form-text text-muted">Add new card page link text.</small>
                            </div>
                            <button type='submit' className="btn btn-primary" disabled={isDataSending}>Add Decline Code</button>
                            <NavLink className="ms-2 btn btn-outline-primary" to="/decline_code_description" style={{ textAlign: 'right' }} >Cancel</NavLink>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </Container >
}

export default observer(AddDeclineCodeDescription)
