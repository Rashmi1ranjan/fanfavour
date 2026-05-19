import _ from 'lodash'
import { errorResponse, successResponse, validateRequest } from '../helper/common.js'
import { HTTP_INTERNAL_SERVER_ERROR_500 } from '../helper/http.status.js'
import { websiteApiRequest } from '../utils/axiosClient.js'

export const dismissChangeEmailRequest = async (req, res) => {
    try {
        const validated = validateRequest(req, res, {}, '', false)
        if (!validated) return
        const { domain, token } = validated

        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/change-email-settings/dismiss-change-email-request',
            data: { requestFrom: 'FF' },
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, responseData.data.data.message)
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while dismiss change email request')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const resendChangeEmailRequest = async (req, res) => {
    try {
        const validated = validateRequest(req, res, {}, '', false)
        if (!validated) return
        const { domain, token } = validated

        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/change-email-settings/resend-change-email-request',
            data: { requestFrom: 'FF' },
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, responseData.data.data.message)
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while dismiss change email request')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}