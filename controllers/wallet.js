const express = require('express')
const router = express.Router()
const { successResponse, errorResponse } = require('../utils/index')
const WalletTransactions = require('../models/WalletTransactions')
const WalletBalance = require('../models/WalletBalance')
const UniversalUsers = require('../models/UniversalUsers')
const Joi = require('joi')
const _ = require('lodash')
const { updateWalletAmount, getWalletBalance, processMissingForumPayWebhook, getWalletTransactionStatus } = require('../utils/forumpay')

const walletTransactionsSchema = Joi.object({
    domain: Joi.string().required(),
    user_id: Joi.string().required(),
    email: Joi.string().required(),
    transaction_type: Joi.string().required(),
    transaction_status: Joi.string().required(),
    amount: Joi.number().required(),
    ip_address: Joi.string().allow(null, ''),
    transaction_info: Joi.object().required(),
    pcp_transaction_id: Joi.string().allow(null, ''),
    is_universal_user: Joi.boolean(),
    tracking_link: Joi.string().allow(null, ''),
    requestFrom: Joi.string().allow(null, '')
})

const updateWalletTransactionsSchema = Joi.object({
    domain: Joi.string().required(),
    user_id: Joi.string().required(),
    email: Joi.string().required(),
    transaction_status: Joi.string().required(),
    transaction_id: Joi.string().required(),
    forumpay_response: Joi.object().required(),
    amount: Joi.string().required(),
    address: Joi.string().required().allow(null, ''),
    is_region_error: Joi.boolean(),
    is_error: Joi.boolean()
})

const getWalletTransactionsSchema = Joi.object({
    domain: Joi.string().required(),
    email: Joi.string().required(),
    page_no: Joi.number().required(),
    requestFrom:Joi.string().allow('')
})

router.post('/add-wallet-transaction', async (req, res) => {
    try {
        await walletTransactionsSchema.validateAsync(req.body)
    } catch (error) {
        return errorResponse(res, error, error.message, 400)
    }

    try {
        const { transaction_status, email, domain } = req.body
        const is_region_error = _.get(req.body, 'is_region_error', false)
        const is_error = _.get(req.body, 'is_error', false)

        const requestBody = req.body
        requestBody.wallet_transaction_status = getWalletTransactionStatus(transaction_status, is_region_error, is_error)

        const walletTransactionsData = new WalletTransactions(requestBody)
        const transaction = await walletTransactionsData.save()

        if (transaction_status === 'success') {
            await updateWalletAmount(email, domain)
        }

        const wallet_amount = await getWalletBalance(email, domain)
        return successResponse(res, { transaction_id: transaction._id, wallet_balance: wallet_amount }, 'Wallet Transaction successfully added', 200)
    } catch (error) {
        console.log(error)
        return errorResponse(res, error, error.message, 400)
    }
})

router.post('/update-wallet-transaction', async (req, res) => {
    try {
        await updateWalletTransactionsSchema.validateAsync(req.body)
    } catch (error) {
        return errorResponse(res, error, error.message, 400)
    }

    try {
        const { transaction_id, transaction_status, forumpay_response, amount, address } = req.body
        const transaction_amount = Number(amount)

        const transaction = await WalletTransactions.findById(transaction_id)
        const current_transaction_status = transaction.transaction_status
        const is_confirmed = _.get(forumpay_response, 'confirmed', false)
        const is_region_error = _.get(req.body, 'is_region_error', false)
        const is_error = _.get(req.body, 'is_error', false)

        const { email, domain } = transaction

        transaction.transaction_status = transaction_status
        transaction.forumpay_response = forumpay_response
        transaction.amount = transaction_amount
        transaction.transaction_info.address = address
        transaction.wallet_transaction_status = getWalletTransactionStatus(transaction_status, is_region_error, is_error)

        await transaction.save()

        if (current_transaction_status !== 'success' && is_confirmed === true) {
            await updateWalletAmount(email, domain, forumpay_response.currency)
        }

        const wallet_amount = await getWalletBalance(email, domain)
        return successResponse(res, { status: true, wallet_balance: wallet_amount }, 'Wallet Transaction successfully updated', 200)
    } catch (error) {
        console.log(error)
        return errorResponse(res, error, error.message, 400)
    }
})

router.post('/get-wallet-transaction', async (req, res) => {
    try {
        await getWalletTransactionsSchema.validateAsync(req.body)
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }

    try {
        const { domain, email, page_no } = req.body
        await processMissingForumPayWebhook(email)
        const limit = 25

        let query = { domain, email }
        let queryForBalance = { domain, email }

        const isUserUniversal = await UniversalUsers.exists({ email: email, universal_login_merged_domains: { $in: domain } })
        if (!_.isEmpty(isUserUniversal)) {
            queryForBalance = { email: email, universal_wallet: true }
        }
        const totalRecords = await WalletTransactions.countDocuments(query)
        const total_page = Math.ceil(totalRecords / limit)
        const offset = (page_no - 1) * limit

        const records = await WalletTransactions.find(query).skip(offset).limit(limit).sort({ createdAt: -1 })
        const balance = await WalletBalance.findOne(queryForBalance)
        const balance_amount = parseFloat(_.get(balance, 'amount', 0.00)).toFixed(2)

        const response = {
            balance: Number(balance_amount),
            records: records,
            total_page: total_page,
            current_page_no: page_no,
            total_records: totalRecords,
            limit: limit
        }
        return successResponse(res, response, 'Wallet Transactions', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 400)
    }
})

router.post('/get-wallet-balance', async (req, res) => {
    try {
        const { domain, email, requestFrom } = req.body

        if (requestFrom === '/me') {
            await processMissingForumPayWebhook(email)
        }
        const balance = await getWalletBalance(email, domain)
        const response = { balance: balance }
        return successResponse(res, response, 'Wallet Transactions', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 400)
    }
})

router.post('/get-transaction-details', async (req, res) => {
    try {
        const { transaction_id } = req.body
        const select = {
            transaction_status: 1,
            user_id: 1,
            email: 1,
            transaction_type: 1,
            amount: 1,
            ip_address: 1,
            transaction_info: 1,
            createdAt: 1,
            'forumpay_response.status': 1,
            'forumpay_response.print_string': 1,
            'forumpay_response.state': 1,
            'forumpay_response.amount': 1,
            'forumpay_response.reference_no': 1
        }
        const transaction = await WalletTransactions.findById(transaction_id, select)

        if (transaction === null) {
            return errorResponse(res, {}, 'Transaction Not found', 400)
        }

        return successResponse(res, transaction, 'Transaction Detail', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 400)
    }
})

module.exports = router
