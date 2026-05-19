import _ from 'lodash'
import { setAuthToken } from "../lib/set-auth-token"
import { REGISTER, LOGIN } from '../lib/constant'
import { handleShowUniversalAddAccountPopup, showOldUserMergeAccountPopup, showUniversalForgotPasswordPopup } from "./universal-login.action"
import { api } from './base-url'
import { setCurrentDomain } from '../../store/slices/authSlice'
import { getCurrentUserDetails, logoutUser } from './users.action'
import { setIsUniversalLoginEnabled } from '../../store/slices/universalLoginSlice'
import { removeConfirmSweetAlert, setSweetAlert } from '../../store/slices/sweetAlertSlice'
import { registerButtonLoading } from '../../store/slices/registerSlice'
import { loginButtonLoading } from '../../store/slices/loginSlice'

export const loginUser = async (data, dispatch, router, requestFrom = '') => {
    try {
        const url = `/v1/login`
        const response = await api.post(url, data)
        const { isUniversalLoginEnabled, token } = response.data.data
        if (isUniversalLoginEnabled) {
            const showMergePopup = _.get(response, 'data.data.showMergePopup', false)
            if (showMergePopup) {
                dispatch(handleShowUniversalAddAccountPopup(response, data, LOGIN))
                return { status: false }
            }

            const showForgotPasswordPopup = _.get(response, 'data.data.showForgotPasswordPopup', false)
            if (showForgotPasswordPopup) {
                // show forgot password popup
                dispatch(showUniversalForgotPasswordPopup(response, data.email))
                return { status: false }
            }

            const showOldUserMergePopup = _.get(response, 'data.data.showOldUserMergePopup', false)
            if (showOldUserMergePopup) {
                // show old user merge account popup
                dispatch(showOldUserMergeAccountPopup(response, data, LOGIN))
                return { status: false }
            }
        }
        dispatch(setIsUniversalLoginEnabled(isUniversalLoginEnabled))
        localStorage.setItem('AuthToken', token)
        // Set token to Auth header
        setAuthToken(token)
        dispatch(setCurrentDomain(data.sourceDomain))
        if (!_.isEmpty(data.sourceDomain)) {
            localStorage.setItem('currentDomain', data.sourceDomain)
        }
        const action = _.get(data, 'action', '')
        dispatch(getCurrentUserDetails(router, LOGIN, action, requestFrom, url, data.sourceDomain))
        return { status: true }
    } catch (error) {
        dispatch(loginButtonLoading(false))
        let errorMessage = _.get(error, 'response.data.message', 'Something went wrong')
        if (error.response.data.errors !== undefined) {
            errorMessage = error.response.data.errors
        }
        if (errorMessage === 'ERR_10001') {
            let errorMessage = _.get(error.response, 'data.message', 'Invalid request') + ' (<a href="/contact-us" target="_blank">Contact Us</a>) (ERR_10001).'
            dispatch(setSweetAlert({ description: errorMessage }))
            return
        }
        dispatch(setSweetAlert({ description: errorMessage }))
    }
}

export const registerUser = async (data, dispatch, router, requestFrom = '') => {
    try {
        const url = `/v1/register`
        const response = await api.post(url, data)
        const { isUniversalLoginEnabled, authToken } = response.data.data
        if (isUniversalLoginEnabled) {
            const showMergePopup = _.get(response, 'data.data.showMergePopup', false)
            if (showMergePopup) {
                // show merge account popup
                dispatch(handleShowUniversalAddAccountPopup(response, data, REGISTER))
                return { status: false }
            }
            const showForgotPasswordPopup = _.get(response, 'data.data.showForgotPasswordPopup', false)
            if (showForgotPasswordPopup) {
                // show forgot password popup
                dispatch(showUniversalForgotPasswordPopup(response, data.email))
                return { status: false }
            }
            const showOldUserMergePopup = _.get(response, 'data.data.showOldUserMergePopup', false)
            if (showOldUserMergePopup) {
                // show old user merge account popup
                dispatch(showOldUserMergeAccountPopup(response, data, REGISTER))
                return { status: false }
            }
        }
        if (response.data.success === 0) {
            dispatch(setSweetAlert({ description: response.data.message }))
            return { status: false }
        }
        const domain = data?.sourceDomain ?? ''
        dispatch(setCurrentDomain(domain))
        if (_.isEmpty(domain) === false) {
            localStorage.setItem('currentDomain', domain)
        } else {
            localStorage.removeItem('currentDomain')
        }
        dispatch(setIsUniversalLoginEnabled(isUniversalLoginEnabled))
        localStorage.setItem('AuthToken', authToken)
        // Set token to Auth header
        setAuthToken(authToken)
        const action = _.get(data, 'action', '')
        dispatch(getCurrentUserDetails(router, REGISTER, action, requestFrom, '', data.sourceDomain))
        return { status: true }
        // return response.data
    } catch (error) {
        let errorMessage = _.get(error, 'response.data.message', 'Something went wrong')
        if (error.response.data.errors.errorCode === 'ERR_10001') {
            errorMessage = _.get(error.response, 'data.message', 'Invalid request') + ' (<a href="/contact-us" target="_blank">Contact Us</a>) (ERR_10001).'
        }
        dispatch(setSweetAlert({ description: errorMessage }))
        dispatch(registerButtonLoading(false))
        return
    }
}

export const forgotPassword = async (data, dispatch) => {
    try {
        const url = `/v1/forgot_password`
        await api.post(url, data)
        const payload = {
            description: 'A password reset link was just emailed to you.'
        }

        dispatch(setSweetAlert(payload))
        return { status: true }
    } catch (error) {
        if (error?.response && error.response.status === 429) {
            let errorMessage = _.get(error.response, 'data.message', 'You sent too many requests. Please wait a while then try again')
            const payload = {
                description: errorMessage
            }
            dispatch(setSweetAlert(payload))
            return { status: false }
        }
        const errorRes = _.get(error?.response, 'data.message', 'Error in sent forgot password link')
        const payload = {
            description: errorRes
        }
        // dispatch(setSweetAlert(payload))
        dispatch(setSweetAlert(payload))
        return { status: false }
    }
}

export const changeOldPassword = async (domain, data, dispatch) => {
    try {
        const url = `/v1/change_old_password`
        const response = await api.post(url, { data, domain })
        if (response.data.data.action === false) {
            const errorMessage = _.get(response, 'data.message', 'Invalid data')
            const payload = {
                description: errorMessage
            }
            return dispatch(setSweetAlert(payload))
        }
        // const token = _.get(response, 'data.data.authToken', '')
        // if (_.isEmpty(token)) {
        //     dispatch(setSweetAlert({ description: 'Invalid token.' }))
        //     dispatch(logoutUser())
        //     return
        // }

        // localStorage.setItem('AuthToken', token)
        // setAuthToken(token)
        let message = 'Password updated successfully.'
        if (response.data.data.userUniversalAccountCount > 1) {
            message = 'Password updated successfully.\n\nPlease use the same password for all McCandless Group websites.'
        }
        const payload = {
            description: message
        }
        dispatch(setSweetAlert(payload))
        dispatch(removeConfirmSweetAlert())
        return
    } catch (error) {
        dispatch(removeConfirmSweetAlert())
        const errorRes = _.get(error.response, 'data.message', 'Error occured while change old password')
        const payload = {
            description: errorRes
        }
        dispatch(setSweetAlert(payload))
    }
}

export const logoutUserAction = async (data, dispatch) => {
    try {
        const url = `/v1/sso/logout`
        await api.post(url, data)
    } catch (error) {
        const errorRes = _.get(error.response, 'data.message', 'Error occured while logout')
        const payload = {
            description: errorRes
        }
        dispatch(setSweetAlert(payload))
    }
}

export const resetPasswordAction = async (domain, data, dispatch) => {
    try {
        const url = `/v1/reset_password`
        const response = await api.post(url, { domain, data })
        if (dispatch) dispatch(setSweetAlert({ description: 'Password updated successfully' }))
        return { status: true, data: response?.data?.data }
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error occurred while resetting password')
        if (dispatch) dispatch(setSweetAlert({ description: errorMessage }))
        return { status: false, message: errorMessage }
    }
}