const express = require('express')
const router = express.Router()
const CCBillRestApiAddCardLog = require('../models/CCBillRestApiAddCardLog')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const Joi = require('joi')
const moment = require('moment')
const mongoose = require('mongoose')
const _ = require('lodash')
const Sentry = require('@sentry/node')

const addCardLogSchema = Joi.object({
    domain: Joi.string().required(),
    user_id: Joi.string().required(),
    email: Joi.string().required(),
    ip: Joi.string().required(),
    ccbill_response: Joi.object(),
    is_error: Joi.boolean().required(),
    card_last_four_digits: Joi.string().required(),
    card_id: Joi.string().required(),
    name_on_card: Joi.string().required(),
    expire_month: Joi.string().required(),
    expire_year: Joi.string().required(),
    address: Joi.string().required(),
    country: Joi.string(),
    state: Joi.string().allow(null, ''),
    city: Joi.string().allow(null, ''),
    zipcode: Joi.string(),
    card_type: Joi.string(),
    from_subscription: Joi.boolean(),
    is_subscription_success: Joi.boolean(),
    sticky_io_response: Joi.object(),
    payment_gateway: Joi.string(),
    recaptcha_score: Joi.number()
})

router.post('/add-log', async (req, res) => {
    try {
        await addCardLogSchema.validateAsync(req.body)
    } catch (error) {
        console.log('from error', error.message)
        return res.send({ status: false, message: error.message })
    }

    const data = {
        domain: req.body.domain,
        user_id: req.body.user_id,
        email: req.body.email,
        ip: req.body.ip,
        is_error: req.body.is_error,
        card_last_four_digits: req.body.card_last_four_digits,
        card_id: req.body.card_id,
        name_on_card: req.body.name_on_card,
        expire_month: req.body.expire_month,
        expire_year: req.body.expire_year,
        address: req.body.address,
        country: req.body.country,
        state: req.body.state,
        city: req.body.city,
        zipcode: req.body.zipcode,
        card_type: req.body.card_type,
        from_subscription: req.body.from_subscription,
        is_subscription_success: req.body.is_subscription_success,
        recaptcha_score: req.body.recaptcha_score
    }
    if (req.body.payment_gateway === 'sticky.io') {
        data.sticky_io_response = req.body.sticky_io_response
        data.payment_gateway = req.body.payment_gateway
        if (req.body.is_error === true) {
            data.sticky_io_error_message = req.body.sticky_io_response.error_message
            if (_.isArray(data.sticky_io_error_message)) {
                const obj = {
                    response : data.sticky_io_response
                }
                console.log(JSON.stringify(data.sticky_io_error_message))
                Sentry.captureException(obj)
                data.sticky_io_error_message = data.sticky_io_error_message.toString()
            }
            data.sticky_io_error_code = req.body.sticky_io_response.response_code
        }
    } else {
        data.ccbill_response = req.body.ccbill_response
        if (req.body.is_error === true) {
            data.ccbill_error_message = req.body.ccbill_response.generalMessage
            data.ccbill_error_code = req.body.ccbill_response.errorCode
        }
    }

    const ccbillCardErrorLog = new CCBillRestApiAddCardLog(data)
    const saveCardLog = await ccbillCardErrorLog.save()

    // if old record found on same email, domain and from_subscription then update flag is_unique to false
    const query = {
        email: req.body.email,
        domain: req.body.domain,
        from_subscription: req.body.from_subscription,
        _id: { $ne: new mongoose.Types.ObjectId(saveCardLog._id) }
    }
    await CCBillRestApiAddCardLog.updateMany(query, { is_unique: false })

    return res.send({ status: true })
})

router.post('/get-log', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const data = req.body

    const dateStart = moment(data.start_date, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00')
    const dateEnd = moment(data.end_date, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59')
    const query = {
        createdAt: {
            $gte: new Date(dateStart),
            $lte: new Date(dateEnd)
        }
    }

    const reCaptChaIds = _.get(data, 'reCaptCha', [])

    if (reCaptChaIds.length > 0) {
        query.recaptcha_score = { $in: reCaptChaIds }
    }

    if (data.is_error !== '' && data.is_error !== 'all') {
        query.is_error = data.is_error === 'true' ? true : false
    }

    if (data.domain && data.domain.length > 0) {
        if (data.exclude_include_domain === 'exclude') {
            query.domain = { $nin: data.domain }
        } else {
            query.domain = { $in: data.domain }
        }
    }

    if (data.email !== '') {
        query.email = data.email
    }

    if (data.user_id !== '') {
        query.user_id = data.user_id
    }

    const cardId = _.get(data, 'card_id', '')
    if (cardId !== '') {
        query.card_id = cardId
    }

    if (data.countries && data.countries.length > 0) {
        if (data.exclude_include_country === 'exclude') {
            query.country = { $nin: data.countries }
        } else {
            query.country = { $in: data.countries }
        }
    }

    if (data.is_unique === true) {
        query.is_unique = true
    }

    if (data.payment_gateway !== '' && data.payment_gateway !== 'all') {
        query.payment_gateway = data.payment_gateway === 'ccbill' ? { $ne: 'sticky.io' } : 'sticky.io'
    }

    const totalRows = await CCBillRestApiAddCardLog.countDocuments(query)

    let currentPage = parseInt(req.query.page_num, 10)
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await CCBillRestApiAddCardLog.find(query).skip(offset).limit(limit).sort({ createdAt: -1 })
    }

    query.is_subscription_success = true
    const totalSubscribed = await CCBillRestApiAddCardLog.countDocuments(query)

    query.is_error = false
    delete query.is_subscription_success
    const totalSuccess = await CCBillRestApiAddCardLog.countDocuments(query)

    query.is_error = true
    const totalFailed = await CCBillRestApiAddCardLog.countDocuments(query)

    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit,
        totalSuccess: data.is_error === 'true' ? 0 : totalSuccess,
        totalFailed: data.is_error === 'false' ? 0 : totalFailed,
        totalSubscribed: totalSubscribed
    })
})

router.post('/get-log-by-domain', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const data = req.body

    const dateStart = moment(data.start_date, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00')
    const dateEnd = moment(data.end_date, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59')
    const query = {
        createdAt: {
            $gte: new Date(dateStart),
            $lte: new Date(dateEnd)
        }
    }
    if (data.is_unique === true) {
        query.is_unique = true
    }

    if (data.domain !== '') {
        query.domain = data.domain
    }

    if (data.payment_gateway !== '') {
        query.payment_gateway = data.payment_gateway === 'ccbill' ? { $ne: 'sticky.io' } : data.payment_gateway
    }

    const addCardLog = await CCBillRestApiAddCardLog.aggregate([
        { $match: query },
        {
            $group: {
                _id: {
                    domain: '$domain',
                    is_error: '$is_error'
                },
                count: { $sum: 1 }
            }
        }
    ])

    const logData = []
    for (const log of addCardLog) {
        const findObjectIndexInData = logData.findIndex(data => data.domain === log._id.domain)
        let data = {
            domain: '',
            total: 0,
            error: 0,
            success: 0
        }
        if (findObjectIndexInData > -1) {
            data = logData[findObjectIndexInData]
            if (log._id.is_error === false) {
                data.success = log.count
                data.total = data.error + log.count
            } else {
                data.error = log.count
                data.total = data.success + log.count
            }
        } else {
            data.domain = log._id.domain
            if (log._id.is_error === false) {
                data.success = log.count
                data.total = data.error + log.count
            } else {
                data.error = log.count
                data.total = data.success + log.count
            }
            logData.push(data)
        }
    }

    logData.sort((a, b) => b.total - a.total)

    return res.send({
        rows: logData
    })
})

module.exports = router
