const express = require('express')
const router = express.Router()
const CCBillRestApiOauthErrorLog = require('../models/CCBillRestApiOauthErrorLog')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const Joi = require('joi')

const saveOauthErrorLogSchema = Joi.object({
    domain: Joi.string().required(),
    user_id: Joi.string().required(),
    email: Joi.string().required(),
    ccbill_response: Joi.object().required()
})

router.post('/add-log', async (req, res) => {
    try {
        await saveOauthErrorLogSchema.validateAsync(req.body)
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }

    const data = {
        domain: req.body.domain,
        user_id: req.body.user_id,
        email: req.body.email,
        ccbill_url: req.body.ccbill_response.url,
        ccbill_error_message: req.body.ccbill_response.generalMessage,
        ccbill_error_code: req.body.ccbill_response.errorCode,
        ccbill_response: req.body.ccbill_response
    }

    const ccbillRestApiOauthErrorLog = new CCBillRestApiOauthErrorLog(data)
    await ccbillRestApiOauthErrorLog.save()
    return res.send({ status: true })
})

router.post('/get-log', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const data = req.body
    let query = {}

    if (data.domain !== '') {
        query.domain = data.domain
    }

    if (data.email !== '') {
        query.email = data.email
    }

    if (data.user_id !== '') {
        query.user_id = data.user_id
    }

    const totalRows = await CCBillRestApiOauthErrorLog.countDocuments(query)

    let currentPage = parseInt(req.query.page_num, 10)
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await CCBillRestApiOauthErrorLog.find(query).skip(offset).limit(limit).sort({ createdAt: -1 })
    }

    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

module.exports = router
