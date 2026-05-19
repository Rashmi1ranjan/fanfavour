import { API_STATIC_AUTH_TOKEN } from "../constant.js"
import { successResponse, errorResponse } from '../helper/common.js'
import { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } from '../helper/http.status.js'
import _ from 'lodash'
import { websiteApiRequest } from '../utils/axiosClient.js'

export const sendDeviceInfoToServices = async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }

        const requestData = _.get(req, 'body.data', '')
        if (_.isEmpty(requestData)) {
            return errorResponse(res, {}, 'request data details is required', HTTP_BAD_REQUEST_400)
        }

        let data = {
            is_running_from_pwa: requestData.is_running_from_pwa,
            user_id: requestData.user_id,
            user_agent: requestData.user_agent,
            domain: domain,
            token: API_STATIC_AUTH_TOKEN,
            is_popup_opened: requestData.is_popup_opened,
            ccbill_subscription_status: requestData.ccbill_subscription_status
        }
        data.requestFrom = 'FF'
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/services/send-device-info',
            data,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Send device info successfully.')
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'response.data.message', 'Error while send device info')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}