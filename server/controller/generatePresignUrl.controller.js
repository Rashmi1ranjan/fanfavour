import _ from 'lodash'
import { API_STATIC_TOKEN } from "../constant.js"
import { errorResponse, successResponse } from "../helper/common.js"
import { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } from "../helper/http.status.js"
import { websiteApiRequest } from '../utils/axiosClient.js'

export const generatePresignUrl = async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }
        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }
        const isUniversalChat = _.get(req, 'query.isUniversalChat', '')
        if (_.isEmpty(isUniversalChat)) {
            return errorResponse(res, {}, 'Chat type is required', HTTP_BAD_REQUEST_400)
        }

        req.body.isUniversalChat = isUniversalChat
        const endpoint = isUniversalChat === false ? `/api/upload/generate_presigned_url?requestFrom=FF` : `/api/universal-chat/generate-presigned-url?token=${API_STATIC_TOKEN}&requestFrom=FF`
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
        return successResponse(res, responseData.data.data, 'Presigned url generated successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error generate presigned url')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}