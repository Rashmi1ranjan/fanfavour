const express = require('express')
const router = express.Router()
const ActiveSubscribers = require('../models/ActivePayingSubscribersCount')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const { errorResponse, successResponse } = require('../utils')
const moment = require('moment')
const _ = require('lodash')
const Website = require('../models/Website')
const ActiveUserCountIn90Days = require('../models/ActiveUserCountIn90Days')

router.post('/', async (req, res) => {
    try {
        const token = req.query.token
        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponse(res, { error: 'You are not authorized' }, 'Unauthorized', 401)
        }

        const domain = req.body.domain
        const subscriberCounts = req.body.subscriberCounts

        if (_.isEmpty(domain) || !_.isNumber(subscriberCounts)) {
            return errorResponse(res, { error: 'Invalid data' }, 'Invalid data', 400)
        }

        await removeCountIfExist(req.body.domain)

        const website = Website.findOne({ website_url: domain }, 'status')

        if (website.status !== 'removed') {
            const data = {
                domain: req.body.domain,
                active: req.body.subscriberCounts,
                target_date: moment().format('YYYY-MM-DDT00:00:00.000Z')
            }

            const activeSubscribers = new ActiveSubscribers(data)
            await activeSubscribers.save()
        }

        return successResponse(res, { message: 'Record added successfully' }, 'Record added successfully', 200)
    } catch (err) {
        return errorResponse(res, { error: err.message }, 'Internal server error', 500)
    }
})

/**
 * Remove record for same domain if exist
 *
 * @param {string} domain Website domain
 */
async function removeCountIfExist(domain) {
    await ActiveSubscribers.deleteMany({ domain: domain, target_date: moment().format('YYYY-MM-DDT00:00:00.000Z') })
}

router.post('/active-users-in-the-last-90-days', async (req, res) => {
    try {
        const token = req.query.token
        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponse(res, { error: 'You are not authorized' }, 'Unauthorized', 401)
        }

        const domain = req.body.domain
        const users = req.body.users

        if (_.isEmpty(domain) || !_.isNumber(users)) {
            return errorResponse(res, { error: 'Invalid data' }, 'Invalid data', 400)
        }

        const website = Website.findOne({ website_url: domain }, 'status')

        if (website.status !== 'removed') {
            const activeSubscribers = await ActiveUserCountIn90Days.findOne({ domain: domain })

            if (!activeSubscribers) {
                const data = {
                    domain: req.body.domain,
                    active_users: req.body.users,
                    total_amount_spent: req.body.totalAmountSpent,
                    total_active_paying_subscribers: req.body.totalActivePayingSubscribers,
                    total_active_cancelled_paying_subscribers: req.body.totalActiveCancelledPayingSubscribers
                }

                const activeSubscribers = new ActiveUserCountIn90Days(data)
                await activeSubscribers.save()
            } else {
                activeSubscribers.active_users = req.body.users
                activeSubscribers.total_amount_spent = req.body.totalAmountSpent
                activeSubscribers.total_active_paying_subscribers = req.body.totalActivePayingSubscribers
                activeSubscribers.total_active_cancelled_paying_subscribers = req.body.totalActiveCancelledPayingSubscribers
                await activeSubscribers.save()
            }
        }

        return successResponse(res, { message: 'Active subscribers data saved successfully' }, 'Active subscribers data saved successfully', 200)
    } catch (err) {
        return errorResponse(res, { error: err.message }, 'Internal server error', 500)
    }
})

module.exports = router
