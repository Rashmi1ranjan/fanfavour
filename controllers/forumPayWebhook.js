const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const ForumPayWebhook = require('../models/ForumPayWebhook')
const { successResponse, catchResponse } = require('../utils/index')
const { updateWalletTransaction } = require('../utils/forumpay')
const _ = require('lodash')

router.post('/get-webhook', asyncHandler(async (req, res) => {
    try {
        setTimeout(() => {
            updateTransactionStatus(req)
        }, 15000)

        return successResponse(res, {}, 'Webhook Received.')
    } catch (error) {
        return catchResponse(res, {}, 'Error in transaction', 200)
    }
}))

/**
 * @description Update Transaction Status
 * @param {object} req request
 * @returns {boolean} status
 */
async function updateTransactionStatus(req) {
    const webhooksData = new ForumPayWebhook({ body: req.body, query: req.query, created_at: new Date() })
    const saveWebhook = await webhooksData.save()

    const updateTransaction = await updateWalletTransaction(req.body)

    const is_duplicate_webhook = _.get(updateTransaction, 'is_duplicate_webhook', false)
    const is_processed = _.get(updateTransaction, 'is_processed', false)

    if (is_duplicate_webhook === true) {
        saveWebhook.is_duplicate_webhook = true
    }

    if (is_processed === true) {
        saveWebhook.is_processed = true
    }
    await saveWebhook.save()
}

module.exports = router

