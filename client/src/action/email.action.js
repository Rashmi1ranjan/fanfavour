import _ from 'lodash'
import { api } from './base-url'
import { setSweetAlert } from '../../store/slices/sweetAlertSlice'
import { getUserDetails } from './users.action'

export const dismissChangeEmailRequest = (domain) => async (dispatch) => {
    try {
        const response = await api.post(`/v1/email-settings/dismiss-change-email-request`, { domain })
        if (response.data.success === 1) {
            const isUserFetched = await getUserDetails(dispatch, false, domain)
            if (isUserFetched) {
                const payload = {
                    description: 'Your change email request has been cancelled, if you want to change email then please request again.'
                }
                dispatch(setSweetAlert(payload))
            }
        }
    } catch (err) {
        const message = _.get(err, 'response.data.message', 'There was a problem in dismiss change email request.')
        dispatch(setSweetAlert({ description: message }))
    }
}

export const resendChangeEmailRequest = (domain) => async (dispatch) => {
    try {
        const response = await api.post(`/v1/email-settings/resend-change-email-request`, { domain })
        if (response.data.success === 1) {
            const isUserFetched = await getUserDetails(dispatch, false, domain)
            if (isUserFetched) {
                const payload = {
                    description: 'Resend change Email Request Successfully'
                }
                dispatch(setSweetAlert(payload))
            }
        }
    } catch (err) {
        const message = _.get(err, 'response.data.message', 'There was a problem in resend change email request.')
        dispatch(setSweetAlert({ description: message }))
    }
}
