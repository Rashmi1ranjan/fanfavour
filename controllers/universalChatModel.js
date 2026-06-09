const express = require('express')
const router = express.Router()
const Validator = require('validator')
const axios = require('axios')
const _ = require('lodash')
const UniversalUsers = require('../models/UniversalUsers')
const { errorResponseWithHTTPStatus, successResponse } = require('../utils/index')
const { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } = require('../utils/http.status')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const Website = require('../models/Website')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')


router.get('/get-model-list', async (req, res) => {
    try {
        const email = _.get(req, 'query.email', '')
        const currentDomain = _.get(req, 'query.domain', '')
        const requestFrom = _.get(req, 'query.requestFrom', '')
        if (_.isEmpty(email) || Validator.isEmail(email) === false) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)
        const websiteList = await UniversalUsers.findOne({ email: email })
        const modelList = []

        if (websiteList !== null) {
            for (const website of websiteList.universal_login_merged_domains) {
                const websiteStatus = await Website.findOne({ status: { $in: ['published', 'live'] }, website_url: website })
                if (_.isEmpty(websiteStatus) === false) {
                    const encodedEmail = encodeURIComponent(email)
                    const baseUrl = getWebsiteDomain(website)
                    const apiUrl = `${baseUrl}/api/universal-chat/get-model-details?token=${API_STATIC_AUTH_TOKEN}&email=${encodedEmail}&requestFrom=${requestFrom}`
                    try {
                        const result = await axios.get(apiUrl)
                        if (_.isEmpty(result.data.data) === false) {
                            const data = { ...result.data.data, website_id: websiteStatus.website_id }
                            modelList.push(data)
                        }
                    } catch (error) {
                        const errorData = _.get(error, 'response.data', error)
                        console.log(errorData)
                    }
                }
            }
        } else {
            const websiteStatus = await Website.findOne({ status: { $in: ['published', 'live'] }, website_url: currentDomain })
            if (_.isEmpty(websiteStatus) === false) {
                const encodedEmail = encodeURIComponent(email)
                const baseUrl = getWebsiteDomain(currentDomain)
                const apiUrl = `${baseUrl}/api/universal-chat/get-model-details?token=${API_STATIC_AUTH_TOKEN}&email=${encodedEmail}&requestFrom=${requestFrom}`
                try {
                    const result = await axios.get(apiUrl)
                    if (_.isEmpty(result.data.data) === false) {
                        const data = { ...result.data.data, website_id: websiteStatus.website_id }
                        modelList.push(data)
                    }
                } catch (error) {
                    const errorData = _.get(error, 'response.data', error)
                    console.log(errorData)
                }
            }
        }

        if (modelList.length === 1) {
            modelList[0].website_id = 1
        }
        return successResponse(res, modelList, 'Get model list successfully', 200)
    } catch (error) {
        const errorMessage = _.get(error, 'message', 'Error while get model list')
        return errorResponseWithHTTPStatus(res, { message: errorMessage }, 'Error while get model list', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

module.exports = router
