const express = require('express')
const router = express.Router()
const TopSpendingUser = require('../models/TopSpendingUser')
const Sentry = require('@sentry/node')
const { errorResponse, successResponse } = require('../utils')

router.post('/store-top-spending-users', async (req, res) => {
    try {
        // Handle case where array is inside a property 'users' or 'data'
        let users = req.body.usersData
        if (!Array.isArray(users) && users.users && Array.isArray(users.users)) {
            users = users.users
        }

        if (!Array.isArray(users) || users.length === 0) {
            return errorResponse(res, 'error', 'Invalid input: Expected an array of users', 400)
        }

        // Use insertMany for batch insertion
        const result = await TopSpendingUser.insertMany(users)

        return successResponse(res, {
            count: result.length
        }, 'Successfully stored top spending users', 200)
    } catch (error) {
        console.error('Error storing top spending users:', error)
        Sentry.captureException(error)
        return errorResponse(res, error, 'Internal Server Error', 500)
    }
})

module.exports = router
