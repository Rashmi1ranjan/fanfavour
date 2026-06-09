const express = require('express')
const router = express.Router()
const _ = require('lodash')
const { HTTP_OK_200, HTTP_INTERNAL_SERVER_ERROR_500, HTTP_UNAUTHORIZED_401 } = require('../utils/http.status')
const { successResponse, errorResponseWithHTTPStatus } = require('../utils')
const PayingUserAnalytics = require('../models/PayingUserAnalytics')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const Website = require('../models/Website')

router.post('/save-paying-user-count-analytics', async (req, res) => {
    try {
        const token = req.query.token
        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponseWithHTTPStatus(res, { error: 'You are not authorized' }, 'Unauthorized', HTTP_UNAUTHORIZED_401)
        }

        const { domain, payingSubscribers } = req.body
        let payingUserAnalytics = {}

        const website = await Website.findOne({ website_url: domain }, 'status')

        if (!_.isEmpty(website) && website.status !== 'removed') {
            for (let index = 0; index < payingSubscribers.length; index++) {
                const element = payingSubscribers[index]
                const isWebsiteAnalyticsExist = await PayingUserAnalytics.findOne({ domain: domain, month_year: element._id })

                if (!_.isEmpty(isWebsiteAnalyticsExist)) {
                    await PayingUserAnalytics.updateOne({ domain: domain, month_year: element._id }, {
                        $set: {
                            total_paying_users: element.total_paying_users,
                            new_paying_users: element.new_paying_users,
                            new_registrations: element.new_registrations
                        }
                    })
                } else {
                    payingUserAnalytics = new PayingUserAnalytics({
                        domain: domain,
                        total_paying_users: element.total_paying_users,
                        month_year: element._id,
                        new_paying_users: element.new_paying_users,
                        new_registrations: element.new_registrations
                    })
                    await payingUserAnalytics.save()
                }
            }
        }

        return successResponse(res, payingUserAnalytics, 'Paying user count analytics saved.', HTTP_OK_200)
    } catch (error) {
        return errorResponseWithHTTPStatus(res, error, 'Error in save paying user count analytics', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/save-new-paying-user-count-analytics', async (req, res) => {
    try {
        const token = req.query.token
        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponseWithHTTPStatus(res, { error: 'You are not authorized' }, 'Unauthorized', HTTP_UNAUTHORIZED_401)
        }

        const { domain, newPayingSubscribers } = req.body
        let payingUserAnalytics = {}

        const website = await Website.findOne({ website_url: domain }, 'status')

        if (!_.isEmpty(website) && website.status !== 'removed') {
            for (let index = 0; index < newPayingSubscribers.length; index++) {
                const element = newPayingSubscribers[index]
                const isWebsiteAnalyticsExist = await PayingUserAnalytics.findOne({ domain: domain, month_year: element.month })

                if (!_.isEmpty(isWebsiteAnalyticsExist)) {
                    await PayingUserAnalytics.updateOne({ domain: domain, month_year: element.month }, {
                        $set: {
                            new_paying_users: element.new_paying_users,
                            new_registrations: element.new_registrations
                        }
                    })
                } else {
                    payingUserAnalytics = new PayingUserAnalytics({
                        domain: domain,
                        month_year: element.month,
                        new_paying_users: element.new_paying_users,
                        new_registrations: element.new_registrations
                    })
                    await payingUserAnalytics.save()
                }
            }
        }

        return successResponse(res, payingUserAnalytics, 'Paying user count analytics saved.', HTTP_OK_200)
    } catch (error) {
        console.log(error)
        return errorResponseWithHTTPStatus(res, error, 'Error in save paying user count analytics', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

module.exports = router
