import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useNavigate, NavLink, useParams } from 'react-router-dom'
import _ from 'lodash'
import { useForm } from 'react-hook-form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons'
import styled from 'styled-components'
import { ErrorCodeDescription } from '../../types/types'

interface Props {
    rootStore: RootStore
}

const BackLink = styled.div`
    a, a: hover {
        color: var(--bs-body-color);
        text-decoration: none;
    }
`

const EditCCBillErrorCodeDescription: React.FC<Props> = ({ rootStore }) => {
    const { ccbillErrorCodeDescriptionStore } = rootStore
    const { clearCCBillErrorCodeData, editCCBillErrorCodeDescription, setCCBillErrorCodeDescriptionDetailById, setCCBillErrorCodeDescriptionData, isLoading } = ccbillErrorCodeDescriptionStore
    const history = useNavigate()
    const { id } = useParams<string>()
    const { register, handleSubmit, formState: { errors } } = useForm()

    useEffect(() => {
        clearCCBillErrorCodeData()
        if (id) {
            setCCBillErrorCodeDescriptionDetailById(id)
        }
    }, [])

    const onSubmit = (data: ErrorCodeDescription) => {
        editCCBillErrorCodeDescription.ccbill_error_code = data.ccbill_error_code
        editCCBillErrorCodeDescription.description = data.description
        editCCBillErrorCodeDescription.error_message = data.error_message
        setCCBillErrorCodeDescriptionData()
        history('/ccbill_error_code_description')
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
                            <NavLink to="/ccbill_error_code_description" >
                                <FontAwesomeIcon icon={faChevronLeft} className='me-2' />Edit CCBill Error Code
                            </NavLink>
                        </BackLink>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className='form-group'>
                                <label className='mb-2'>CCBill error code</label>
                                <input
                                    name='ccbill_error_code'
                                    type='text'
                                    className='form-control mb-3'
                                    placeholder='CCBill error code'
                                    ref={register({
                                        required: 'Please enter ccbill error code'
                                    })}
                                    defaultValue={editCCBillErrorCodeDescription.ccbill_error_code}
                                />
                                {(errors.ccbill_error_code) && <p className="text-danger">{errors.ccbill_error_code.message}</p>}
                            </div>
                            <div className='form-group'>
                                <label className='mb-2'>Description</label>
                                <input
                                    name='description'
                                    type='text'
                                    className='form-control mb-3'
                                    placeholder='Description'
                                    ref={register({
                                        required: 'Please enter description'
                                    })}
                                    defaultValue={editCCBillErrorCodeDescription.description}
                                />
                                {(errors.description) && <p className="text-danger">{errors.description.message}</p>}
                            </div>
                            <div className='form-group mb-3'>
                                <label className='mb-2'>MG Error Message</label>
                                <textarea
                                    name='error_message'
                                    className='form-control'
                                    placeholder='MG Error Message'
                                    defaultValue={editCCBillErrorCodeDescription.error_message}
                                    rows={4}
                                    ref={register}
                                ></textarea>
                                <small className="form-text text-muted">This message will be presented to user on error.</small>
                            </div>
                            <button type='submit' className="btn btn-primary me-2">Update CCBill Error Description</button>
                            <NavLink className="ms-2 btn btn-outline-primary" to="/ccbill_error_code_description" style={{ textAlign: 'right' }} >Cancel</NavLink>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </Container >
}

export default observer(EditCCBillErrorCodeDescription)
