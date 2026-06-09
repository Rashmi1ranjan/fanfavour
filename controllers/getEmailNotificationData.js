const express = require('express')
const router = express.Router()
const _ = require('lodash')
const { API_STATIC_AUTH_TOKEN } = require('./../constants')
const { errorResponseWithHTTPStatus, successResponse } = require('../utils/index')
const Website = require('../models/Website')
const UniversalUsers = require('../models/UniversalUsers')

router.post('/get-website-id', async (req, res) => {
    try {
        const token = _.get(req, 'headers.token', '')
        if (token !== API_STATIC_AUTH_TOKEN) return errorResponseWithHTTPStatus(res, {}, 'You are not authorized', 401)

        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', 400)

        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid domain', 400)
        const universalUser = await UniversalUsers.findOne({ email: email }, 'universal_login_merged_domains')
        const mergeDomainList = _.get(universalUser, 'universal_login_merged_domains', [])
        let websiteId = 1
        if (mergeDomainList.length > 1) {
            const website = await Website.findOne({ website_url: domain }, 'website_id')
            websiteId = website.website_id
        }
        return successResponse(res, { websiteId }, 'Log added successfully')
    } catch (error) {
        console.log(error)
        return errorResponseWithHTTPStatus(res, error, 'There was a problem while store log data', 500)
    }
})

module.exports = router

