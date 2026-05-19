import _ from 'lodash'
import { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } from '../helper/http.status.js'
import { errorResponse, successResponse } from '../helper/common.js'
import { websiteApiRequest } from '../utils/axiosClient.js'

export const getAllPromotionOffers = async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        const params = { requestFrom: 'FF' }
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/offer/check-offer',
            params,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'App setting fetched successfully.')
    } catch (error) {
        return errorResponse(res, error, 'Error occurred while fetch App. Please try again', HTTP_INTERNAL_SERVER_ERROR_500)
    }
}