const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const createCsvWriter = require('csv-writer').createArrayCsvWriter
const { v4: uuidv4 } = require('uuid')
const Joi = require('joi')
const _ = require('lodash')
const mongoose = require('mongoose')
const moment = require('moment')
const momentTZ = require('moment-timezone')
const { successResponse, errorResponse } = require('../utils/index')
const ForumPayTransactionLog = require('../models/ForumPayTransactionLog')
const WalletTransactions = require('../models/WalletTransactions')
const WalletBalance = require('../models/WalletBalance')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_ACCOUNT_MANAGER, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const ForumPayWebhook = require('../models/ForumPayWebhook')
const { updateWalletTransaction } = require('../utils/forumpay')


const forumPayTransactionLogSchema = Joi.object({
    domain: Joi.string().required(),
    user_id: Joi.string().required(),
    transaction_type: Joi.string().required(),
    is_recurring: Joi.boolean().required(),
    transaction_status: Joi.string().required(),
    forum_pay_response: Joi.object().required(),
    ip_address: Joi.string().allow(null, '')
})

router.post('/logs', async (req, res) => {
    try {
        await forumPayTransactionLogSchema.validateAsync(req.body)
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }

    const { domain, user_id } = req.body
    const filterForLastLog = {
        domain: domain,
        user_id: user_id
    }

    const lastTransactionForUser = await ForumPayTransactionLog.findOne(filterForLastLog).sort({ _id: -1 })
    if (
        lastTransactionForUser !== null &&
        lastTransactionForUser.transaction_status !== 'successfull' &&
        req.body.status !== 'successfull'
    ) {
        req.body.is_unique = false
    } else {
        req.body.is_unique = true
    }

    const forumPayTransactionLogData = new ForumPayTransactionLog(req.body)
    await forumPayTransactionLogData.save()
    return res.send({ status: true })
})

router.post('/wallet-transaction-history', protectRouteWithRole([SUPER_ADMIN, ROLE_ACCOUNT_MANAGER, ROLE_SUPPORT]), async (req, res) => {
    const filter = req.body.filter
    const currentPage = parseInt(req.body.page, 10)
    const limit = 20
    const query = {}

    if (filter.start_date !== '' && filter.end_date !== '') {
        const dateStart = moment(filter.start_date, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00+00:00')
        const dateEnd = moment(filter.end_date, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59+00:00')
        query.mst_created_date = {
            $gte: new Date(dateStart),
            $lte: new Date(dateEnd)
        }
    }

    const domain = _.get(filter, 'domain', '')
    if (domain !== '') {
        query.domain = domain
    }

    const content_type = _.get(filter, 'content_type', '')
    if (content_type.length > 0) {
        query['transaction_info.content_type'] = { $in: content_type }
    }

    let isValidUserId = true
    const user_id = _.get(filter, 'user_id', '')
    if (user_id !== '') {
        isValidUserId = mongoose.Types.ObjectId.isValid(user_id)
        if (isValidUserId === true) {
            query.user_id = new mongoose.Types.ObjectId(user_id)
        }
    }

    const email = _.get(filter, 'email', '')
    if (email !== '') {
        query.email = email
    }

    const transaction_type = _.get(filter, 'transaction_type', 'all')
    if (transaction_type !== 'all') {
        query.transaction_type = transaction_type
    }

    const transaction_status = _.get(filter, 'transaction_status', 'all')
    if (transaction_status !== 'all') {
        query.transaction_status = transaction_status
    }

    let isPcpTransactionId = true
    const pcp_transaction_id = _.get(filter, 'pcp_transaction_id', '')
    if (pcp_transaction_id !== '') {
        isPcpTransactionId = mongoose.Types.ObjectId.isValid(pcp_transaction_id)
        if (isPcpTransactionId === true) {
            query.pcp_transaction_id = pcp_transaction_id
        }
    }

    const transaction_id = _.get(filter, 'transaction_id', '')
    if (transaction_id !== '') {
        query['transaction_info.payment_id'] = transaction_id
    }


    const transaction_for = _.get(filter, 'transaction_for', 'all')
    if (transaction_for !== 'all') {
        query['transaction_info.transaction_for'] = transaction_for
    }

    const content_id = _.get(filter, 'content_id', 'all')
    if (content_id !== 'all') {
        query['transaction_info.content_id'] = content_id
    }

    const crypto_currency = _.get(filter, 'crypto_currency', 'all')
    if (crypto_currency !== 'all') {
        query['transaction_info.crypto_currency'] = crypto_currency
    }

    const ip_address = _.get(filter, 'ip_address', 'all')
    if (ip_address !== 'all') {
        query.ip_address = ip_address
    }

    const wallet_transaction_status = _.get(filter, 'wallet_transaction_status', '')
    if (wallet_transaction_status.length > 0) {
        query.wallet_transaction_status = wallet_transaction_status
    }

    const totalRows = await WalletTransactions.countDocuments(query)
    const totalPages = Math.ceil(totalRows / limit)
    const offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await WalletTransactions.find(query).skip(offset).limit(limit).sort({ 'createdAt': 'desc' })
    }

    const data = {
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit,
        isValidUserId: isValidUserId,
        isPcpTransactionId: isPcpTransactionId
    }
    return successResponse(res, data, 'Success', 200)
})

router.post('/webhooks', async (req, res) => {
    const filter = req.body.filter
    const currentPage = parseInt(req.body.page, 10)
    const limit = 20
    const query = {}

    const pcp_transaction_id = _.get(filter, 'pcp_transaction_id', '')
    if (pcp_transaction_id !== '') {
        if (mongoose.Types.ObjectId.isValid(pcp_transaction_id) !== true) {
            return errorResponse(res, {}, 'Please enter a valid transaction id.', 400)
        }
        query['body.reference_no'] = pcp_transaction_id
    }

    const transaction_id = _.get(filter, 'transaction_id', '')
    if (transaction_id !== '') {
        query['body.payment_id'] = transaction_id
    }

    const totalRows = await ForumPayWebhook.countDocuments(query)
    const totalPages = Math.ceil(totalRows / limit)

    const offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await ForumPayWebhook.find(query).skip(offset).limit(limit).sort({ 'created_at': 'desc' })
    }

    const data = {
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    }
    return successResponse(res, data, 'Success', 200)
})

router.post('/user-wallet-details', async (req, res) => {
    const filter = req.body.filter
    const currentPage = parseInt(req.body.page, 10)
    const limit = 20
    const query = {}

    const email = _.get(filter, 'email', '')
    if (email !== '') {
        query.email = email
    }

    const domain = _.get(filter, 'domain', '')
    if (domain !== '') {
        query['users.universal_login_merged_domains'] = {
            '$in': [domain]
        }
    }

    const offset = (currentPage - 1) * limit
    let rows = []

    const aggregation = [
        {
            '$sort': {
                'updatedAt': -1
            }
        }, {
            '$lookup': {
                'from': 'universal_users',
                'localField': 'email',
                'foreignField': 'email',
                'as': 'users'
            }
        }, {
            '$unwind': {
                'path': '$users',
                'preserveNullAndEmptyArrays': true
            }
        }, {
            '$match': query
        }, {
            '$group': {
                '_id': 'totalDoc',
                'count': {
                    '$sum': 1
                },
                'doc': {
                    '$push': '$$ROOT'
                }
            }
        }, {
            '$unwind': {
                'path': '$doc'
            }
        }, {
            '$skip': offset
        }, {
            '$limit': limit
        }, {
            '$project': {
                '_id': 0,
                'totalDoc': '$count',
                'email': '$doc.email',
                'amount': '$doc.amount',
                'domain': '$doc.domain',
                'universal_wallet': '$doc.universal_wallet',
                'updatedAt': '$doc.updatedAt',
                'createdAt': '$doc.createdAt',
                'name': '$doc.users.name',
                'universal_login_merged_domains': '$doc.users.universal_login_merged_domains'
            }
        }
    ]

    rows = await WalletBalance.aggregate(aggregation)

    const totalRows = _.get(rows, '[0]totalDoc', 0)
    const totalPages = Math.ceil(totalRows / limit)

    const data = {
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    }
    return successResponse(res, data, 'Success', 200)
})

router.post('/update-transaction-status', async (req, res) => {
    const transactionId = _.get(req.body, 'transaction_id', false)
    if (transactionId === false) {
        return errorResponse(res, {}, 'Transaction Id not found', 400)
    }

    const transaction = await WalletTransactions.findById(transactionId)
    const { transaction_info } = transaction
    const transactionInfo = {
        pos_id: transaction_info.pos_id,
        currency: transaction_info.crypto_currency,
        address: transaction_info.address,
        payment_id: transaction_info.payment_id,
        reference_no: transaction._id
    }
    const updateTransaction = await updateWalletTransaction(transactionInfo)

    return successResponse(res, {}, updateTransaction.message, 200)
})

router.post('/export-wallet-transaction-history', protectRouteWithRole([SUPER_ADMIN, ROLE_ACCOUNT_MANAGER, ROLE_SUPPORT]), async (req, res) => {
    const filter = req.body.filter
    const query = {}

    if (filter.start_date !== '' && filter.end_date !== '') {
        const dateStart = moment(filter.start_date, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00+00:00')
        const dateEnd = moment(filter.end_date, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59+00:00')
        query.mst_created_date = {
            $gte: new Date(dateStart),
            $lte: new Date(dateEnd)
        }
    }

    const domain = _.get(filter, 'domain', 'all')
    if (domain !== 'all') {
        query.domain = domain
    }

    const content_type = _.get(filter, 'content_type', '')
    if (content_type.length > 0) {
        query['transaction_info.content_type'] = content_type
    }

    let isValidUserId = true
    const user_id = _.get(filter, 'user_id', '')
    if (user_id !== '') {
        isValidUserId = mongoose.Types.ObjectId.isValid(user_id)
        if (isValidUserId === true) {
            query.user_id = new mongoose.Types.ObjectId(user_id)
        }
    }

    const email = _.get(filter, 'email', '')
    if (email !== '') {
        query.email = email
    }

    const transaction_type = _.get(filter, 'transaction_type', 'all')
    if (transaction_type !== 'all') {
        query.transaction_type = transaction_type
    }

    const transaction_status = _.get(filter, 'transaction_status', 'all')
    if (transaction_status !== 'all') {
        query.transaction_status = transaction_status
    }

    let isValidPcpTransactionId = true
    const pcp_transaction_id = _.get(filter, 'pcp_transaction_id', '')
    if (pcp_transaction_id !== '') {
        isValidPcpTransactionId = mongoose.Types.ObjectId.isValid(pcp_transaction_id)
        if (isValidPcpTransactionId === true) {
            query.pcp_transaction_id = pcp_transaction_id
        }
    }

    const transaction_id = _.get(filter, 'transaction_id', '')
    if (transaction_id !== '') {
        query['transaction_info.payment_id'] = transaction_id
    }


    const transaction_for = _.get(filter, 'transaction_for', 'all')
    if (transaction_for !== 'all') {
        query['transaction_info.transaction_for'] = transaction_for
    }

    const content_id = _.get(filter, 'content_id', 'all')
    if (content_id !== 'all') {
        query['transaction_info.content_id'] = content_id
    }

    const crypto_currency = _.get(filter, 'crypto_currency', 'all')
    if (crypto_currency !== 'all') {
        query['transaction_info.crypto_currency'] = crypto_currency
    }

    const ip_address = _.get(filter, 'ip_address', 'all')
    if (ip_address !== 'all') {
        query.ip_address = ip_address
    }

    const wallet_transaction_status = _.get(filter, 'wallet_transaction_status', '')
    if (wallet_transaction_status.length > 0) {
        query.wallet_transaction_status = wallet_transaction_status
    }
    let csvDownloadPath = ''
    if (isValidUserId && isValidPcpTransactionId) {
        const rows = await WalletTransactions.find(query).sort({ 'createdAt': 'desc' })
        let date = new Date()
        if (filter.start_date !== '') {
            date = filter.start_date
        }

        const walletTransactionHistoryData = await generateWalletTransactionHistoryData(rows)
        csvDownloadPath = await generateWalletTransactionCSV(walletTransactionHistoryData, date)
    }

    const data = {
        csvUrl: csvDownloadPath,
        isValidUserId: isValidUserId,
        isValidPcpTransactionId: isValidPcpTransactionId
    }
    return successResponse(res, data, 'CSV Generated Successfully', 200)
})

router.post('/wallet-transaction-statistics', protectRouteWithRole([SUPER_ADMIN, ROLE_ACCOUNT_MANAGER, ROLE_SUPPORT]), async (req, res) => {
    const filter = req.body.filter
    const domain = _.get(filter, 'domain', '')

    const aggregate = []
    const match = {
        transaction_status: 'success'
    }
    if (domain !== '') {
        match.domain = domain
    }

    let isValidUserId = true
    const user_id = _.get(filter, 'user_id', '')
    if (user_id !== '') {
        isValidUserId = mongoose.Types.ObjectId.isValid(user_id)
        if (isValidUserId === true) {
            match.user_id = new mongoose.Types.ObjectId(user_id)
        }
    }

    if (filter.start_date !== '' && filter.end_date !== '') {
        const dateStart = moment(filter.start_date, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00+00:00')
        const dateEnd = moment(filter.end_date, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59+00:00')
        match.mst_created_date = {
            $gte: new Date(dateStart),
            $lte: new Date(dateEnd)
        }
    }

    aggregate.push({
        $match: match
    })

    aggregate.push({
        $group: {
            _id: '$transaction_type',
            amount: { $sum: '$amount' }
        }
    })

    let total_credit = 0
    let total_debit = 0
    let total_balance = 0
    const amounts = await WalletTransactions.aggregate(aggregate)

    for (const amount of amounts) {
        if (amount._id === 'debit') {
            total_debit = amount.amount
        }
        if (amount._id === 'credit') {
            total_credit = amount.amount
        }
    }
    total_balance = total_credit - total_debit

    const data = {
        balance: {
            total_credit,
            total_debit,
            total_balance
        },
        isValidUserId: isValidUserId
    }
    return successResponse(res, data, 'Success', 200)
})

/**
 * Generate Array for CSV
 *
 * @param {Array} data Wallet Transactions data
 * @returns {Array} Improved array for CSV
 */
async function generateWalletTransactionHistoryData(data) {
    let walletTransactionHistory = []

    for (let element of data) {
        let forumpay_error_message = ''

        if (element.transaction_status === 'failed' && element.forumpay_response) {
            forumpay_error_message = element.forumpay_response.err
        }
        const content_type = element.transaction_info.transaction_for
        let transaction_for = ''
        switch (content_type) {
            case 'blog':
                transaction_for = 'Exclusive Content'
                break
            case 'add_fund':
                transaction_for = 'Add Fund'
                break
            case 'tips':
                transaction_for = 'Tips'
                break
            case 'subscription':
                transaction_for = 'Subscription'
                break
            case 'rebill':
                transaction_for = 'Rebill'
                break
            case 'chat':
                transaction_for = 'Message Unlock'
                break
            case 'chat_pay_per_message':
                transaction_for = 'Pay Per Message'
                break
            default:
                transaction_for = ''
                break
        }
        walletTransactionHistory.push([
            element.domain,
            element.user_id,
            element.email,
            element.ip_address,
            formatCurrency(element.amount),
            element.transaction_info.crypto_currency,
            element.transaction_info.payment_id,
            transaction_for,
            element.transaction_status,
            element.wallet_transaction_status,
            element.transaction_type,
            forumpay_error_message,
            momentTZ(element.mst_created_date).tz('America/Phoenix').format('DD MMMM-YYYY HH:mm:ss')
        ])
    }
    return walletTransactionHistory
}

/**
 * Generate CSV
 *
 * @param {Array} walletTransactions Wallet transactions
 * @param {Date} date Date for CSV generation in local
 * @returns {string} file path
 */
async function generateWalletTransactionCSV(walletTransactions, date) {
    let paths = path.resolve(`${__dirname}`, './../temp/')
    removeOldCSVFiles(paths)

    let fileName = `${moment(date).format('MMMM-YYYY')}-${uuidv4()}.csv`
    let tempPath = path.resolve(`${__dirname}`, `./../temp/${fileName}`)
    let header = ['Domain', 'User Id', 'Email', 'IP Address', 'Amount', 'Crypto Currency', 'Payment Transaction Id', 'Content Type', 'Transaction Status', 'MC Transaction Type', 'Transaction Type', 'ForumPay Error Response', 'Date']

    const csvWriter = createCsvWriter({
        header: header,
        path: tempPath
    })

    await csvWriter.writeRecords(walletTransactions)
    return fileName
}

/**
 * @description Remove old csv from folder
 * @param {string} paths Dir path
 */
function removeOldCSVFiles(paths) {
    fs.readdirSync(paths).forEach(file => {
        if (file !== '.gitignore') {
            fs.stat(paths + '/' + file, function (err, stat) {
                const now = new Date().getTime()
                const endTime = new Date(stat.mtime).getTime() + (60 * 60 * 1000) // 1 hour in milliseconds
                if (err) { return console.error(err) }
                if (now > endTime) {
                    fs.unlinkSync(paths + '/' + file)
                }
            })
        }
    })
}

/**
 * convert number to string with $ sign and fixed with 2 decimal places
 *
 * @param {number} amount amount
 * @returns {string} $ + amount + toFixed 2
 */
function formatCurrency(amount) {
    return '$' + Number(amount).toFixed(2)
}

module.exports = router
