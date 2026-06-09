const express = require('express')
const router = express.Router()
const { protectAdminRoute } = require('./../middleware/auth.middleware')
const { postData, errorResponse, successResponse } = require('./../utils/index')
const VIDEO_AUTH_TOKEN = 'zTm8f9pfnJkzhANB6fcsNt8y2ZrGUjYt'
const _ = require('lodash')
/**
 * @description get Video processing queue from video server
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.get('/video-queue', protectAdminRoute, async (req, res) => {
    try {
        const baseUrl = process.env.VIDEO_PROCESSING_SERVER_API_URL

        const authUrl = `${baseUrl}/video/auth-token`
        const authData = { token: VIDEO_AUTH_TOKEN }

        // API call to get auth token from video server
        let getAuthToken = await postData(authUrl, authData)
        getAuthToken = JSON.parse(getAuthToken)
        if (getAuthToken.success == 0) {
            return errorResponse(res, {}, 'Error! token not created')
        }
        authData.auth_token = getAuthToken.data.token

        // API call to get video queue
        const videoQueueUrl = `${baseUrl}/video/video-queue`
        let getVideoQueue = await postData(videoQueueUrl, authData)
        getVideoQueue = JSON.parse(getVideoQueue)
        if (getVideoQueue.success == 0) {
            return errorResponse(res, {}, getVideoQueue.message)
        }
        const data = {
            videos: getVideoQueue.data.videos
        }
        return successResponse(res, data, getVideoQueue.message)
    } catch (error) {
        return errorResponse(res, error, 'Error! Request not completed')
    }
})

/**
 * @description get Video processing errors from video server
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.get('/errors', protectAdminRoute, async (req, res) => {
    try {
        const baseUrl = process.env.VIDEO_PROCESSING_SERVER_API_URL

        const authUrl = `${baseUrl}/video/auth-token`
        const authData = { token: VIDEO_AUTH_TOKEN }

        // API call to get auth token from video server
        let getAuthToken = await postData(authUrl, authData)
        getAuthToken = JSON.parse(getAuthToken)
        if (getAuthToken.success == 0) {
            return errorResponse(res, {}, 'Error! token not created')
        }
        authData.auth_token = getAuthToken.data.token

        const currentPage = _.get(req, 'query.currentPage', 1)
        authData.currentPage = currentPage

        const videoErrorsUrl = `${baseUrl}/video/errors`
        let processingVideoErrors = await postData(videoErrorsUrl, authData)
        processingVideoErrors = JSON.parse(processingVideoErrors)
        if (processingVideoErrors.success == 0) {
            return errorResponse(res, {}, processingVideoErrors.message)
        }

        const data = processingVideoErrors.data
        return successResponse(res, data, 'Errors retrieved successfully!')
    } catch (error) {
        return errorResponse(res, error, 'Error occured while getting Video Processing Errors')
    }
})

/**
 * @description get Video processing server health from video server
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.get('/health', protectAdminRoute, async (req, res) => {
    try {
        const baseUrl = process.env.VIDEO_PROCESSING_SERVER_API_URL

        const authUrl = `${baseUrl}/video/auth-token`
        const authData = { token: VIDEO_AUTH_TOKEN }

        // API call to get auth token from video server
        let getAuthToken = await postData(authUrl, authData)
        getAuthToken = JSON.parse(getAuthToken)
        if (getAuthToken.success == 0) {
            return errorResponse(res, {}, 'Error! token not created')
        }
        authData.auth_token = getAuthToken.data.token

        const videoHealthUrl = `${baseUrl}/video/health`
        let videoProcessingHealthData = await postData(videoHealthUrl, authData)
        videoProcessingHealthData = JSON.parse(videoProcessingHealthData)
        if (videoProcessingHealthData.success == 0) {
            return errorResponse(res, {}, videoProcessingHealthData.message)
        }

        const data = {
            health: videoProcessingHealthData.data.health
        }
        return successResponse(res, data, 'Health data retrieved successfully!')
    } catch (error) {
        return errorResponse(res, error, 'Error! Request not completed')
    }
})

module.exports = router
