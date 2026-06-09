const express = require('express')
const router = express.Router()
const ChargebackBlockUserLog = require('../models/ChargebackBlockUserLog')
const Joi = require('joi')
const moment = require('moment')
const _ = require('lodash')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')

const blockUserLogSchema = Joi.object({
    domain: Joi.string().required(),
    user_id: Joi.string().required(),
    email: Joi.string().required(),
    subscription_id: Joi.string().required(),
    chargeback_reason: Joi.string().required(),
    chargeback_date: Joi.string().required()
})

router.post('/add-log', async (req, res) => {
    try {
        await blockUserLogSchema.validateAsync(req.body)
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }

    const data = {
        domain: req.body.domain,
        user_id: req.body.user_id,
        email: req.body.email,
        subscription_id: req.body.subscription_id,
        chargeback_reason: req.body.chargeback_reason,
        chargeback_date: req.body.chargeback_date
    }

    const chargebackBlockUserLog = new ChargebackBlockUserLog(data)
    await chargebackBlockUserLog.save()

    return res.send({ status: true })
})

router.post('/get-log', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const currentPage = parseInt(req.body.page, 10)
    const query = {}
    const filter = req.body.filter
    if (filter.start_date !== '' && filter.end_date !== '') {
        const dateStart = moment(filter.start_date, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00')
        const dateEnd = moment(filter.end_date, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59')
        query.createdAt = {
            $gte: new Date(dateStart),
            $lte: new Date(dateEnd)
        }
    }

    const limit = Number(filter.limit)
    const domain = _.get(filter, 'domain', '')
    if (domain !== '') {
        query.domain = domain
    }

    const user_id = _.get(filter, 'user_id', '')
    if (user_id !== '') {
        query.user_id = user_id
    }

    const email = _.get(filter, 'email', '')
    if (email !== '') {
        query.email = email
    }

    const subscription_id = _.get(filter, 'subscription_id', '')
    if (subscription_id !== '') {
        query.subscription_id = subscription_id
    }

    const totalRows = await ChargebackBlockUserLog.countDocuments(query)
    const totalPages = Math.ceil(totalRows / limit)

    const offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await ChargebackBlockUserLog.find(query).skip(offset).limit(limit).sort({ createdAt: -1 })
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
