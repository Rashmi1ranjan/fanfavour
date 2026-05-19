import _ from 'lodash'
import { HTTP_BAD_REQUEST_400, HTTP_UNAUTHORIZED_401 } from './http.status.js'

/**
 * Success response success helper function
 *
 * @param {object} res Express response object
 * @param {object} data Response json object
 * @param {string} message human readable messages
 * @returns {boolean} response sent
 */
export const successResponse = function successResponse(res, data, message) {
    const response = {
        success: 1,
        data: data,
        message: message,
        status: 200
    }
    return res.status(200).json(response)
}

/**
 * Success response error helper function
 *
 * @param {object} res Express response object
 * @param {object} errors Response json object
 * @param {string} message human readable messages
 * @param {number} status http status code
 * @returns {boolean} response sent
 */

export const errorResponse = function errorResponse(res, errors, message, status) {
    let response = {
        success: 0,
        data: {},
        errors: errors,
        message: message,
        status: status
    }

    const statusCode = _.get(errors, 'response.status', status)
    if (statusCode === HTTP_UNAUTHORIZED_401) {
        response.errors = _.get(errors, 'response.data.errors', { error: 'Unauthorized' })
        response.message = 'Unauthorized'
        response.status = HTTP_UNAUTHORIZED_401
        status = HTTP_UNAUTHORIZED_401
    }

    return res.status(status).json(response)
}

export const validateRequest = (req, res, dataPath = 'body.data', dataErrorMsg = 'Card details is required', requireData = true) => {
    const domain = _.get(req, 'body.domain', '') || _.get(req, 'query.domain', '')
    if (_.isEmpty(domain)) {
        errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        return null
    }

    const token = _.get(req, 'token', req.headers.token) || _.get(req, 'query.token', '')
    if (_.isEmpty(token)) {
        errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        return null
    }

    let data = {}
    if (requireData) {
        data = _.get(req, dataPath, {})
        if (_.isEmpty(data)) {
            errorResponse(res, {}, dataErrorMsg, HTTP_BAD_REQUEST_400)
            return null
        }
    }

    return { domain, token, data }
}

export const getBaseUrl = (domain) => {
    if (domain.includes('localhost')) return 'http://localhost:8000'
    if (process.env.NODE_ENV === 'development') return `http://api.${domain}`
    return `https://api.${domain}`
}
