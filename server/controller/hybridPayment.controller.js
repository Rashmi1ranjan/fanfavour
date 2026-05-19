import _ from 'lodash'
import { HTTP_INTERNAL_SERVER_ERROR_500 } from '../helper/http.status.js'
import { errorResponse, successResponse, validateRequest } from '../helper/common.js'
import { websiteApiRequest } from '../utils/axiosClient.js'

export const subscriptionPayment = async (req, res) => {
    try {
        const validated = validateRequest(req, res)
        if (!validated) return
        const { domain, data } = validated

        data.requestFrom = 'FF'
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/v2/purchase/subscription',
            data,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Subscriber successfully.')
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'response.data.message', 'Error while take subscription')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const addNewCard = async (req, res) => {
    try {
        const validated = validateRequest(req, res)
        if (!validated) return
        const { domain, data } = validated

        data.requestFrom = 'FF'
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/v2/purchase/add-new-card',
            data,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Fetch user payment method successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while take subscription')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const subscriptionPaymentByCard = async (req, res) => {
    try {
        const validated = validateRequest(req, res)
        if (!validated) return
        const { domain, data } = validated

        data.requestFrom = 'FF'
        delete data.email
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/v2/purchase/subscription-with-card',
            data,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Subscribe successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while take subscription using old card')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const chatPurchasePayment = async (req, res) => {
    try {
        const validated = validateRequest(req, res, 'body', 'data is required')
        if (!validated) return
        const { domain, data } = validated

        data.requestFrom = 'FF'
        // delete data.email
        let url = '/api/v2/purchase/chat-content-purchase'
        if (_.get(data, 'isUniversalChat', false) === true) {
            url = '/api/universal-chat/purchase/universal-chat-content-purchase'
        }
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: url,
            data,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, responseData.data.data.message)
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while purchase chat content')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const sendTip = async (req, res) => {
    try {
        const validated = validateRequest(req, res, 'body', 'Please provide the required data.')
        if (!validated) return
        const { domain, data } = validated

        const isUniversalChat = _.get(data, 'isUniversalChat', false)
        const url = isUniversalChat ? '/api/universal-chat/send-tip-from-universal-chat' : '/api/v2/purchase/send-tip'
        data.requestFrom = 'FF'
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: url,
            data,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data, responseData.data.data.message)
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while purchase chat content')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const blogPurchasePayment = async (req, res) => {
    try {
        const validated = validateRequest(req, res, 'body', 'data is required')
        if (!validated) return
        const { domain, data } = validated

        data.data.requestFrom = 'FF'
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/v2/purchase/blog-content-purchase',
            data: data.data,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, responseData.data.data.message)
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while purchase blog content')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}
