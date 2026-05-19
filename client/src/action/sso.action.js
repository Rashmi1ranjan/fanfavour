import _ from 'lodash'
// import { setUserIsAuthenticate } from '../../../store/slices/authSlice'
import { api } from './base-url'
import { setAuthToken } from '../lib/set-auth-token'
import { getUserDetails } from './users.action'

export const ssoLogin = async (data, dispatch) => {
    try {
        const url = `/v1/sso/login`
        const response = await api.post(url, data)

        localStorage.setItem('AuthToken', response.data.data.authToken)
        // Set token to Auth header
        setAuthToken(response.data.data.authToken)

        // Bootstrap user details - fail fast if this fails
        const userDetailsFetched = await getUserDetails(dispatch, false, data.source_domain)
        if (!userDetailsFetched) {
            // Clear the token since bootstrap failed
            localStorage.removeItem('AuthToken')
            setAuthToken(null)
            return { success: 0, error: 'Failed to load user details' }
        }

        // dispatch(setUserIsAuthenticate({ isAuthenticated: true }))
        return { success: 1 }
    } catch (error) {
        let errorMessage = _.get(error, 'response.data.message', 'Something went wrong')
        return { success: 0, error: errorMessage }
    }
}

export const generateWebsiteTempToken = async (data) => {
    try {
        const url = `/v1/sso/generate-token`
        const response = await api.post(url, data)
        return _.get(response, 'data.data.data.temp_token', '')
    } catch (error) {
        console.log({ error })
        let errorMessage = _.get(error, 'response.data.message', 'Something went wrong')
        console.log(errorMessage)
        alert(errorMessage)
    }
}
