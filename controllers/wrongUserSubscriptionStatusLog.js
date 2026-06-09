const express = require('express')
const _ = require('lodash')
const router = express.Router()
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const WrongUserSubscriptionStatus = require('../models/WrongUserSubscriptionStatusLog')
const { successResponse, errorResponse } = require('../utils/index')

router.post('/get-wrong-subscription-status-users', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const is_fixed = _.get(req, 'body.is_fixed', 'false')
    const query = {
        is_fixed: is_fixed === 'false' ? { $ne: true } : true
    }
    if (req.body.website_url !== '') {
        query.website_url = req.body.website_url
    }

    if (req.body.user_id !== '') {
        query.user_id = req.body.user_id
    }

    if (req.body.transaction_type !== 'all') {
        query.transaction_type = req.body.transaction_type
    }

    const currentPage = parseInt(req.body.page, 10)
    const totalRows = await WrongUserSubscriptionStatus.countDocuments(query)
    const limit = 20
    const totalPages = Math.ceil(totalRows / limit)
    const offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await WrongUserSubscriptionStatus.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit)
    }

    const response = {
        rows,
        totalPages,
        currentPage,
        totalRows,
        limit
    }
    return successResponse(res, response, 'User list', 200)
})

router.post('/fix-wrong-user-subscription-status', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const { id } = req.body
        const userSubscriptionStatusLog = await WrongUserSubscriptionStatus.findById(id)

        userSubscriptionStatusLog.is_fixed = true
        await userSubscriptionStatusLog.save()

        return successResponse(res, { status: true }, 'Log successfully mark as processed', 400)
    } catch (error) {
        console.log(error)
        return errorResponse(res, { status: false }, 'Error in update log', 400)
    }
})

module.exports = router
