import React, { useState, useEffect } from 'react'
import RootStore from '../store/Root'
import DefaultLayout from './layout/DefaultLayout'
import { useForm } from 'react-hook-form'
import { login } from '../api/LoginActions'
import { observer } from 'mobx-react'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'

interface Props {
    rootStore: RootStore,
}

interface Dictionary<T> {
    [Key: string]: T;
}

const LoginPage: React.FC<Props> = ({ rootStore }) => {
    const [apiErrorMessage, setApiErrorMessage] = useState('')
    const [isApiError, setIsApiError] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { register, handleSubmit, errors } = useForm()
    const history = useNavigate()
    const [isMfaEnabled, setIsMfaEnabled] = useState(false)
    const isLoggedIn = rootStore.authStore.isUserLoggedIn

    useEffect(() => {
        if (rootStore.authStore.authToken !== '' && rootStore.authStore.isUserLoggedIn === true) {
            const role = rootStore.authStore.userRole
            if (role === 'SUPER_ADMIN') {
                history('/dashboard')
            } else if (role === 'ANALYTICS') {
                history('/analytics/user_count')
            } else if (role === 'ACCOUNT_MANAGER') {
                history('/forumpay-transaction-history')
            } else if (role === 'SUPPORT') {
                history('/contact-us')
            } else if (role === 'LINK_REFERRAL') {
                history('/analytics/link-tracking')
            } else {
                history('/missingwebhooks')
            }
        }
    }, [])

    const onSubmit = async (data: Dictionary<string>) => {
        setIsLoading(true)
        setIsApiError(false)
        setApiErrorMessage('')
        rootStore.ccbillErrorStore.isApiError = false
        try {
            const response = await login(data.email, data.password, data.mfa_code)
            setIsLoading(false)
            if (response.data.success === 0) {
                setIsApiError(true)
                setApiErrorMessage(response.data.message)
                return
            }

            if (response.data.is_mfa_enabled === true && response.data.is_mfa_verified === false) {
                setIsMfaEnabled(true)
                return
            }

            const token = response.data.token
            const role = response.data.role
            rootStore.authStore.setAuthToken(token)
            rootStore.authStore.setCurrentUser(data.email)
            rootStore.authStore.setUserRole(role)
            rootStore.authStore.setUserMfaStatus(response.data.is_mfa_enabled)
            if (role === 'SUPER_ADMIN') {
                history('/dashboard')
            } else if (role === 'ANALYTICS') {
                history('/analytics/user_count')
            } else if (role === 'REFERRAL') {
                history('/website-referral-monthly-earning-report')
            } else if (role === 'ACCOUNT_MANAGER') {
                history('/forumpay-transaction-history')
            } else if (role === 'SUPPORT') {
                history('/contact-us')
            } else if (role === 'LINK_REFERRAL') {
                history('/analytics/link-tracking')
            } else {
                history('/missingwebhooks')
            }
            // TODO : assign type
        } catch (error: any) {
            setIsLoading(false)
            setIsApiError(true)
            setApiErrorMessage(error.response.data.message)
            console.log(error.response.data.message)
        }
    }
    if (isLoggedIn === true) {
        return <></>
    } else {

        return <DefaultLayout rootStore={rootStore}>
            <div className='row justify-content-md-center pt-5'>
                <div className='col col col-md-4'>
                    <h3 className="panel-title">Please Sign In</h3>
                    {isApiError && <div className='responsive alert alert-danger p-3 mb-4 rounded' >
                        {apiErrorMessage}
                    </div>}
                    <form onSubmit={handleSubmit(onSubmit)} >
                        <fieldset>
                            <div className="form-group">
                                <label className='mb-2'>Email address</label>
                                <input
                                    ref={register({
                                        required: 'This field is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid email address'
                                        }
                                    })}
                                    name='email'
                                    type='text'
                                    className={classNames('form-control mb-3', { 'is-invalid': errors.email })}
                                    placeholder='Enter email'
                                />
                                {errors.email && (<div className='invalid-feedback'>{errors.email.message}</div>)}
                            </div>
                            <div className='form-group'>
                                <label className='mb-2'>Password</label>
                                <input
                                    name='password'
                                    ref={register({
                                        required: 'This field is required'
                                    })}
                                    type='password'
                                    className={classNames('form-control mb-3', { 'is-invalid': errors.password })}
                                    placeholder='Enter password'
                                />
                                {errors.password && (<div className='invalid-feedback'>{errors.password.message}</div>)}
                            </div>
                            {isMfaEnabled === true &&
                                <div className='form-group'>
                                    <label className='mb-2'>MFA Code</label>
                                    <input
                                        name='mfa_code'
                                        ref={register({
                                            required: 'This field is required'
                                        })}
                                        type='number'
                                        className={classNames('form-control mb-3', { 'is-invalid': errors.password })}
                                        placeholder='Enter MFA Code'
                                    />
                                    {errors.mfa_code && (<div className='invalid-feedback'>{errors.mfa_code.message}</div>)}
                                </div>
                            }


                            <button type='submit' className="btn btn-primary btn-block mt-2 w-100" disabled={isLoading}>
                                <span className={classNames('spinner-border spinner-border-sm', { 'd-none': !isLoading })} role='status' aria-hidden='true'></span>
                                {isLoading ? 'Loading...' : 'Login'}
                            </button>
                        </fieldset>
                    </form>
                </div>
            </div>
        </DefaultLayout>
    }
}

export default observer(LoginPage)
