import _ from 'lodash'
import { errorResponse, successResponse } from "../helper/common.js"
import { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } from "../helper/http.status.js"
import { API_STATIC_TOKEN } from '../constant.js'
import { websiteApiRequest } from '../utils/axiosClient.js'
import { sendChatMessage } from '../sockets/SocketManager.js'

export const sendMessage = async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        const email = _.get(req, 'query.email', '')
        if (_.isEmpty(email)) {
            return errorResponse(res, {}, 'Email is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }

        const isUniversalChat = _.get(req, 'query.isUniversalChat', '')
        req.body.requestFrom = 'FF'
        req.body.isUniversalChat = isUniversalChat
        const endpoint = isUniversalChat === true ? '/api/message/send-message' : `/api/universal-chat/send-message?token=${API_STATIC_TOKEN}&email=${email}`
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint,
            data: req.body,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Send Message successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while send message')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}