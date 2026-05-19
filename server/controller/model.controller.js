import { API_STATIC_AUTH_TOKEN } from "../constant.js"
import { successResponse, errorResponse } from "../helper/common.js"
import { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } from "../helper/http.status.js"
import _ from 'lodash'
import { servicesApiRequest, websiteApiRequest } from "../utils/axiosClient.js"

export const getFanFavourModelList = async (req, res) => {
    try {
        const page = req.query.page
        const responseData = await servicesApiRequest({
            method: 'get',
            endpoint: '/model/model_list',
            params: { page: page },
        })
        const fanFavourModelList = _.get(responseData, 'data.data', [])

        return successResponse(res, fanFavourModelList, 'Fetch fan favour model list successfully')
    } catch (err) {
        return errorResponse(res, err, 'Error in get model details', HTTP_BAD_REQUEST_400)
    }
}

export const getFanFavourFeaturedModel = async (req, res) => {
    try {
        const responseData = await servicesApiRequest({
            method: 'get',
            endpoint: '/model/get_featured_model',
        })
        const fanFavourModelList = _.get(responseData, 'data.data', [])

        return successResponse(res, fanFavourModelList, 'Fetch featured model successfully')
    } catch (err) {
        return errorResponse(res, err, 'Error in get model details', HTTP_BAD_REQUEST_400)
    }
}

export const getCurrentUserSession = async (req, res) => {
    try {
        const data = {
            access_token: req.body.access_token,
            ip_address: req.clientIp
        }
        const responseData = await servicesApiRequest({
            method: 'post',
            endpoint: '/ff-sso/verify-access-token',
            data,
        })
        const fanFavourModelList = _.get(responseData, 'data.data', [])

        return successResponse(res, fanFavourModelList, 'Fetch current user details successfully')
    } catch (err) {
        return errorResponse(res, err, 'Error in get model details', HTTP_BAD_REQUEST_400)
    }
}

export const getAuthImages = async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }
        const params = {
            token: API_STATIC_AUTH_TOKEN
        }
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/users/get_auth_images',
            params,
            auth: 'service-param'
        })
        const authImages = _.get(responseData, 'data.data', [])
        return successResponse(res, authImages, 'Fetch auth images successfully')
    } catch (err) {
        console.log(err)
        return errorResponse(res, err, 'Error in get auth images', HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const getSelectedModel = async (req, res) => {
    try {
        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }
        const domain = req.query.website_url
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/users/get-selected-model',
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        const response = _.get(responseData, 'data.data', [])
        return successResponse(res, response, 'Fetch selected model successfully')
    } catch (err) {
        return errorResponse(res, err, 'Error in get selected model details', HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

