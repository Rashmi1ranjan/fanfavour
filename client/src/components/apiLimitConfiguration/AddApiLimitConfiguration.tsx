import React from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useForm } from 'react-hook-form'
import { NavLink, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons'
import styled from 'styled-components'
import Button from '../utils/Button'
import { ApiLimitConfiguration } from '../../types/types'

const BackLink = styled.div`
    a, a: hover {
        color: var(--bs-body-bg);
        text-decoration: none
    }
`

interface Props {
    rootStore: RootStore
}

const AddApiLimitConfiguration: React.FC<Props> = ({ rootStore }) => {
    const { ApiLimitConfigurationStore } = rootStore
    const { createApiLimitConfiguration, apiLimitConfiguration, isLoading } = ApiLimitConfigurationStore
    const history = useNavigate()
    const { register, handleSubmit, formState: { errors } } = useForm()

    const onSubmit = async (data: ApiLimitConfiguration) => {
        apiLimitConfiguration.api_end_point = data.api_end_point.trim()
        apiLimitConfiguration.max_attempt = Number(data.max_attempt)
        apiLimitConfiguration.duration = Number(data.duration)
        const response = await createApiLimitConfiguration()
        alert(response.message)
        if (response.status === true) {
            history('/api-limit-configuration-list')
        }
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='card'>
            <div className="card-header">
                <BackLink>
                    <NavLink to="/api-limit-configuration-list">
                        <FontAwesomeIcon icon={faChevronLeft} className='me-2' />
                        Add API limit Configuration
                    </NavLink>
                </BackLink>
            </div>
            <div className='card-body'>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className='form-group mb-3'>
                        <label className='mb-2'>API end Point</label>
                        <input
                            name='api_end_point'
                            type='text'
                            className='form-control'
                            placeholder='API end Point'
                            ref={register({ required: 'Please Enter API End Point' })}
                        />
                        {(errors.api_end_point) && <p className="text-danger mb-0">{errors.api_end_point.message}</p>}
                    </div>
                    <div className='form-group mb-3'>
                        <label className='mb-2'>Max Attempt</label>
                        <input
                            name='max_attempt'
                            type='text'
                            className='form-control'
                            placeholder='Max Attempt'
                            ref={register({ required: 'Please Enter Max Attempt', pattern: { value: /^[0-9]*$/, message: 'Enter Numbers only' } })}
                        />
                        {(errors.max_attempt) && <p className="text-danger mb-0">{errors.max_attempt.message}</p>}
                    </div>
                    <div className='form-group mb-3'>
                        <label className='mb-2'>Duration</label>
                        <input
                            name='duration'
                            type='text'
                            className='form-control'
                            placeholder='Duration'
                            ref={register({ required: 'Please Enter Duration', pattern: { value: /^[0-9]*$/, message: 'Enter Numbers only' } })}
                        />
                        {(errors.duration) && <p className="text-danger mb-0">{errors.duration.message}</p>}
                        <small className="form-text text-muted">Duration in minutes</small>
                    </div>
                    <Button disabled={isLoading} type='submit' title='Save' classes='btn-primary me-2' loading={isLoading} />
                    <NavLink className="ms-2 btn btn-outline-primary" to="/api-limit-configuration-list" style={{ textAlign: 'right' }}>Cancel</NavLink>
                </form>
            </div>
        </div>
    </Container>
}

export default observer(AddApiLimitConfiguration)
