const express = require('express')
const router = express.Router()
const CCBillDuplicateSubscriptionAttemptLog = require('../models/CCbillDuplicateSubscriptionLog')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const Joi = require('joi')

const addDuplicateSubscriptionLogSchema = Joi.object({
    domain: Joi.string().required(),
    user_id: Joi.string().required(),
    email: Joi.string().required(),
    card_id: Joi.string().required(),
    card_last_four_digits: Joi.string().required(),
    exist_in_collection: Joi.string().required(),
    request_from: Joi.string(),
    card_decline_reason: Joi.string(),
    payment_gateway: Joi.string()
})

router.post('/save-log', async (req, res) => {
    try {
        await addDuplicateSubscriptionLogSchema.validateAsync(req.body)
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }

    const data = {
        domain: req.body.domain,
        user_id: req.body.user_id,
        email: req.body.email,
        card_id: req.body.card_id,
        card_last_four_digits: req.body.card_last_four_digits,
        exist_in_collection: req.body.exist_in_collection,
        request_from: req.body.request_from
    }

    if (req.body.card_decline_reason !== undefined) {
        data.card_decline_reason = req.body.card_decline_reason
    }

    if (req.body.payment_gateway !== undefined) {
        data.payment_gateway = req.body.payment_gateway
    }

    const ccbillErrorLogDescriptionData = new CCBillDuplicateSubscriptionAttemptLog(data)
    await ccbillErrorLogDescriptionData.save()
    return res.send({ status: true })
})

router.post('/all-log', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const data = req.body
    let query = {
        is_processed: data.is_processed === 'true' ? true : false
    }

    if (data.domain !== '') {
        query.domain = data.domain
    }

    if (data.card_id !== '') {
        query.card_id = data.card_id.trim()
    }

    if (data.user_id !== '') {
        query.user_id = data.user_id.trim()
    }

    if (data.email !== '') {
        query.email = data.email.trim()
    }

    if (data.payment_gateway !== '') {
        query.payment_gateway = data.payment_gateway === 'ccbill' ? { $ne: 'sticky.io' } : data.payment_gateway
    }

    const totalRows = await CCBillDuplicateSubscriptionAttemptLog.countDocuments(query)

    let currentPage = parseInt(req.query.page_num, 10)
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await CCBillDuplicateSubscriptionAttemptLog.find(query).skip(offset).limit(limit).sort({ createdAt: -1 })
    }

    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

router.post('/mark-as-processed', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const data = req.body

    const updateLog = await CCBillDuplicateSubscriptionAttemptLog.findByIdAndUpdate(data.log_id, { is_processed: true })

    if (updateLog == null) {
        return res.send({ status: false, message: 'Error in update log' })
    }
    return res.send({ status: true, message: 'Log successfully mark as processed' })
})

module.exports = router
