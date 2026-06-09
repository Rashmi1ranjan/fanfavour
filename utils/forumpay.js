const axios = require('axios')
const _ = require('lodash')
const mongoose = require('mongoose')
const WalletBalance = require('./../models/WalletBalance')
const WalletTransactions = require('./../models/WalletTransactions')
const UniversalUsers = require('../models/UniversalUsers')
const { updateUniversalUserDetails } = require('./universalLogin')
const { getWebsiteDomain } = require('./getWebsiteDomain')
const live_configuration = {
    api_url: 'https://api.forumpay.com/pay/v2/',
    auth_username: '57bede23-1ec6-40ee-b622-df2eff9ab902',
    auth_password: 'AcIeSKhcphew8c4oreWIT9UzvZYFa0ADmDaio-Q8rTuJkKZz7l-Nr5jwZACP'
}
const sandbox_configuration = {
    api_url: 'https://sandbox.api.forumpay.com/pay/v2/',
    auth_username: 'ae30a225-8ca8-4f44-910f-61470b67251b',
    auth_password: 'vPlbOWgsuFy3iT1YwOSZtWLzKCRWmcdE0EFTU7bNAN1Rde7ALUpyDd7kg8Mf'
}

/**
 * @description Get Forumpay Configuration
 * @returns {object} return forumpay configuration setting
 */
function getForumPayConfiguration() {
    return {
        sandbox: sandbox_configuration,
        live: live_configuration
    }
}

/**
 * @description Update wallet balance after successful transaction
 * @param {string} email email address
 * @param {string} domain domain name
 * @param {string} crypto_currency domain name
 */
async function updateWalletAmount(email, domain, crypto_currency = '') {
    let matchQuery = {
        domain: domain,
        email: email,
        transaction_status: 'success'
    }
    let isUserUniversal = false

    const user = await UniversalUsers.findOne({ email: email, universal_login_merged_domains: { $in: domain } }, 'universal_login_merged_domains wallet_amount')
    if (_.isEmpty(user) === false) {
        isUserUniversal = true
        matchQuery.domain = { $in: user.universal_login_merged_domains }
    }
    const aggregate = [
        {
            $match: matchQuery
        }, {
            $group: {
                '_id': '$transaction_type',
                'amount': {
                    '$sum': '$amount'
                }
            }
        }
    ]

    const credit_debit = await WalletTransactions.aggregate(aggregate)
    let credit_amount = 0
    let debit_amount = 0
    for (let amount of credit_debit) {
        if (amount._id === 'credit') {
            credit_amount = amount.amount
        }

        if (amount._id === 'debit') {
            debit_amount = amount.amount
        }
    }

    const balance_amount = credit_amount - debit_amount
    let query = { email }
    const update = { amount: balance_amount }
    // Update balance
    if (isUserUniversal) {
        const update = { $set: { wallet_amount: balance_amount } }
        query.universal_wallet = true
        if (_.isEmpty(crypto_currency) === false) {
            update['$set'] = {
                default_payment_method: 'crypto_currency',
                last_used_crypto_currency: crypto_currency
            }
        }
        await updateUniversalUserDetails({ email: email, universal_login_merged_domains: { $in: domain } }, update, domain, 'wallet')
        await WalletBalance.deleteMany({ email: email, domain: { $in: user.universal_login_merged_domains } })
    } else {
        query.domain = domain
    }
    await WalletBalance.updateOne(query, update, { upsert: true })
    return balance_amount
}


/**
 * @description Get Wallet Amount
 * @param {string} email Email address
 * @param {string} domain Domain Name
 * @returns {number} wallet amount
 */
async function getWalletBalance(email, domain) {
    let query = { email, domain }

    const isUserUniversal = await UniversalUsers.exists({ email: email, universal_login_merged_domains: { $in: domain } })
    if (!_.isEmpty(isUserUniversal)) {
        query = { email: email, universal_wallet: true }
    }

    const walletBalance = await WalletBalance.findOne(query)
    const wallet_amount = parseFloat(_.get(walletBalance, 'amount', 0.00)).toFixed(2)
    return Number(wallet_amount)
}

/**
 * @description get Forumpay configuration
 * @returns {object} Object of forum pay auth credentials
 */
function forumPayConfiguration() {
    const live_payment_enabled = process.env.NODE_ENV === 'development' ? false : true

    const { live, sandbox } = getForumPayConfiguration()

    const api_url = (live_payment_enabled === true) ? live.api_url : sandbox.api_url
    const auth_username = (live_payment_enabled === true) ? live.auth_username : sandbox.auth_username
    const auth_password = (live_payment_enabled === true) ? live.auth_password : sandbox.auth_password

    const header_option = {
        auth: { username: auth_username, password: auth_password }
    }

    return { api_url, header_option }
}

/**
 * @description Start Payment
 * @param {object} data object of payment data
 * @returns {any} response
 */
async function checkForumPayPaymentStatus(data) {
    try {
        const { api_url, header_option } = forumPayConfiguration()
        const queryString = new URLSearchParams(data).toString()

        const apiUrl = `${api_url}CheckPayment/?${queryString}`

        const response = await axios.get(apiUrl, header_option)

        const error = _.get(response, 'data.err', '')
        if (error !== '') {
            const result = { status: false, data: error }
            return result
        }

        const result = { status: true, data: response.data }
        return result
    } catch (error) {
        const result = { status: false, data: error }
        return result
    }
}

/**
 * @description Start Payment
 * @param {string} user_id User id
 * @param {string} transaction_id Transaction id
 * @param {string} amount Amount
 * @param {string} domain Domain
 * @returns {any} response
 */
async function sendEmailForSuccessTransaction(user_id, transaction_id, amount, domain) {
    try {
        const data = { user_id, transaction_id, amount }
        const api_domain = getWebsiteDomain(domain)
        const api_url = `${api_domain}/api/crypto/send-success-transaction-email`
        const response = await axios.post(api_url, data)

        const error = _.get(response, 'data.err', '')
        if (error !== '') {
            const result = { status: false, data: error }
            return result
        }

        const result = { status: true, data: response.data }
        return result
    } catch (error) {
        const result = { status: false, data: error }
        return result
    }
}

/**
 * @description Update transaction
 * @param {object} data object of transaction details
 * @returns {object} status and message
 */
async function updateWalletTransaction(data) {
    const { pos_id, currency, address, payment_id, reference_no } = data
    const select = {
        transaction_status: 1,
        user_id: 1,
        email: 1,
        transaction_type: 1,
        amount: 1,
        ip_address: 1,
        transaction_info: 1,
        createdAt: 1,
        domain: 1,
        'forumpay_response.status': 1,
        'forumpay_response.print_string': 1,
        'forumpay_response.state': 1
    }
    const transaction = await WalletTransactions.findById(reference_no, select)
    if (transaction === null) {
        return { status: true, message: 'Transaction not found for reference no' }
    }

    if (transaction.transaction_status === 'success') {
        return { status: true, message: 'Transaction Already Processed', is_duplicate_webhook: true }
    }

    const crypto_address = _.get(transaction, 'transaction_info.address', '')
    if (crypto_address === '') {
        transaction.transaction_status = 'failed'
        transaction.wallet_transaction_status = 'failed'
        await transaction.save()
        return { status: true, message: 'Payment Cancelled', is_processed: true }
    }

    const paymentInfo = {
        pos_id: pos_id,
        currency: currency,
        address: address,
        payment_id: payment_id
    }

    const paymentResponse = await checkForumPayPaymentStatus(paymentInfo)
    const paymentData = paymentResponse.data
    if (paymentData.reference_no !== reference_no.toString()) {
        return { status: true, message: 'Invalid transaction information. wrong Reference No' }
    }

    if (paymentResponse.status === false) {
        transaction.transaction_status = 'failed'
        transaction.wallet_transaction_status = 'failed'
        transaction.forumpay_response = paymentData
        transaction.amount = Number(paymentData.invoice_amount)
        transaction.transaction_info.address = address
        await transaction.save()

        return { status: true, message: 'Payment Cancelled', is_processed: true }
    }

    if (paymentData.cancelled === true) {
        transaction.transaction_status = 'failed'
        transaction.wallet_transaction_status = 'failed'
        transaction.forumpay_response = paymentData
        transaction.amount = Number(paymentData.invoice_amount)
        transaction.transaction_info.address = address
        await transaction.save()

        return { status: true, message: 'Payment Cancelled', is_processed: true }
    }

    if (paymentData.state === 'confirmed' || paymentData.state === 'zero_confirmed') {
        transaction.transaction_status = 'success'
        transaction.wallet_transaction_status = 'success'
        transaction.forumpay_response = paymentData
        transaction.amount = Number(paymentData.invoice_amount)
        transaction.transaction_info.address = address
        await transaction.save()

        // update wallet balance
        const { email, domain, user_id } = transaction
        await updateWalletAmount(email, domain, transaction.forumpay_response.currency)

        sendEmailForSuccessTransaction(user_id, transaction._id, paymentData.invoice_amount, domain)
        // 'Payment Successfully updated'
        return { status: true, message: 'Payment Successfully updated', is_processed: true }
    }

    return { status: true, message: 'Payment is in same state' }
}

/**
 * @description Find and update missing webhook transaction
 * @param {string} email User's email - optional
 */
async function processMissingForumPayWebhook(email = '') {
    try {
        const query = {
            transaction_type: 'credit',
            transaction_status: { $in: ['processing'] }
        }
        if (email !== undefined || email !== '') {
            query.email = email
        }
        const totalProcessingTransaction = await WalletTransactions.countDocuments(query)
        const limit = 50
        const totalPages = Math.ceil(totalProcessingTransaction / limit)

        for (let index = 0; index < totalPages; index++) {
            const offset = index * limit
            const transactions = await WalletTransactions.find(query).sort({ _id: 1 }).skip(offset).limit(limit)
            for (const transaction of transactions) {
                const { transaction_info } = transaction
                const transactionInfo = {
                    pos_id: transaction_info.pos_id,
                    currency: transaction_info.crypto_currency,
                    address: transaction_info.address,
                    payment_id: transaction_info.payment_id,
                    reference_no: transaction._id
                }
                await updateWalletTransaction(transactionInfo)
            }
        }
    } catch (error) {
        console.log(error)
    }
}

/**
 * @description Get Wallet Transaction Status
 * @param {string} transaction_status transaction status
 * @param {boolean} is_region_error is region error
 * @param {boolean} is_error is error
 * @returns {string} wallet transaction status
 */
function getWalletTransactionStatus(transaction_status, is_region_error, is_error) {
    if (transaction_status === 'processing') {
        return 'pending'
    }

    if (transaction_status === 'success') {
        return 'success'
    }

    if (transaction_status === 'failed' && is_region_error === true) {
        return 'region_error'
    }

    if (transaction_status === 'failed' && is_error === true) {
        return 'error'
    }

    if (transaction_status === 'failed' && is_error === false && is_region_error === false) {
        return 'failed'
    }

    return transaction_status
}

/**
 * @param {string|number} limit Limit for records needs to process
 * @description Accept Cancelled Transactions
 */
async function acceptCancelledTransactions(limit) {
    try {
        const summary = {
            total_transactions: 0,
            successfully_accept: 0,
            error_accept: 0
        }
        const error_in_accept_payment = []
        const success_transactions = []
        const query = {
            transaction_type: 'credit',
            'forumpay_response.refund_status': 'Refund needed'
        }
        const totalTransactions = await WalletTransactions.countDocuments(query)
        summary.total_transactions = totalTransactions

        let transactions
        if (limit === null) {
            console.log('process all transactions')
            transactions = await WalletTransactions.find(query)
        } else {
            console.log('process transactions', limit)
            transactions = await WalletTransactions.find(query).limit(parseInt(limit))
        }
        console.log(`Transactions To update: ${transactions.length}`)

        for (const transaction of transactions) {
            const { transaction_info } = transaction
            const { pos_id, address, payment_id, crypto_currency } = transaction_info
            const paymentInfo = {
                pos_id: pos_id,
                currency: crypto_currency,
                address: address,
                payment_id: payment_id
            }

            const paymentResponse = await checkForumPayPaymentStatus(paymentInfo)
            if (paymentResponse.status === false) {
                const error = {
                    ...paymentInfo,
                    error: paymentResponse.data
                }
                error_in_accept_payment.push(error)
                summary.error_accept = summary.error_accept + 1
                continue
            }

            const paymentData = paymentResponse.data
            if (paymentData.refund_status === 'Refund needed') {
                const { unconfirmed_amount, unconfirmed_invoice_amount } = paymentData
                const acceptPaymentData = {
                    pos_id: pos_id,
                    currency: crypto_currency,
                    payment_id: payment_id,
                    address: address,
                    accepted_amount: unconfirmed_amount,
                    accepted_invoice_amount: unconfirmed_invoice_amount
                }

                const accept = await acceptPayment(acceptPaymentData)
                if (accept.status === false) {
                    const error = {
                        ...paymentInfo,
                        error: accept.data
                    }
                    error_in_accept_payment.push(error)
                    summary.error_accept = summary.error_accept + 1
                    continue
                }

                transaction.transaction_info.is_confirm_by_cron = true
                await transaction.save()

                summary.successfully_accept = summary.successfully_accept + 1
                success_transactions.push(transaction_info)
            } else {
                const error = {
                    ...paymentInfo,
                    error: 'No need to accept transaction'
                }
                error_in_accept_payment.push(error)
                summary.error_accept = summary.error_accept + 1
                continue
            }
        }
        console.log('Error in accept payment: ', error_in_accept_payment)
        console.log('Success in accept payment: ', success_transactions)
        console.table(summary)
    } catch (error) {
        console.log(error)
    }
}

/**
 * @description Accept Payment
 * @param {object} data object of payment data
 * @returns {any} response
 */
async function acceptPayment(data) {
    try {
        const { api_url, header_option } = forumPayConfiguration()
        const queryString = new URLSearchParams(data).toString()

        const apiUrl = `${api_url}AcceptPayment/?${queryString}`
        const response = await axios.get(apiUrl, header_option)

        const error = _.get(response, 'data.err', '')
        if (error !== '') {
            const result = { status: false, data: error }
            return result
        }

        const result = { status: true, data: response.data }
        return result
    } catch (error) {
        const result = { status: false, data: error }
        return result
    }
}

/**
 * @description Check forumpay transaction status after payment accept
 */
async function checkForumPayTransactionStatusAfterPaymentAccept() {
    try {
        const summary = {
            total_transactions: 0,
            successfully_accept: 0,
            error_accept: 0
        }
        const error_in_accept_payment = []
        const query = {
            transaction_type: 'credit',
            'forumpay_response.refund_status': 'Refund needed'
        }
        const transactions = await WalletTransactions.find(query)
        summary.total_transactions = transactions.length

        for (const transaction of transactions) {
            const { transaction_info } = transaction
            const { pos_id, address, payment_id, crypto_currency } = transaction_info
            const paymentInfo = {
                pos_id: pos_id,
                currency: crypto_currency,
                address: address,
                payment_id: payment_id
            }

            const paymentResponse = await checkForumPayPaymentStatus(paymentInfo)
            if (paymentResponse.status === false) {
                const error = {
                    ...paymentInfo,
                    error: paymentResponse.data
                }
                error_in_accept_payment.push(error)
                summary.error_accept = summary.error_accept + 1
                continue
            }
            const paymentStatus = await checkForumPayPaymentStatus(paymentInfo)
            if (paymentStatus.status === false) {
                const error = {
                    ...paymentInfo,
                    error: paymentStatus.data
                }
                error_in_accept_payment.push(error)
                summary.error_accept = summary.error_accept + 1
                continue
            }

            const payment = paymentStatus.data
            if (payment.status === false) {
                const error = {
                    ...paymentInfo,
                    error: payment.data
                }
                error_in_accept_payment.push(error)
                summary.error_accept = summary.error_accept + 1
                continue
            }

            if (payment.state === 'confirmed' || payment.state === 'zero_confirmed') {
                transaction.transaction_status = 'success'
                transaction.wallet_transaction_status = 'success'
                transaction.forumpay_response = payment
                transaction.amount = Number(payment.invoice_amount)
                transaction.transaction_info.address = address
                transaction.transaction_info.is_confirm_by_cron = true
                await transaction.save()


                // update wallet balance
                const { email, domain, user_id } = transaction
                await updateWalletAmount(email, domain, transaction.forumpay_response.currency)

                sendEmailForSuccessTransaction(user_id, transaction._id, payment.invoice_amount, domain)
                summary.successfully_accept = summary.successfully_accept + 1
            }
        }
        console.log('Error in accept payment: ', error_in_accept_payment)
        console.table(summary)
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    getWalletBalance,
    updateWalletAmount,
    getForumPayConfiguration,
    checkForumPayPaymentStatus,
    forumPayConfiguration,
    sendEmailForSuccessTransaction,
    updateWalletTransaction,
    processMissingForumPayWebhook,
    getWalletTransactionStatus,
    acceptCancelledTransactions,
    checkForumPayTransactionStatusAfterPaymentAccept
}
