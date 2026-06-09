const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_ANALYTICS, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const Website = require('../models/Website')
const { successResponse, catchResponse, getApiAuthToken, postData } = require('../utils/index')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const axios = require('axios')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')

/**
 * @description get All active website listing
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.get('/get-all-websites', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS, ROLE_SUPPORT]), asyncHandler(async (req, res) => {
    try {
        const limit = 10
        let websiteWhere = {
            $or: [
                { status: 'live' },
                { status: 'published' }
            ]
        }
        const project = { website_url: 1, website_id: 1 }
        const totalWebsite = await Website.countDocuments(websiteWhere)

        const totalPages = Math.floor(totalWebsite / limit)
        let allWebsites = []
        for (let page = 0; page <= totalPages; page++) {
            const skip = page * limit
            const websites = await Website.find(websiteWhere, project).sort({ website_id: 1 }).limit(limit).skip(skip)
            for (const website of websites) {
                allWebsites.push(website)
            }
        }
        const data = {
            websites: allWebsites
        }
        return successResponse(res, data, 'Websites', 200)
    } catch (error) {
        return catchResponse(res, {}, 'Error in website get', 200)
    }

}))

/**
 * @description Check Website status
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/check-website-status', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS, ROLE_SUPPORT]), asyncHandler(async (req, res) => {
    try {
        const website_url = req.body.website_url
        const api_url = getWebsiteDomain(website_url)
        let website = {}
        const authTokenHeader = await getApiAuthToken(api_url)
        const userCountUrl = `${api_url}/api/report/website-last-transaction-and-user-date`
        const getWebsiteData = await postData(`${userCountUrl}`, authTokenHeader)
        const websiteData = JSON.parse(getWebsiteData)
        if (websiteData.success === 0 || websiteData === null) {
            website.website_status = 'Offline'
        } else {
            website.website_status = 'Online'
            website.last_registered_user = websiteData.data.last_registered_user
            website.last_transaction_time = websiteData.data.last_transaction_time
            website.version = websiteData.data.version
            website.domain = website_url
        }

        return successResponse(res, website, 'Website Status', 200)
    } catch (error) {
        const website = { website_status: 'Offline' }
        return successResponse(res, website, 'Website Status', 200)
    }
}))

/**
 * @description get All users listing
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/user-lookup', asyncHandler(async (req, res) => {
    try {
        const requestData = req.body
        requestData.token = API_STATIC_AUTH_TOKEN
        let blockedUsers = []
        const website_url = requestData.website_url
        const api_url = getWebsiteDomain(website_url)
        const websiteApiUrl = `${api_url}/api/services/user-lookup`
        const response = await axios.post(websiteApiUrl, requestData)
        const resData = response.data.data
        for (let index = 0; index < resData.length; index++) {
            const userDetail = resData[index]
            blockedUsers.push(userDetail)
        }
        const data = {
            blockedUsers
        }
        return successResponse(res, data, 'Websites', 200)
    } catch (error) {
        return catchResponse(res, {}, 'Error in get block users.', 200)
    }

}))

module.exports = router
