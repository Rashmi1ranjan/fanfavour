const express = require('express')
const router = express.Router()
const TransactionCountLogs = require('../models/TransactionCountLogs')
const StickyIoPaymentProfiles = require('../models/StickyIoPaymentProfiles')
const HybridTransactionLogs = require('../models/HybridTransactionLogs')
const { successResponse, catchResponse, getDatesArray } = require('../utils/index')
const _ = require('lodash')
const moment = require('moment')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')

router.post('/logs', async (req, res) => {
    const { domain, payment_gateways, transaction, is_cascade_enabled } = req.body

    const checkTransaction = await checkTransactionAlreadyExists(transaction._id)
    if (checkTransaction > 0) {
        return res.send({ status: true })
    }

    const transaction_status = transaction.status === 'successfull' ? true : false
    let is_unique = true
    let is_unique_cascade = true
    const previousTransaction = await HybridTransactionLogs.findOne({ user_id: transaction.user_id, domain: transaction.domain, _id: { $lt: transaction._id } }).sort({ _id: 1 })

    if (transaction.recurring === 'false' && transaction.is_cascade_transaction === true) {
        const final_payment_gateway = transaction.payment_gateway
        const initial_payment_gateway = payment_gateways[0]
        if (final_payment_gateway === initial_payment_gateway) {
            transaction.is_cascade_transaction = false
        }
    }

    if (previousTransaction !== null) {
        if (transaction_status === false) {
            is_unique = _.get(previousTransaction, 'is_success', true)
        }
        const is_both_transaction_is_cascade = (previousTransaction.is_cascade_transaction === true && transaction.is_cascade_transaction === true)

        if (is_both_transaction_is_cascade === true) {
            const is_current_transaction_status_same_as_previous = (previousTransaction.is_success === transaction_status)

            const previousTransactionFailedFrom = previousTransaction.cascade.original_payment_gateway
            const transactionFailedFrom = transaction.cascade.original_payment_gateway
            const is_same_failed_gateway_for_transaction = previousTransactionFailedFrom === transactionFailedFrom

            const previousTransactionCascadePaymentGateway = previousTransaction.final_payment_gateway
            const currentTransactionCascadePaymentGateway = transaction.payment_gateway
            const is_final_payment_gateway_same_as_previous = (previousTransactionCascadePaymentGateway === currentTransactionCascadePaymentGateway)

            if (
                is_same_failed_gateway_for_transaction === true &&
                is_current_transaction_status_same_as_previous === true &&
                is_final_payment_gateway_same_as_previous === true
            ) {
                is_unique_cascade = false
            }
        }
    }
    await saveHybridTransaction(req.body, is_unique)

    const query = {
        domain: domain,
        date: moment(new Date()).format('YYYY-MM-DD 00:00:00'),
        payment_gateway: payment_gateways,
        country: transaction.country,
        is_recurring: transaction.recurring === 'true' ? true : false,
        is_cascade_enabled: is_cascade_enabled
    }

    const stickyIoIndex = payment_gateways.indexOf('sticky.io')
    let stickyIoPaymentGatewayName = ''
    if (stickyIoIndex !== -1) {
        const stickyIoResponse = _.get(transaction, 'sticky_io_response', false)
        const stickyIoPaymentGatewayId = _.get(transaction, 'sticky_io_response.gateway_id', false)
        if (stickyIoResponse !== false && stickyIoPaymentGatewayId !== false) {
            const stickyIoPaymentGateway = await StickyIoPaymentProfiles.findOne({ gateway_id: stickyIoPaymentGatewayId })
            stickyIoPaymentGatewayName = stickyIoPaymentGateway.gateway_alias
            payment_gateways[stickyIoIndex] = stickyIoPaymentGatewayName
        } else {
            stickyIoPaymentGatewayName = 'stickyio'
            payment_gateways[stickyIoIndex] = stickyIoPaymentGatewayName
        }
    }

    const transactionCounter = {}
    const transactionAmount = transaction.amount
    if (transaction.by_primary_gateway === false && transaction.status === 'successfull') {
        transactionCounter.processed_count_by_secondary_gateway = 1
        transactionCounter.processed_amount_by_secondary_gateway = transactionAmount
    }
    if (transaction.status === 'successfull') {
        transactionCounter.success = 1
        transactionCounter.success_amount = transactionAmount
        if (transaction.is_cascade_transaction === true) {
            transactionCounter.cascade_success = 1
            transactionCounter.cascade_success_amount = transactionAmount
        }
    } else {
        transactionCounter.failed = 1
        if (is_unique === true) {
            transactionCounter.unique_failed = 1
            transactionCounter.unique_failed_amount = transactionAmount
        }
        if (transaction.is_cascade_transaction === true) {
            transactionCounter.cascade_failed = 1
            transactionCounter.cascade_failed_amount = transactionAmount
        }
    }

    transaction.payment_gateway = transaction.payment_gateway === 'sticky.io' ? stickyIoPaymentGatewayName : transaction.payment_gateway
    for (const payment_gateway of payment_gateways) {
        const payment_gateway_name = payment_gateway.replace('.', '').replace(' ', '_')
        if (transaction.status === 'successfull' && payment_gateway === transaction.payment_gateway) {
            transactionCounter[`counters.${payment_gateway_name}.success`] = 1
            transactionCounter[`counters.${payment_gateway_name}.success_amount`] = transactionAmount
        } else {
            transactionCounter[`counters.${payment_gateway_name}.failed`] = 1
            if (is_unique_cascade === true) {
                transactionCounter[`counters.${payment_gateway_name}.unique_failed`] = 1
                transactionCounter[`counters.${payment_gateway_name}.unique_failed_amount`] = transactionAmount
            }
        }
    }

    const update = { $inc: transactionCounter }
    const transactionCountLog = await TransactionCountLogs.updateOne(query, update, { upsert: true })

    return res.send({ status: true, transactionCountLog })
})

/**
 * @description Save Hybrid Transactions Log
 * @param {object} data request body data
 * @param {boolean} is_unique Is Unique Transaction
 */
async function saveHybridTransaction(data, is_unique) {
    const { domain, payment_gateways, transaction, is_cascade_enabled } = data
    const transaction_response = transaction.payment_gateway === 'ccbill' ? transaction.ccbill_response : transaction.sticky_io_response
    const transaction_status = transaction.status === 'successfull' ? true : false
    const transactionLog = {
        domain: domain,
        user_id: transaction.user_id,
        is_success: transaction_status,
        recurring: transaction.recurring,
        amount: transaction.amount,
        transaction_date: transaction.transaction_date,
        pcp_transaction_id: transaction._id,
        response: transaction_response,
        final_payment_gateway: transaction.payment_gateway,
        ip_address: transaction.ip_address,
        is_cascade_transaction: transaction.is_cascade_transaction,
        cascade: transaction.cascade,
        country: transaction.country,
        payment_gateways: payment_gateways,
        is_unique: is_unique,
        transaction_type: transaction.transaction_type,
        is_cascade_enabled: is_cascade_enabled,
        by_primary_gateway: transaction.by_primary_gateway,
        cascade_type: transaction.cascade_type,
        transaction_execution_time: transaction.transaction_execution_time,
        is_user_universal: transaction.is_user_universal
    }
    const saveTransactionLog = new HybridTransactionLogs(transactionLog)
    await saveTransactionLog.save()
}

router.post('/get-log-counts', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const domain = _.get(req.body, 'domain', '')
        const start_date = _.get(req.body, 'start_date', moment().subtract(7, 'days').format('MM/DD/YYYY'))
        const end_date = _.get(req.body, 'end_date', moment().format('MM/DD/YYYY'))

        const dateStart = moment(start_date, 'MM/DD/YYYY').format('YYYY-MM-DD')
        const dateEnd = moment(end_date, 'MM/DD/YYYY').format('YYYY-MM-DD')

        const allDates = getDatesArray(dateStart, dateEnd)
        const counts = []
        for (const date of allDates) {
            const start = moment(date, 'YYYY-MM-DD').format('YYYY-MM-DDT00:00:00')
            const end = moment(date, 'YYYY-MM-DD').format('YYYY-MM-DDT23:59:59')

            const transactionCounts = await getTransactionCounts(start, end, domain)
            counts.push(transactionCounts)
        }

        return successResponse(res, counts, 'Transaction Counts', 200)

    } catch (error) {
        return catchResponse(res, {}, 'Error in Transaction count get', 200)
    }
})

/**
 * @description Get Website Earning from date, domain and payment Gateway
 * @param {string} start_date Start Date
 * @param {string} end_date End Date
 * @param {string} domain Domain Name
 * @returns {object} Website earning
 */
async function getTransactionCounts(start_date, end_date, domain = '') {
    const filter = {
        date: {
            $gte: new Date(start_date),
            $lte: new Date(end_date)
        }
    }
    if (domain !== '') {
        filter.domain = domain
    }

    const counts = await TransactionCountLogs.aggregate([
        { $match: filter },
        {
            $group: {
                _id: null,
                success: { $sum: '$success' },
                success_amount: { $sum: '$success_amount' },
                unique_failed: { $sum: '$unique_failed' },
                unique_failed_amount: { $sum: '$unique_failed_amount' },
                failed: { $sum: '$failed' },
                cascade_success: { $sum: '$cascade_success' },
                cascade_success_amount: { $sum: '$cascade_success_amount' }
            }
        }
    ])

    if (counts.length > 0) {
        const dailyCounts = counts[0]
        return {
            date: moment(start_date).format('YYYY-MM-DD'),
            success: dailyCounts.success,
            success_amount: dailyCounts.success_amount,
            unique_failed: dailyCounts.unique_failed,
            unique_failed_amount: dailyCounts.unique_failed_amount,
            failed: dailyCounts.failed,
            cascade_success: dailyCounts.cascade_success,
            cascade_success_amount: dailyCounts.cascade_success_amount,
            processed_count_by_secondary_gateway: dailyCounts.processed_count_by_secondary_gateway,
            processed_amount_by_secondary_gateway: dailyCounts.processed_amount_by_secondary_gateway
        }
    }
    return {
        date: moment(start_date).format('YYYY-MM-DD'),
        success: 0,
        success_amount: 0,
        unique_failed: 0,
        unique_failed_amount: 0,
        failed: 0,
        cascade_success: 0,
        cascade_success_amount: 0,
        processed_count_by_secondary_gateway: 0,
        processed_amount_by_secondary_gateway: 0
    }
}

router.post('/get-log-list', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const filter = req.body.filter

        const start_date = _.get(filter, 'start_date', moment().format('MM/DD/YYYY'))
        const end_date = _.get(filter, 'end_date', moment().format('MM/DD/YYYY'))
        const dateStart = moment.utc(moment(start_date, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00'))
        const dateEnd = moment.utc(moment(end_date, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59'))

        const query = {
            transaction_date: {
                $gte: new Date(dateStart),
                $lte: new Date(dateEnd)
            }
        }

        const domain = _.get(filter, 'domain', '')
        if (domain !== '') {
            query.domain = domain
        }

        const is_success = _.get(filter, 'is_success', 'all')
        if (is_success !== 'all') {
            query.is_success = is_success === 'true' ? true : false
        }

        const is_cascade_enabled = _.get(filter, 'is_cascade_enabled', 'all')
        if (is_cascade_enabled !== 'all') {
            query.is_cascade_enabled = is_cascade_enabled === 'true' ? true : false
        }

        const recurring = _.get(filter, 'recurring', 'all')
        if (recurring !== 'all') {
            query.recurring = recurring
        }

        const is_cascade_transaction = _.get(filter, 'is_cascade_transaction', 'all')
        if (is_cascade_transaction !== 'all') {
            query.is_cascade_transaction = is_cascade_transaction
        }

        const pcp_transaction_id = _.get(filter, 'pcp_transaction_id', '')
        if (pcp_transaction_id !== '') {
            query.pcp_transaction_id = pcp_transaction_id
        }

        const final_payment_gateway = _.get(filter, 'final_payment_gateway', 'all')
        if (final_payment_gateway !== 'all') {
            query.final_payment_gateway = final_payment_gateway
        }

        const country = _.get(filter, 'country', 'all')
        if (country !== 'all') {
            query.country = country
        }

        const is_unique = _.get(filter, 'is_unique', false)
        if (is_unique === true) {
            query.is_unique = is_unique
        }

        const ip_address = _.get(filter, 'ip_address', '')
        if (ip_address !== '') {
            query.ip_address = ip_address
        }

        const transaction_type = _.get(filter, 'transaction_type', 'all')
        if (transaction_type !== 'all') {
            query.transaction_type = transaction_type
        }

        const by_primary_gateway = _.get(filter, 'by_primary_gateway', 'all')
        if (by_primary_gateway !== 'all') {
            query.by_primary_gateway = by_primary_gateway === 'false' ? false : { $ne: false }
        }

        const user_id = _.get(filter, 'user_id', '')
        if (user_id !== '') {
            query.user_id = user_id
        }

        const totalRows = await HybridTransactionLogs.countDocuments(query)
        const limit = 20
        const currentPage = parseInt(req.body.page, 10)
        const totalPages = Math.ceil(totalRows / limit)
        const offset = (currentPage - 1) * limit

        let rows = []
        if (totalRows > 0) {
            rows = await HybridTransactionLogs.find(query).skip(offset).limit(limit).sort({ 'transaction_date': 'desc' })
        }

        const response = {
            rows: rows,
            totalPages: totalPages,
            currentPage: currentPage,
            totalRows: totalRows,
            limit: limit
        }
        return successResponse(res, response, 'Transactions', 200)
    } catch (error) {
        return catchResponse(res, {}, 'Error in get Transactions', 200)
    }
})

router.post('/get-log-summary', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const query = {}
        const filter_by = _.get(req.body, 'filter_by', 'record')
        if (filter_by === 'date') {
            const start_date = _.get(req.body, 'start_date', moment().subtract(7, 'days').format('MM/DD/YYYY'))
            const end_date = _.get(req.body, 'end_date', moment().format('MM/DD/YYYY'))

            const dateStart = moment.utc(moment(start_date, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00'))
            const dateEnd = moment.utc(moment(end_date, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59'))
            query.date = {
                $gte: new Date(dateStart),
                $lte: new Date(dateEnd)
            }
        }

        const domain = _.get(req.body, 'domain', '')
        if (domain !== '') {
            query.domain = domain
        }

        const is_cascade_enabled = _.get(req.body, 'is_cascade_enabled', 'all')
        if (is_cascade_enabled !== 'all') {
            query.is_cascade_enabled = is_cascade_enabled === 'true' ? true : false
        }

        const is_recurring = _.get(req.body, 'is_recurring', 'all')
        if (is_recurring !== 'all') {
            query.is_recurring = req.body.is_recurring === 'true' ? true : false
        }

        const countries = _.get(req.body, 'countries', [])
        const exclude_include_country = _.get(req.body, 'exclude_include_country', 'exclude')
        if (countries.length > 0) {
            if (exclude_include_country === 'exclude') {
                query.country = { $nin: countries }
            } else {
                query.country = { $in: countries }
            }
        }

        const aggregateForGlobalSummary = []
        aggregateForGlobalSummary.push({ $match: query })

        const group = {
            _id: null,
            success: { $sum: '$success' },
            success_amount: { $sum: '$success_amount' },
            unique_failed: { $sum: '$unique_failed' },
            unique_failed_amount: { $sum: '$unique_failed_amount' },
            failed: { $sum: '$failed' },
            cascade_success: { $sum: '$cascade_success' },
            cascade_success_amount: { $sum: '$cascade_success_amount' },
            cascade_failed: { $sum: '$cascade_failed' },
            cascade_failed_amount: { $sum: '$cascade_failed_amount' },
            processed_count_by_secondary_gateway: { $sum: '$processed_count_by_secondary_gateway' },
            processed_amount_by_secondary_gateway: { $sum: '$processed_amount_by_secondary_gateway' }
        }
        aggregateForGlobalSummary.push({ $group: group })
        aggregateForGlobalSummary.push(
            {
                $addFields: {
                    normal_success: { $subtract: ['$success', '$cascade_success'] },
                    normal_success_amount: { $subtract: ['$success_amount', '$cascade_success_amount'] },
                    normal_failed: { $subtract: ['$failed', 0] },
                    normal_unique_failed: { $subtract: ['$unique_failed', '$cascade_failed'] },
                    normal_unique_failed_amount: { $subtract: ['$unique_failed_amount', '$cascade_failed_amount'] },
                    processed_count_by_secondary_gateway_not_cascade: { $subtract: ['$processed_count_by_secondary_gateway', '$cascade_success'] },
                    processed_amount_by_secondary_gateway_not_cascade: { $subtract: ['$processed_amount_by_secondary_gateway', '$cascade_success_amount'] }
                }
            }
        )

        const global_summary = await TransactionCountLogs.aggregate(aggregateForGlobalSummary)

        const aggregateForPaymentGatewaySummary = []
        aggregateForPaymentGatewaySummary.push({ $match: query })
        aggregateForPaymentGatewaySummary.push({ $project: { 'counter': { $objectToArray: '$counters' } } })
        aggregateForPaymentGatewaySummary.push({ $unwind: '$counter' })
        const groupForPaymentSummary = {
            _id: '$counter.k',
            success: { $sum: '$counter.v.success' },
            success_amount: { $sum: '$counter.v.success_amount' },
            failed: { $sum: '$counter.v.failed' },
            unique_failed: { $sum: '$counter.v.unique_failed' },
            unique_failed_amount: { $sum: '$counter.v.unique_failed_amount' }
        }
        aggregateForPaymentGatewaySummary.push({ $group: groupForPaymentSummary })
        aggregateForPaymentGatewaySummary.push({ $sort: { success: -1, failed: -1 } })
        const payment_gateway_summary = await TransactionCountLogs.aggregate(aggregateForPaymentGatewaySummary)
        const summary = { global_summary, payment_gateway_summary }

        return successResponse(res, summary, 'Transaction Summary', 200)
    } catch (error) {
        return catchResponse(res, error, 'Error in Transaction Summary', 200)
    }
})

/**
 * @description check transaction already exists or not
 * @param {string} transaction_id transaction id
 * @returns {number} number of records
 */
async function checkTransactionAlreadyExists(transaction_id) {
    return await HybridTransactionLogs.countDocuments({ pcp_transaction_id: transaction_id })
}

module.exports = router
