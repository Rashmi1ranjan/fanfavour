const express = require('express')
const router = express.Router()
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const WebsiteDataDump = require('../models/WebsiteDataDump')
const { errorResponse, successResponse } = require('../utils')


router.post('/', async (req, res) => {
    try {
        const token = req.query.token

        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponse(res, {}, 'You are not authorized', 401)
        }

        const domain = req.body.domain
        const existingWebsiteDataDump = await WebsiteDataDump.findOne({ domain })
        if (existingWebsiteDataDump === null) {
            const data = {
                domain: req.body.domain,
                data: req.body.data
            }

            const newWebsiteDataDump = new WebsiteDataDump(data)
            await newWebsiteDataDump.save()
        } else {
            existingWebsiteDataDump.domain = domain
            existingWebsiteDataDump.data = req.body.data

            await existingWebsiteDataDump.save()
        }

        return successResponse(res, {}, 'Get Website Data Dump', 200)
    } catch (error) {
        return errorResponse(res, error, 'Invalid Request', 500)
    }
})

module.exports = router
