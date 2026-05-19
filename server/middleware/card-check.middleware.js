import _ from 'lodash'
import { servicesApiRequest } from '../utils/axiosClient.js'

/**
 * @description Check User existing card or email is blocked in services or not.
 * @param {string} fieldValue - card hash
 * @param {string} requestFrom requestFrom
 * @returns {boolean} card is block or not.
 */
export const checkEmailOrCardDataInServicesBlockList = async(domain, fieldValue, requestFrom = '') => {
    const data = {
        fieldValue,
        domain: domain,
        requestFrom: requestFrom
    }
    try {
        let checkBlocked = await servicesApiRequest({
            method: 'post',
            endpoint: '/api/check_user_block',
            data,
            params: { token: null }, // No need to send token for this API as it's public API
        })
        const isBlocked = _.get(checkBlocked, 'data', false)
        return isBlocked
    } catch (error) {
        return false
    }
}