const express = require('express')
const router = express.Router()
const moment = require('moment')
const _ = require('lodash')
// Use for Subscription Statistics page count
const SubscriptionStatistics = require('../models/ActiveUserCount')
const { SUPER_ADMIN, ROLE_SUPPORT, protectRouteWithRole } = require('../middleware/auth.middleware')
const { errorResponse, successResponse, getDatesArray } = require('../utils')

/**
 *
 * @param {Date} start_date end_date
 * @param {string} domain domain
 * @returns {object} Subscription Statistics
 */
async function getSubscriptionStatistics(start_date, domain = '') {
    try {
        const filter = {
            target_date: new Date(start_date)
        }

        if (domain !== '') {
            filter.domain = domain
        }

        const subscriptionStatistics = await SubscriptionStatistics.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    active: {
                        $sum: '$active'
                    },
                    active_cancelled: {
                        $sum: '$active_cancelled'
                    },
                    rebill_failed: {
                        $sum: '$rebill_failed'
                    }
                }
            }
        ])

        const active = _.get(subscriptionStatistics, '[0].active', 0)
        const activeCancelled = _.get(subscriptionStatistics, '[0].active_cancelled', 0)
        const rebillFailed = _.get(subscriptionStatistics, '[0].rebill_failed', 0)

        const data = {
            date: moment(start_date).format('M/D'),
            activeUsers: active,
            activeCancelledUsers: activeCancelled,
            rebillFailedUsers: rebillFailed
        }
        return data
    } catch (err) {
        console.log(err)
        console.log(err.message)
        return
    }
}

router.post('/', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const filter = req.body
        const domain = _.get(filter, 'domain', [])
        const start_date = _.get(filter, 'start_date', '')
        const end_date = _.get(filter, 'end_date', '')
        const startDate = start_date === '' ? moment().subtract(29, 'days').format('MM/DD/YYYY') : start_date
        const endDate = end_date === '' ? moment().format('MM/DD/YYYY') : end_date

        const dateStart = moment(startDate, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00')
        const dateEnd = moment(endDate, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00')
        const allDates = getDatesArray(dateStart, dateEnd)

        const activeUsersCount = []
        if (domain.length > 1) {
            for (const website of domain) {
                let activeUserCount = []
                for (const date of allDates) {
                    const start = date
                    const allUserCount = await getSubscriptionStatistics(start, website)
                    activeUserCount.push(allUserCount)
                }
                activeUsersCount.push(activeUserCount)
            }
        } else {
            for (const date of allDates) {
                const website = _.get(filter, 'domain[0]', '')
                const activeUser = await getSubscriptionStatistics(date, website)
                activeUsersCount.push(activeUser)
            }
        }
        return successResponse(res, activeUsersCount, 'fetch active user count successfully', 200)
    } catch (error) {
        console.log(error)
        return errorResponse(res, error, error.message, 500)
    }
})

module.exports = router
