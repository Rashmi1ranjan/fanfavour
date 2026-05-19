import _ from 'lodash'
import { getAppSettings } from '../utils/AppSettings.js'
import { errorResponse, successResponse } from '../helper/common.js'
import { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } from '../helper/http.status.js'
import { updateAppSettingsCache } from '../utils/AppSettings.js'
import { websiteApiRequest } from '../utils/axiosClient.js'

export const getAppSetting = async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }
        const key = req.body.key
        const result = await getAppSettings(domain, key)
        return successResponse(res, result, 'App setting fetched successfully.')
    } catch (error) {
        return errorResponse(res, error, 'Error occurred while fetch App. Please try again', HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const getAllAppSetting = async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/app_settings/get',
            auth: 'service-header'
        })
        updateAppSettingsCache(responseData.data)
        return successResponse(res, responseData.data, 'App setting fetched successfully.')
    } catch (error) {
        return errorResponse(res, error, 'Error occurred while fetch App. Please try again', HTTP_INTERNAL_SERVER_ERROR_500)
    }
}