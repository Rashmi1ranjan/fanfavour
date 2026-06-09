const express = require('express')
const _ = require('lodash')
const router = express.Router()
const { protectRouteWithRole, SUPER_ADMIN } = require('./../middleware/auth.middleware')
const { errorResponse, successResponse } = require('../utils')
const { HTTP_INTERNAL_SERVER_ERROR_500 } = require('../utils/http.status')
const { generatePresignedUrlWithAWS } = require('../utils/fileUpload')

router.post('/generate_presigned_url', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        const responseObject = generatePresignedUrlWithAWS(req)
        const resError = _.get(responseObject, 'error', false)
        if (resError) {
            const { message, errorCode } = resError
            return errorResponse(res, 'error', message, errorCode)
        }
        return successResponse(res, responseObject, 'Presigned Url generated successfully')
    } catch (error) {
        const errorMessage = _.get(error, 'message', 'Something went wrong. please report the issue.')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

module.exports = router
