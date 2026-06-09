const express = require('express')
const router = express.Router()
const _ = require('lodash')
const parseString = require('xml2js').parseString
const CCBillErrorLog = require('./../models/CCBillErrorLog')
const moment = require('moment')
const momentTZ = require('moment-timezone')
const asyncHandler = require('express-async-handler')
const { protectAdminRoute, protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const CCBillRestApiAddCardLog = require('../models/CCBillRestApiAddCardLog')
const StickyIoTransactionLog = require('../models/StickyIoTransactionLog')

/**
 * convert xml string to json object
 *
 * @param {string} text xml string
 * @returns {object} json object
 */
function parseXMLString(text) {
    return new Promise((resolve, reject) => {
        parseString(text, async function (error, result) {
            if (error !== null) {
                return reject(error)
            }
            return resolve(result)
        })
    })
}

router.post('/', asyncHandler(async (req, res) => {
    let params = req.body
    let response = params.response

    const result = await parseXMLString(response)
    const results = _.get(result, 'results', false)
    const errorFrom = params.error_from

    let shouldConsiderCCBillError = false
    let isUniqueTransaction = true

    if (req.body.userId !== undefined) {
        const filterForLastLog = {
            domain: req.body.domain,
            user_id: req.body.userId
        }
        const lastLogForUser = await CCBillErrorLog.findOne(filterForLastLog).sort({ _id: -1 })
        const approved = _.get(result, 'results.approved[0]', false)
        if (
            lastLogForUser !== null &&
            lastLogForUser.is_ccbill_error === true &&
            approved === false
        ) {
            isUniqueTransaction = false
        }
    }
    params.is_unique = isUniqueTransaction
    if (errorFrom === 'Charge By Previous') {
        const approved = _.get(result, 'results.approved[0]', false)
        if (approved !== false) {
            params.approved = approved
            params.is_ccbill_error = false

            if (approved === '0') {
                const declineCode = _.get(result, 'results.declineCode[0]', false)
                params.decline_code = declineCode
            }
        } else {
            shouldConsiderCCBillError = true
        }
        params.user_id = params.userId
    } else if (errorFrom === 'Cancel Subscription') {
        if (results === '1') {
            params.is_ccbill_error = false
            params.approved = results
        } else {
            shouldConsiderCCBillError = true
        }
    } else if (errorFrom === 'Get expiration date cron') {
        const subscriptionStatus = _.get(result, 'results.subscriptionStatus[0]', false)
        if (subscriptionStatus !== false) {
            params.is_ccbill_error = false
            params.approved = subscriptionStatus
        } else {
            shouldConsiderCCBillError = true
        }
    }

    if (shouldConsiderCCBillError === true) {
        params.is_ccbill_error = true
        if (results !== false) {
            params.ccbill_error_code = results
        } else if (response.indexOf('504') > 0) {
            params.ccbill_error_code = 504
        } else if (response.indexOf('500') > 0) {
            params.ccbill_error_code = 500
        }
    }

    params.is_recurring = params.isRecurring
    params.created_at = new Date()

    let ccbillErrorLogData = new CCBillErrorLog(params)

    await ccbillErrorLogData.save()

    return res.send({ saved: true })
}))

router.get('/get_logs', async (req, res) => {
    const totalRows = await CCBillErrorLog.countDocuments({})

    let currentPage = parseInt(req.query.page_num, 10)
    let limit = 50
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await CCBillErrorLog.find({}).skip(offset).limit(limit).sort({ 'created_at': 'desc' })
    }

    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

router.post('/get_log_details', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const data = req.body
    let query = {}
    const domain = _.get(data, 'domain', false)
    if (domain && domain !== '') {
        query.domain = domain
    }
    const decline_code = _.get(data, 'decline_code', false)
    if (decline_code && decline_code !== '') {
        query.decline_code = decline_code
    }

    const ccbill_error_code = _.get(data, 'ccbill_error_code', false)
    if (ccbill_error_code && ccbill_error_code !== '') {
        query.ccbill_error_code = ccbill_error_code
    }
    const limit = Number(req.body.limit)
    const errorFrom = req.body.error_type
    const isCcbillError = _.get(data, 'is_ccbill_error', 'all')
    const isRecurring = _.get(data, 'is_recurring', 'all')

    query.error_from = errorFrom
    if (isCcbillError !== '' && isCcbillError !== 'all') {
        query.is_ccbill_error = isCcbillError === 'true' ? true : false
    }

    if (isRecurring !== '' && isRecurring !== 'all') {
        query.is_recurring = isRecurring === 'true' ? true : { $ne: true }
    }

    const is_unique = _.get(data, 'is_unique', false)
    if (is_unique === true) {
        query.is_unique = true
    }

    const totalRows = await CCBillErrorLog.countDocuments(query)
    let currentPage = parseInt(req.query.page_num, 10)

    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        const field = 'domain error_from ccbill_error_code decline_code is_ccbill_error approved created_at is_recurring'
        rows = await CCBillErrorLog.find(query, field).skip(offset).limit(limit).sort({ 'created_at': 'desc' })
    }

    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

router.get('/get_log_detail_by_id', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const id = req.query.id
    let rows = await CCBillErrorLog.findById(id)
    return res.send({
        rows: rows
    })
})

router.post('/get_logs_detail', protectAdminRoute, async (req, res) => {
    let days = 7
    let results = []
    const data = req.body
    let query = {}

    if (data.website_url) {
        query['domain'] = data.website_url
    }
    if (data.type !== 'all') {
        query['error_from'] = data.type
    }

    for (let index = 0; index < days; index++) {
        let targetDate = moment(data.startDate).add(index, 'days').format('YYYY-MM-DD')
        let startDate = targetDate + 'T00:00:00'
        let endDate = targetDate + 'T23:59:59'
        query['created_at'] = { $gte: startDate, $lte: endDate }

        if (data.type === 'all') {
            // success count
            query.response_code = '1'
            query.error_from = 'Charge By Previous'

            let charge_by_previous_success = await CCBillErrorLog.countDocuments(query)

            query.error_from = 'Cancel Subscription'
            let cancel_subscription_success = await CCBillErrorLog.countDocuments(query)

            query.error_from = 'Get expiration date cron'
            let get_expiration_date_cron_success = await CCBillErrorLog.countDocuments(query)

            // fails count
            query.response_code = { $ne: '1' }
            query.error_from = 'Charge By Previous'
            let charge_by_previous_fails = await CCBillErrorLog.countDocuments(query)

            query.error_from = 'Cancel Subscription'
            let cancel_subscription_fails = await CCBillErrorLog.countDocuments(query)

            query.error_from = 'Get expiration date cron'
            let get_expiration_date_cron_fails = await CCBillErrorLog.countDocuments(query)

            let object = {
                date: startDate,
                charge_by_previous_success: charge_by_previous_success,
                charge_by_previous_fails: charge_by_previous_fails,
                cancel_subscription_success: cancel_subscription_success,
                cancel_subscription_fails: cancel_subscription_fails,
                get_expiration_date_cron_success: get_expiration_date_cron_success,
                get_expiration_date_cron_fails: get_expiration_date_cron_fails
            }
            results.push(object)
        } else {
            query.response_code = '1'
            let success = await CCBillErrorLog.countDocuments(query)
            query.response_code = { $ne: '1' }

            let fails = await CCBillErrorLog.countDocuments(query)
            let object = {
                date: startDate
            }

            if (query.error_from === 'Charge By Previous') {
                object['charge_by_previous_success'] = success
                object['charge_by_previous_fails'] = fails
            } else if (query.error_from === 'Cancel Subscription') {
                object['cancel_subscription_success'] = success
                object['cancel_subscription_fails'] = fails
            } else if (query.error_from === 'Get expiration date cron') {
                object['get_expiration_date_cron_success'] = success
                object['get_expiration_date_cron_fails'] = fails
            }
            results.push(object)
        }
    }
    return res.send(results)
})

router.post('/get_ccbill_error_detail', protectAdminRoute, async (req, res) => {
    const limit = Number(req.body.limit)
    const errorFrom = req.body.error_type

    let query = {
        is_ccbill_error: false,
        error_from: errorFrom
    }

    let query2 = {
        is_ccbill_error: false,
        error_from: errorFrom,
        approved: 0
    }

    let query3 = {
        is_ccbill_error: true,
        error_from: errorFrom
    }

    const domain = _.get(req.body, 'domain', false)

    const sort = {
        $sort: { _id: -1 }
    }

    if (domain && domain !== '') {
        query.domain = domain
        query2.domain = domain
        query3.domain = domain
    }

    let row1 = await CCBillErrorLog.aggregate([sort,
        { $match: query },
        { $limit: limit },
        {
            $group: {
                '_id': {
                    'approved': '$approved',
                    'date': {
                        '$dateToString': {
                            'format': '%Y-%m-%d:%H',
                            'date': '$created_at'
                        }
                    }
                },
                'count': {
                    '$sum': 1
                }
            }
        }
    ])

    let row2 = await CCBillErrorLog.aggregate([sort,
        { $match: query2 },
        { $limit: limit },
        {
            $group: {
                _id: {
                    'decline_code': '$decline_code',
                    'date': {
                        '$dateToString': {
                            'format': '%Y-%m-%d:%H',
                            'date': '$created_at'
                        }
                    }
                },
                count: { $sum: 1 }
            }
        }
    ])

    let row3 = await CCBillErrorLog.aggregate([sort,
        { $match: query3 },
        { $limit: limit },
        {
            $group: {
                _id: {
                    'ccbill_error_code': '$ccbill_error_code',
                    'date': {
                        '$dateToString': {
                            'format': '%Y-%m-%d:%H',
                            'date': '$created_at'
                        }
                    }
                },
                count: { $sum: 1 }
            }
        }
    ])

    let results = [row1, row2, row3]
    return res.send(results)
})

router.post('/get_ccbill_summary_report_detail', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const limit = Number(req.body.limit)
    const errorFrom = req.body.error_type

    let query = {
        error_from: errorFrom
    }

    if (req.body.is_recurring !== 'all') {
        query.is_recurring = req.body.is_recurring === 'true' ? true : false
    }

    let query2 = {
        approved: 0
    }

    let query3 = {
        is_ccbill_error: true
    }

    const domain = _.get(req.body, 'domain', false)

    const sort = {
        $sort: { _id: -1 }
    }

    if (domain && domain !== '') {
        query.domain = domain
    }

    let row1CountDocument = await CCBillErrorLog.find(query).countDocuments()
    let newLimit = (limit <= row1CountDocument) ? limit : row1CountDocument

    let row1 = await CCBillErrorLog.aggregate([sort,
        { $match: query },
        { $limit: limit },
        {
            $group: {
                '_id': '$approved',
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
                error_from: 1,
                'percentage': { $divide: [{ $multiply: [100, '$count'] }, newLimit] }
            }
        }
    ])

    let row2 = await CCBillErrorLog.aggregate([sort,
        { $match: query },
        { $limit: limit },
        { $match: query2 },
        {
            $group: {
                _id: '$decline_code',
                count: { $sum: 1 }
            }
        }, {
            $sort: {
                _id: 1
            }
        }, {
            $project: {
                _id: 1,
                count: 1,
                'percentage': { $divide: [{ $multiply: [100, '$count'] }, newLimit] }
            }
        }
    ])

    let row3 = await CCBillErrorLog.aggregate([sort,
        { $match: query },
        { $limit: limit },
        { $match: query3 },
        {
            $group: {
                _id: '$ccbill_error_code',
                count: { $sum: 1 }
            }
        }, {
            $sort: {
                _id: 1
            }
        }, {
            $project: {
                _id: 1,
                count: 1,
                'percentage': { $divide: [{ $multiply: [100, '$count'] }, newLimit] }
            }
        }
    ])
    let rows = []
    for (let element of row1) {
        if (element._id === 1 || element._id === 2) {
            element._id = 'success'
        } else {
            element._id = 'failed'
        }
        if (errorFrom === 'Get expiration date cron') {
            let findIndex = _.findIndex(rows, (result) => {
                return result._id === element._id
            })
            if (findIndex === -1) {
                rows.push(element)
            } else {
                rows[findIndex].count += element.count
                rows[findIndex].percentage += element.percentage
            }
        } else {
            rows.push(element)
        }
    }

    let results = [rows, row2, row3]
    return res.send(results)
})

router.post('/get_dashboard_data', protectAdminRoute, async (req, res) => {
    // recurring and non-recurring last successful transaction for
    const domain = _.get(req.body, 'domain', false)
    const transactionType = _.get(req.body, 'transactionType', '')
    const select = {
        domain: 1,
        error_from: 1,
        created_at: 1,
        url: 1
    }

    const startOfToday = momentTZ().tz('America/Phoenix').startOf('day').toDate()
    const endOfToday = momentTZ().tz('America/Phoenix').endOf('day').toDate()

    const queryLastRecurringTransaction = { is_ccbill_error: false, is_recurring: true, approved: 1, created_at: { $gte: startOfToday, $lte: endOfToday } }
    if (domain !== false && domain !== '') {
        queryLastRecurringTransaction.domain = domain
    }
    const getLastRecurringTransaction = await CCBillErrorLog.find(queryLastRecurringTransaction, select).sort({ created_at: -1 })

    const queryLastCBPTTransaction = { is_ccbill_error: false, is_recurring: false, error_from: 'Charge By Previous', approved: 1, created_at: { $gte: startOfToday, $lte: endOfToday } }
    if (domain !== false && domain !== '') {
        queryLastCBPTTransaction.domain = domain
    }
    if (_.isEmpty(transactionType) === false) {
        let type = ''
        switch (transactionType) {
            case 'pay_per_message':
                type = 'chat_pay_per_message'
                break
            default:
                type = transactionType
                break
        }
        queryLastCBPTTransaction.url = { $regex: type }
    }
    const getLastCBPTTransaction = await CCBillErrorLog.find(queryLastCBPTTransaction, select).sort({ created_at: -1 })

    const data = [...getLastRecurringTransaction, ...getLastCBPTTransaction]
    const totalTransactionAmount = data.reduce((sum, item) => {
        const parsedUrl = new URL(item.url)
        const initialPrice = Number(parsedUrl.searchParams.get('initialPrice')) || 0
        return sum + initialPrice
    }, 0)

    const result = {
        last_recurring_transaction: getLastRecurringTransaction,
        last_cbpt_transaction: getLastCBPTTransaction,
        totalAmount: totalTransactionAmount
    }
    return res.send(result)
})

router.post('/get_dashboard_transaction_data', protectAdminRoute, async (req, res) => {
    const filterLimit = parseInt(_.get(req.body, 'limit', 50))
    const domain = _.get(req.body, 'domain', false)
    const is_unique = _.get(req.body, 'is_unique', 'all')

    const recurringQuery = { error_from: 'Charge By Previous', is_recurring: true }
    if (domain && domain !== '') {
        recurringQuery.domain = domain
    }
    if (is_unique === 'true' || is_unique === true) {
        recurringQuery.is_unique = true
    }
    const recurringTransactions = await CCBillErrorLog.aggregate([
        { $sort: { _id: -1 } },
        { $match: recurringQuery },
        { $limit: filterLimit },
        {
            $group: {
                _id: '$approved',
                count: { '$sum': 1 }
            }
        },
        {
            $project: {
                _id: 1,
                count: 1,
                error_from: 1
            }
        }
    ])

    const recurringSummary = {}
    for (const transaction of recurringTransactions) {
        if (transaction._id === 1 || transaction._id === 2) {
            transaction.count = _.get(recurringSummary, 'success.count', 0) + transaction.count
            recurringSummary.success = transaction
        } else {
            transaction.count = parseInt(_.get(recurringSummary, 'failed.count', 0)) + transaction.count
            recurringSummary.failed = transaction
        }
    }

    const cbptQuery = { error_from: 'Charge By Previous', is_recurring: false }
    if (domain && domain !== '') {
        cbptQuery.domain = domain
    }
    if (is_unique === 'true' || is_unique === true) {
        cbptQuery.is_unique = true
    }
    const cbptTransactions = await CCBillErrorLog.aggregate([
        { $sort: { _id: -1 } },
        { $match: cbptQuery },
        { $limit: filterLimit },
        {
            $group: {
                _id: '$approved',
                count: { '$sum': 1 }
            }
        },
        {
            $project: {
                _id: 1,
                count: 1,
                error_from: 1
            }
        }
    ])

    const cbptSummary = {}
    for (const transaction of cbptTransactions) {
        if (transaction._id === 1 || transaction._id === 2) {
            transaction.count = _.get(cbptSummary, 'success.count', 0) + transaction.count
            cbptSummary.success = transaction
        } else {
            transaction.count = parseInt(_.get(cbptSummary, 'failed.count', 0)) + transaction.count
            cbptSummary.failed = transaction
        }
    }

    const recurringQueryForStickyIo = { is_recurring: true }
    if (domain && domain !== '') {
        recurringQueryForStickyIo.domain = domain
    }
    if (is_unique === 'true' || is_unique === true) {
        recurringQueryForStickyIo.is_unique = true
    }

    const recurringTransactionsForStickyIo = await StickyIoTransactionLog.aggregate([
        { $sort: { _id: -1 } },
        { $match: recurringQueryForStickyIo },
        { $limit: filterLimit },
        {
            $group: {
                _id: '$transaction_status',
                count: { '$sum': 1 }
            }
        },
        {
            $project: {
                _id: 1,
                count: 1,
                transaction_status: 1
            }
        }
    ])

    const recurringSummaryForStickyIo = {}
    for (const transaction of recurringTransactionsForStickyIo) {
        if (transaction._id === 'SUCCESS') {
            recurringSummaryForStickyIo.success = transaction.count
        } else {
            recurringSummaryForStickyIo.failed = transaction.count
        }
    }

    const cbptQueryForStickyIo = { transaction_type: 'order_by_previous_order_id' }
    if (domain && domain !== '') {
        cbptQueryForStickyIo.domain = domain
    }
    if (is_unique === 'true' || is_unique === true) {
        cbptQueryForStickyIo.is_unique = true
    }
    const cbptTransactionsForStickyIo = await StickyIoTransactionLog.aggregate([
        { $sort: { _id: -1 } },
        { $match: cbptQueryForStickyIo },
        { $limit: filterLimit },
        {
            $group: {
                _id: '$transaction_status',
                count: { '$sum': 1 }
            }
        },
        {
            $project: {
                _id: 1,
                count: 1,
                transaction_status: 1
            }
        }
    ])

    const cbptSummaryForStickyIo = {}
    for (const transaction of cbptTransactionsForStickyIo) {
        if (transaction._id === 'SUCCESS') {
            cbptSummaryForStickyIo.success = transaction.count
        } else {
            cbptSummaryForStickyIo.failed = transaction.count
        }
    }

    const addCardQuery = { payment_gateway: { $ne: 'sticky.io' } }
    if (domain && domain !== '') {
        addCardQuery.domain = domain
    }
    if (is_unique === 'true' || is_unique === true) {
        addCardQuery.is_unique = true
    }
    const addCardLogs = await CCBillRestApiAddCardLog.aggregate([
        { $match: addCardQuery },
        { $sort: { createdAt: -1 } },
        { $limit: filterLimit },
        { $group: { _id: '$is_error', count: { $sum: 1 } } },
        { $project: { _id: 1, count: 1 } }
    ])

    const addCardSummary = {}
    for (const addCardLog of addCardLogs) {
        if (addCardLog._id === false) {
            addCardSummary.success = _.get(addCardLog, 'count', 0)
        } else {
            addCardSummary.error = _.get(addCardLog, 'count', 0)
        }
    }

    const stickyIoAddCardLogQuery = { payment_gateway: 'sticky.io' }
    if (domain && domain !== '') {
        stickyIoAddCardLogQuery.domain = domain
    }
    if (is_unique === 'true' || is_unique === true) {
        stickyIoAddCardLogQuery.is_unique = true
    }
    const stickyIoAddCardLogs = await CCBillRestApiAddCardLog.aggregate([
        { $match: stickyIoAddCardLogQuery },
        { $sort: { createdAt: -1 } },
        { $limit: filterLimit },
        { $group: { _id: '$is_error', count: { $sum: 1 } } },
        { $project: { _id: 1, count: 1 } }
    ])

    const stickyIoAddCardSummary = {}
    for (const stickyIoAddCardLog of stickyIoAddCardLogs) {
        if (stickyIoAddCardLog._id === false) {
            stickyIoAddCardSummary.success = _.get(stickyIoAddCardLog, 'count', 0)
        } else {
            stickyIoAddCardSummary.error = _.get(stickyIoAddCardLog, 'count', 0)
        }
    }

    const result = {
        recurring_fail_transaction: _.get(recurringSummary, 'failed.count', 0),
        recurring_success_transaction: _.get(recurringSummary, 'success.count', 0),
        cbpt_fail_transaction: _.get(cbptSummary, 'failed.count', 0),
        cbpt_success_transaction: _.get(cbptSummary, 'success.count', 0),
        recurring_fail_transaction_for_sticky_io: _.get(recurringSummaryForStickyIo, 'failed', 0),
        recurring_success_transaction_for_sticky_io: _.get(recurringSummaryForStickyIo, 'success', 0),
        cbpt_fail_transaction_for_sticky_io: _.get(cbptSummaryForStickyIo, 'failed', 0),
        cbpt_success_transaction_for_sticky_io: _.get(cbptSummaryForStickyIo, 'success', 0),
        add_card_log_success: _.get(addCardSummary, 'success', 0),
        add_card_log_error: _.get(addCardSummary, 'error', 0),
        sticky_io_add_card_success: _.get(stickyIoAddCardSummary, 'success', 0),
        sticky_io_add_card_error: _.get(stickyIoAddCardSummary, 'error', 0)
    }
    return res.send(result)
})

module.exports = router
