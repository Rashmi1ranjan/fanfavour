import _ from 'lodash'
import { API_STATIC_AUTH_TOKEN } from '../constant.js'
import { servicesApiRequest } from './axiosClient.js'

/**
 * @description Add Universal Login Event Log
 *
 * @param {string} email user email
 * @param {string} event event name
 * @param {object} meta event meta data
 * @returns {boolean} return boolean value
 */
export const addUniversalEventLog = async(domain, email, event, meta = {}) => {
    try {
        const eventDetails = {
            email,
            event,
            meta,
            domain
        }

        await servicesApiRequest({
            method: 'post',
            endpoint: '/api/universal-login-logger/add-log',
            data: eventDetails,
            headers: { token: API_STATIC_AUTH_TOKEN },
            params: { token: null }, // No need to send token for this API as it's public API
        })
        return true
    } catch (error) {
        const errorData = _.get(error, 'response.data', error)
        const errorMessage = _.get(errorData, 'message', 'Problem in store universal event log')
        return false
    }
}
