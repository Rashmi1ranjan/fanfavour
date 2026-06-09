const express = require('express')
const router = express.Router()
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const WebsiteAverageEarnings = require('../models/WebsiteAverageEarnings')
const WebsiteIsSubscribedEverUsers = require('../models/WebsiteIsSubscribedEverUsers')
const WebsiteSubscribers = require('../models/WebsiteSubscribers')
const { errorResponse, successResponse } = require('../utils')
const _ = require('lodash')

router.post('/', async (req, res) => {
    try {
        const token = req.query.token

        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponse(res, 'error', 'Invalid Request', 500)
        }

        const type = _.get(req.body, 'type', false)

        if (type === 'is_subscribed_ever_users') {
            const userData = []
            for (let i = 0; i < req.body.users.length; i++) {
                const user = req.body.users[i]

                const data = {
                    domain: req.body.domain,
                    email: user.email
                }

                userData.push(data)
            }
            await WebsiteIsSubscribedEverUsers.insertMany(userData)
            return successResponse(res, {}, 'Saved users in services', 200)
        }

        if (type === 'free_paid_subscribers') {
            const reqBody = req.body
            const subscribers = {
                domain: reqBody.domain,
                free_subscribers: reqBody.free_subscribers,
                paid_subscribers: reqBody.paid_subscribers
            }

            await new WebsiteSubscribers(subscribers).save()
            return successResponse(res, {}, 'Saved users in services', 200)
        }

        const domain = req.body.domain
        const existingWebsiteAverageEarnings = await WebsiteAverageEarnings.findOne({ domain })

        if (existingWebsiteAverageEarnings === null) {
            const data = {
                domain: req.body.domain,
                data: req.body.data
            }

            const newWebsiteAverageEarning = new WebsiteAverageEarnings(data)
            await newWebsiteAverageEarning.save()
        } else {
            existingWebsiteAverageEarnings.domain = domain
            existingWebsiteAverageEarnings.data = req.body.data

            await existingWebsiteAverageEarnings.save()
        }

        return successResponse(res, {}, 'Website average earnings saved', 200)
    } catch (error) {
        return errorResponse(res, error, 'Invalid Request', 500)
    }
})

module.exports = router
