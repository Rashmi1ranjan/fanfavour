import _ from 'lodash'
import { HTTP_BAD_REQUEST_400 } from '../helper/http.status.js'
import { successResponse, errorResponse } from '../helper/common.js'
import { HTTP_INTERNAL_SERVER_ERROR_500 } from '../helper/http.status.js'
import { sendChatMessage } from '../sockets/SocketManager.js'
import { API_STATIC_TOKEN } from '../constant.js'
import { websiteApiRequest } from '../utils/axiosClient.js'

export const getUserList = async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }
        const pageNum = _.get(req, 'query.page_num', 1)
        const sortBy = _.get(req, 'query.sort_by', 'DESC')
        const userName = _.get(req, 'query.user_name', '')
        const sortBySubscribers = _.get(req, 'query.sort_by_subscribers', 'DESC')
        const listId = _.get(req, 'query.list_id', '')

        const params = {
            page_num: pageNum,
            sort_by: sortBy,
            user_name: userName,
            sort_by_subscribers: sortBySubscribers,
            list_id: listId,
            requestFrom: 'FF'
        }
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/chat/get_user_list',
            params,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Fetch user list successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while get user list')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const getModelList = async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }

        const email = _.get(req, 'query.email', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Email is required', HTTP_BAD_REQUEST_400)
        }

        const params = {
            email: email,
            requestFrom: 'FF'
        }
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/chat/get_model_list',
            params,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Fetch model list successfully.')
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'response.data.message', 'Error while get model list')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const getUserDetails = async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }

        const user_id = _.get(req, 'query.user_id', '')
        if (_.isEmpty(user_id)) {
            return errorResponse(res, {}, 'User id is required', HTTP_BAD_REQUEST_400)
        }

        const params = {
            user_id: user_id,
            requestFrom: 'FF'
        }
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/chat/get_user_details',
            params,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Fetch user details successfully.')
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'response.data.message', 'Error while get user details')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const readMessageUser = async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }

        const data = {
            ...req.body,
            requestFrom: 'FF'
        }

        const currentDomain = _.get(req, 'body.currentDomain', '')
        const endpoint = data.domain && data.domain !== data.currentDomain ? '/api/universal-chat/read_message_user' : '/api/chat/read_message_user'
        const responseData = await websiteApiRequest({
            domain: currentDomain,
            method: 'post',
            endpoint,
            data,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data, 'Read message successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while read message')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const getMessages = async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }

        const selected_user_id = _.get(req, 'query.selected_user_id', '')
        if (_.isEmpty(selected_user_id)) {
            return errorResponse(res, {}, 'User id is required', HTTP_BAD_REQUEST_400)
        }

        const pageNum = _.get(req, 'query.page_num', 1)
        const params = {
            selected_user_id: selected_user_id,
            page_num: pageNum,
            requestFrom: 'FF'
        }
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/chat/get_messages',
            params,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Get message successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while get message')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const getUniversalChatMessages = async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }

        const email = _.get(req, 'query.email', '')
        if (_.isEmpty(email)) {
            return errorResponse(res, {}, 'Email is required', HTTP_BAD_REQUEST_400)
        }
        const pageNum = _.get(req, 'query.page_num', 1)
        const params = {
            token: API_STATIC_TOKEN,
            email: email,
            page_num: pageNum,
            requestFrom: 'FF'
        }
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/universal-chat/get-universal-user-chat-message',
            params,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Get message successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while get universal chat message')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const getUnreadCount = async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }

        const params = { requestFrom: 'FF' }
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/users/get_unread_count',
            params,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data, 'Read message successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while get unread count')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const sendTextMessage = async (req, res) => {
    try {
        const domain = _.get(req, 'body.currentDomain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }
        let data = _.get(req, 'body', {})
        if (_.isEmpty(data)) {
            return errorResponse(res, {}, 'Data is required', HTTP_BAD_REQUEST_400)
        }
        data.requestFrom = 'FF'
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/chat/send_message',
            data,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        const chatData = !_.isEmpty(responseData.data.data) ? responseData.data.data : {
            ...data,
            receiverId: data.receiver,
            senderId: data.sender,
            userID: data.userId,
        }

        sendChatMessage(req.body.receiver, 'MESSAGE_RECEIVE', chatData, req.body.userId)
        return successResponse(res, responseData.data.data, 'send message successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while send message')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}
