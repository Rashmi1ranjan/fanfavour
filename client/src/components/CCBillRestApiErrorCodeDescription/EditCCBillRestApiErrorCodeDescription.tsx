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

const EditCCBillRestApiErrorCodeDescription: React.FC<Props> = ({ rootStore }) => {
    const { CCBillRestApiErrorCodeDescriptionStore } = rootStore
    const {
        clearCCBillRestApiErrorCodeData,
        editCCBillRestApiErrorCodeDescription,
        setCCBillRestApiErrorCodeDescriptionDetailById,
        editCCBillRestApiErrorCodeDescriptionData,
        isLoading
    } = CCBillRestApiErrorCodeDescriptionStore
    const history = useNavigate()
    const { id } = useParams<string>()
    const { register, handleSubmit, formState: { errors } } = useForm()

    useEffect(() => {
        clearCCBillRestApiErrorCodeData()
        if (id) {
            setCCBillRestApiErrorCodeDescriptionDetailById(id)
        }
    }, [])

    const onSubmit = (data: ErrorCodeDescription) => {
        editCCBillRestApiErrorCodeDescription.ccbill_error_code = data.ccbill_error_code
        editCCBillRestApiErrorCodeDescription.description = data.description
        editCCBillRestApiErrorCodeDescription.error_message = data.error_message
        editCCBillRestApiErrorCodeDescriptionData()
        history('/ccbill_rest_api_error_code_description')
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
                            <NavLink to="/ccbill_rest_api_error_code_description" >
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
                                    defaultValue={editCCBillRestApiErrorCodeDescription.ccbill_error_code}
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
                                    defaultValue={editCCBillRestApiErrorCodeDescription.description}
                                />
                                {(errors.description) && <p className="text-danger">{errors.description.message}</p>}
                            </div>
                            <div className='form-group mb-3'>
                                <label className='mb-2'>MG Error Message</label>
                                <textarea
                                    name='error_message'
                                    className='form-control'
                                    placeholder='MG Card Error Message'
                                    ref={register({
                                        required: 'Please enter MG Error Message'
                                    })}
                                    rows={4}
                                    defaultValue={editCCBillRestApiErrorCodeDescription.error_message}
                                ></textarea>
                                <small className="form-text text-muted">This message will be presented to user on error.</small>
                                {(errors.error_message) && <p className="text-danger">{errors.error_message.message}</p>}
                            </div>
                            <button type='submit' className="btn btn-primary">Update</button>
                            <NavLink className="ms-2 btn btn-outline-primary" to="/ccbill_error_code_description" style={{ textAlign: 'right' }} >Cancel</NavLink>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </Container >
}

export default observer(EditCCBillRestApiErrorCodeDescription)
