const express = require('express')
const InfluencerActivity = require('../models/influencerActivity')
const WebsiteUserDetails = require('../models/WebsiteUserDetails')
const { errorResponse, successResponse } = require('./../utils/index')
const { protectRouteWithRole, SUPER_ADMIN } = require('./../middleware/auth.middleware')

const router = express.Router()


router.post('/get-influencer-activity', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        const query = {}
        if (req.body.domain !== '') {
            query.domain = req.body.domain
        }

        let currentPage = parseInt(req.body.page_num, 10)
        const totalRows = await InfluencerActivity.countDocuments(query)
        let limit = 20
        let totalPages = Math.ceil(totalRows / limit)
        let offset = (currentPage - 1) * limit
        let rows = []
        let sortBy = { 'domain': 1 }
        if (req.body.sortBy) {
            sortBy = { [`${req.body.sortBy.key}`]: req.body.sortBy.direction }
        }

        if (totalRows > 0) {
            rows = await InfluencerActivity.find(query).skip(offset).limit(limit).sort(sortBy)
        }

        const data = {
            rows,
            totalPages,
            currentPage,
            totalRows,
            limit
        }
        return successResponse(res, data, 'Get website influencer activity successfully', 200)
    } catch (error) {
        return errorResponse(res, error, 'Error in get website influencer activity', 500)
    }
})

router.get('/get-user-statistics', async (req, res) => {
    try {
        const domain = req.query.domain
        let websiteUserDetails = await WebsiteUserDetails.findOne({ domain: domain })
        if (websiteUserDetails === null) {
            websiteUserDetails = {
                registered: 0,
                subscribed_ever: 0,
                active_cancelled_subscription: 0,
                active_subscription: 0,
                recently_visited_all: 0,
                recently_visited_subscribers_7: 0,
                recently_visited_subscribers_45: 0,
                recently_visited_active_cancelled_7: 0,
                recently_visited_active_cancelled_45: 0,
                average_monthly_revenue: 0,
                block_users: 0,
                domain
            }
        }
        return successResponse(res, websiteUserDetails, 'Get website user statistics successfully', 200)
    } catch (error) {
        return errorResponse(res, error, 'Error in get website user statistics', 500)
    }
})

module.exports = router
