import _ from 'lodash'
import { errorResponse, successResponse } from '../helper/common.js'
import { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } from '../helper/http.status.js'
import { websiteApiRequest } from '../utils/axiosClient.js'

export const checkCouponIsValid = async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        let data = _.get(req, 'body.data', '')
        if (_.isEmpty(data)) {
            return errorResponse(res, {}, 'Data is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }
        data.requestFrom = 'FF'
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/coupon/check',
            data,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Coupon validate successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while validate coupon.')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}
