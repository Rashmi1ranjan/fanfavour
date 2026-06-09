const express = require('express')
const router = express.Router()
const StickyIoTransactionLog = require('../models/StickyIoTransactionLog')
const Joi = require('joi')
const _ = require('lodash')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const moment = require('moment')
const mongoose = require('mongoose')
const momentTZ = require('moment-timezone')

const stickyIoTransactionLogSchema = Joi.object({
    domain: Joi.string().required(),
    user_id: Joi.string().required(),
    transaction_type: Joi.string().required(),
    is_recurring: Joi.boolean().required(),
    request_url: Joi.string().required(),
    request_data: Joi.object().required(),
    transaction_status: Joi.string().required(),
    sticky_io_response: Joi.object().required(),
    transaction_for: Joi.string().required(),
    ip_address: Joi.string().allow(null, '')
})

router.post('/logs', async (req, res) => {
    try {
        await stickyIoTransactionLogSchema.validateAsync(req.body)
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }

    const filterForLastLog = {
        domain: req.body.domain,
        user_id: req.body.user_id
    }

    const lastTransactionForUser = await StickyIoTransactionLog.findOne(filterForLastLog).sort({ _id: -1 })
    if (
        lastTransactionForUser !== null &&
        lastTransactionForUser.transaction_status === 'FAILURE' &&
        req.body.transaction_status === 'FAILURE'
    ) {
        req.body.is_unique = false
    } else {
        req.body.is_unique = true
    }
    const stickyIoTransactionLogData = new StickyIoTransactionLog(req.body)
    await stickyIoTransactionLogData.save()
    return res.send({ status: true })
})

router.post('/get_sticky_io_success_error_logs', async (req, res) => {
    let currentPage = parseInt(req.body.page, 10)
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

    const isRecurring = _.get(filter, 'is_recurring', 'all')
    if (isRecurring !== 'all') {
        query.is_recurring = isRecurring === 'true' ? true : { $ne: true }
    }

    const transactionStatus = _.get(filter, 'transaction_status', 'all')
    if (transactionStatus !== 'all') {
        query.transaction_status = transactionStatus
    }

    const transactionFor = _.get(filter, 'transaction_for', 'all')
    if (transactionFor !== 'all') {
        query.transaction_for = transactionFor
    }

    const ipAddress = _.get(filter, 'ip_address', 'all')
    if (ipAddress !== '') {
        query.ip_address = ipAddress
    }

    const user_id = _.get(filter, 'user_id', '')
    if (user_id !== '' && mongoose.Types.ObjectId.isValid(user_id) === true) {
        query.user_id = new mongoose.Types.ObjectId(user_id)
    }

    const orderId = _.get(filter, 'order_id', '')
    if (orderId !== '') {
        query['sticky_io_response.order_id'] = orderId
    }

    const transactionId = _.get(filter, 'transaction_id', '')
    if (transactionId !== '') {
        query['sticky_io_response.transactionID'] = transactionId
    }

    const authId = _.get(filter, 'auth_id', '')
    if (authId !== '') {
        query['sticky_io_response.authId'] = authId
    }

    const gatewayId = _.get(filter, 'gateway_id', 'all')
    if (gatewayId !== 'all') {
        query['sticky_io_response.gateway_id'] = gatewayId
    }

    const isUnique = _.get(filter, 'is_unique', false)
    if (isUnique === true) {
        query.is_unique = true
    }

    const totalRows = await StickyIoTransactionLog.countDocuments(query)
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await StickyIoTransactionLog.find(query)
            .skip(offset).limit(limit).sort({ 'createdAt': 'desc' })
    }
    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

router.post('/get_summary_report_detail', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const limit = Number(req.body.limit)
    const transactionFor = req.body.transaction_for

    let transactionForFilter
    if (transactionFor.length > 0) {
        transactionForFilter = transactionFor.map((option) => option.value)
    } else {
        transactionForFilter = ['feed_unlock', 'chat_unlock', 'subscription', 'tip', 'cancel_subscription', 'void_transaction', 'refund_transaction']
    }

    const query = {
        transaction_for: { $in: transactionForFilter }
    }
    if (req.body.is_recurring !== 'all') {
        query.is_recurring = req.body.is_recurring === 'true' ? true : false
    }

    const gateway_id = _.get(req.body, 'gateway_id', 'all')
    if (gateway_id !== 'all') {
        query['sticky_io_response.gateway_id'] = gateway_id
    }

    const domain = _.get(req.body, 'domain', false)
    if (domain && domain !== '') {
        query.domain = domain
    }

    const sort = {
        $sort: { _id: -1 }
    }

    const row1CountDocument = await StickyIoTransactionLog.find(query).sort({ _id: -1 }).limit(limit).countDocuments()
    const newLimit = (limit <= row1CountDocument) ? limit : row1CountDocument
    const row1 = await StickyIoTransactionLog.aggregate([sort,
        { $match: query },
        { $limit: limit },
        {
            $group: {
                '_id': '$transaction_status',
                'count': {
                    '$sum': 1
                }
            }
        }, {
            $sort: {
                _id: -1
            }
        }, {
            $project: {
                _id: 1,
                count: 1,
                transaction_for: 1,
                'percentage': { $divide: [{ $multiply: [100, '$count'] }, newLimit] }
            }
        }
    ])

    const rows = []
    for (const element of row1) {
        if (element._id === 'SUCCESS') {
            element._id = 'success'
        } else {
            element._id = 'failed'
        }
        rows.push(element)
    }

    const declineTransactions = await StickyIoTransactionLog.aggregate([sort,
        { $match: query },
        { $limit: limit },
        { $match: { transaction_status: 'FAILURE' } },
        {
            $group: {
                '_id': {
                    'response_code': '$sticky_io_response.response_code',
                    'provider_type': '$sticky_io_response.provider_type',
                    'provider_name': '$sticky_io_response.provider_name',
                    'error_message': '$sticky_io_response.error_message'
                },
                'count': {
                    '$sum': 1
                },
                'error_message': { '$first': '$sticky_io_response.error_message' },
                'provider_type': { '$first': '$sticky_io_response.provider_type' },
                'provider_name': { '$first': '$sticky_io_response.provider_name' },
                'transaction_for': { '$first': '$transaction_for' }
            }
        }, {
            $sort: {
                _id: -1
            }
        }, {
            $project: {
                _id: 1,
                count: 1,
                transaction_for: 1,
                percentage: { $divide: [{ $multiply: [100, '$count'] }, newLimit] },
                error_message: 1,
                provider_name: 1,
                provider_type: 1
            }
        }
    ])

    const declineTransactionLogs = []
    for (const declineTransaction of declineTransactions) {
        const errorMessage = declineTransaction.error_message || ''
        const errorMessageRefIdIndex = errorMessage.indexOf('REFID')
        const errorRef = errorMessage.substring(errorMessageRefIdIndex)
        const errorWithoutRefId = errorMessageRefIdIndex !== -1 ? errorMessage.replace(errorRef, '') : errorMessage

        declineTransaction.error_message = errorWithoutRefId
        const filterLogIndex = declineTransactionLogs.findIndex(logs => (logs.error_message === errorWithoutRefId && logs._id.response_code === declineTransaction._id.response_code))
        if (filterLogIndex === -1) {
            declineTransactionLogs.push(declineTransaction)
        } else {
            declineTransactionLogs[filterLogIndex].percentage = declineTransactionLogs[filterLogIndex].percentage + declineTransaction.percentage
            declineTransactionLogs[filterLogIndex].count = declineTransactionLogs[filterLogIndex].count + declineTransaction.count
        }
    }

    const declineLog = _.orderBy(declineTransactionLogs, 'percentage', 'desc')
    const results = {
        transaction_summary: rows,
        decline_transaction_summary: declineLog
    }
    return res.send(results)
})


router.post('/get_recent_transaction', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    // recurring and non-recurring last successful transaction for
    const domain = _.get(req.body, 'domain', false)
    const transactionType = _.get(req.body, 'transactionType', '')
    const select = {
        domain: 1,
        transaction_for: 1,
        createdAt: 1,
        request_data: 1
    }

    const startOfToday = momentTZ().tz('America/Phoenix').startOf('day').toDate()
    const endOfToday = momentTZ().tz('America/Phoenix').endOf('day').toDate()

    const queryRecentSubscriptionTransaction = { is_recurring: true, transaction_status: 'SUCCESS', transaction_for: { $nin: ['add_new_card', 'authorize_payment'] }, createdAt: { $gte: startOfToday, $lte: endOfToday } }
    if (domain !== false && domain !== '') {
        queryRecentSubscriptionTransaction.domain = domain
    }
    const recentSubscriptions = await StickyIoTransactionLog.find(queryRecentSubscriptionTransaction, select).sort({ createdAt: -1 })

    const transactionForFilter = ['feed_unlock', 'chat_unlock', 'tip', 'chat_pay_per_message']
    const queryRecentContentPurchase = { is_recurring: false, transaction_status: 'SUCCESS', transaction_for: { $in: transactionForFilter }, createdAt: { $gte: startOfToday, $lte: endOfToday } }
    if (domain !== false && domain !== '') {
        queryRecentContentPurchase.domain = domain
    }
    if (_.isEmpty(transactionType) === false) {
        let type = ''
        switch (transactionType) {
            case 'blog':
                type = 'feed_unlock'
                break
            case 'chat':
                type = 'chat_unlock'
                break
            case 'tips':
                type = 'tip'
                break
            case 'chat_pay_per_message':
                type = 'pay_per_message'
                break
            default:
                type = transactionType
                break
        }
        queryRecentContentPurchase['request_data.AFID'] = type
    }
    const recentContentPurchase = await StickyIoTransactionLog.find(queryRecentContentPurchase, select).sort({ createdAt: -1 })

    const data = [...recentSubscriptions, ...recentContentPurchase]
    const totalTransactionAmount = data.reduce((sum, item) => {
        const amount = _.get(item, 'request_data.offers[0].price', 0)
        const trial = _.get(item, 'request_data.offers[0].trial.price', 0)

        const price = amount || trial || 0
        return sum + parseFloat(price)
    }, 0)

    const result = {
        recent_subscription: recentSubscriptions,
        recent_content_purchase: recentContentPurchase,
        totalAmount: totalTransactionAmount
    }
    return res.send(result)
})


module.exports = router
