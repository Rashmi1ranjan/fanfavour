import _ from 'lodash'
import { errorResponse, successResponse } from "../helper/common.js"
import { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } from "../helper/http.status.js"
import { servicesApiRequest, websiteApiRequest } from '../utils/axiosClient.js'

export const getLatestBlog = async (req, res) => {
    try {
        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }
        const pageNum = _.get(req, 'query.page_num', '')
        if (_.isEmpty(pageNum)) {
            return errorResponse(res, {}, 'Page number is required', HTTP_BAD_REQUEST_400)
        }
        const params = {
            requestFrom: 'FF',
            page_num: pageNum
        }
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/blogs',
            params,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data, 'Fetch latest blog successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while get latest blog')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const getBlogInfo = async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const blogId = _.get(req, 'query.blog_id', '')
        if (_.isEmpty(blogId)) {
            return errorResponse(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const params = {
            requestFrom: 'FF',
            blog_id: blogId
        }

        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/blog/get-blog-info',
            data: params,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })

        return successResponse(res, responseData.data, 'Fetch blog info successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while get blog info')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const saveBlogComment = async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const blogId = _.get(req, 'body.blog_id', '')
        if (_.isEmpty(blogId)) {
            return errorResponse(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const comment = _.get(req, 'body.comment', '').trim()
        if (_.isEmpty(comment)) {
            return errorResponse(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const payload = {
            blog_id: blogId,
            comment,
            is_anonymous: Boolean(_.get(req, 'body.is_anonymous', false))
        }

        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/blog/save-blog-comment',
            data: payload,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })

        return successResponse(res, responseData.data, 'Comment saved successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while saving comment')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const removeBlogComment = async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const blogId = _.get(req, 'body.blog_id', '')
        const commentId = _.get(req, 'body.comment_id', '')
        if (_.isEmpty(blogId) || _.isEmpty(commentId)) {
            return errorResponse(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const payload = {
            blog_id: blogId,
            comment_id: commentId
        }

        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/blog/remove-blog-comment',
            data: payload,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })

        return successResponse(res, responseData.data, 'Comment removed successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while removing comment')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const getAggregatedFeed = async (req, res) => {
    try {
        const token = _.get(req, 'headers.token', '')
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }

        const pageNum = _.get(req, 'query.page_num', '1')

        const responseData = await servicesApiRequest({
            method: 'get',
            endpoint: '/api/aggregated-feed',
            params: { token: null, page_num: pageNum },
            headers: { token }
        })
        return successResponse(res, _.get(responseData, 'data.data', responseData.data), 'Fetch aggregated feed successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while fetching aggregated feed')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const likeDislikeBlog = async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const id = _.get(req, 'body.id', '')
        const isLike = _.get(req, 'body.is_like', null)
        const totalLikes = _.get(req, 'body.total_likes', null)

        if (_.isEmpty(id) || ![0, 1, '0', '1'].includes(isLike) || totalLikes === null || totalLikes === undefined) {
            return errorResponse(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const payload = {
            id,
            is_like: Number(isLike),
            total_likes: Number(totalLikes)
        }

        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/blog/like-dislike',
            data: payload,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })

        return successResponse(res, responseData.data, 'Like status updated successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while updating like status')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}
