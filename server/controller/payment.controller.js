import _ from 'lodash'
import { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } from '../helper/http.status.js'
import { errorResponse, successResponse, validateRequest } from '../helper/common.js'
import { websiteApiRequest } from '../utils/axiosClient.js'

export const getPaymentMethod = async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }
        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }

        const params = { requestFrom: 'FF' }
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/ccbill/get-payment-card',
            params,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Fetch user payment method successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error in get payment method')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const getUsersNewPaymentMethod = async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }
        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }

        const params = { requestFrom: 'FF' }
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/v2/get-payment-card',
            params,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Fetch user payment method successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error in get payment method')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const markCardAsPrimary = async (req, res) => {
    try {
        const validated = validateRequest(req, res, 'body.data', 'Data is required')
        if (!validated) return
        const { domain, token, data } = validated

        data.requestFrom = 'FF'
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/ccbill/set-primary-card',
            data,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Mark card as primary successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error in mark card as primary')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const removeCard = async (req, res) => {
    try {

        const validated = validateRequest(req, res, 'body.data', 'Data is required')
        if (!validated) return
        const { domain, token, data } = validated

        data.requestFrom = 'FF'
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/ccbill/remove-card',
            data,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Remove card successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error in remove card')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const saveUserDefaultPaymentMethod = async (req, res) => {
    try {
        const validate = validateRequest(req, res, 'body.data', 'Data is required')
        if (!validate) return
        const { domain, token, data } = validate

        data.requestFrom = 'FF'
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/user/change-payment-method',
            data,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Save user default payment method successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error in save user default payment method')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}