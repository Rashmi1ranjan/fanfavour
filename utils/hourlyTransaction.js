const moment = require('moment')
const _ = require('lodash')
const CCBillErrorLog = require('./../models/CCBillErrorLog')
const StickyIoTransactionLog = require('../models/StickyIoTransactionLog')
const WalletTransaction = require('../models/WalletTransactions')

/**
 *
 * @param {Date} start_date start date
 * @param {Date} end_date end date
 * @param {string} domain domain
 * @param {number} daysDiff days diff count
 * @returns {object} return hourly transaction count
 */
async function getHourlyTransaction(start_date, end_date, domain = '', daysDiff = 0) {

    const CCBillQuery = {
        is_ccbill_error: false,
        approved: 1,
        error_from: 'Charge By Previous'
    }

    const transactionFilter = ['feed_unlock', 'chat_unlock', 'tip', 'subscription', 'chat_pay_per_message']
    const stickyioQuery = {
        transaction_status: 'SUCCESS',
        transaction_for: { $in: transactionFilter }
    }

    const forumpayQuery = {
        transaction_status: 'success',
        transaction_type: 'debit',
        wallet_transaction_status: 'success'
    }

    if (domain !== '') {
        CCBillQuery.domain = domain,
        stickyioQuery.domain = domain,
        forumpayQuery.domain = domain
    }

    CCBillQuery.created_at = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
    }
    const CCBillTransaction = await CCBillErrorLog.countDocuments(CCBillQuery)

    stickyioQuery.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
    }
    const stickyioTransaction = await StickyIoTransactionLog.countDocuments(stickyioQuery)

    forumpayQuery.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
    }
    const forumPayTransaction = await WalletTransaction.countDocuments(forumpayQuery)

    const totalTransaction = CCBillTransaction + stickyioTransaction + forumPayTransaction

    const data = {
        totalTransaction: totalTransaction,
        ccbillTransaction: CCBillTransaction,
        sticky_io_transaction: stickyioTransaction,
        forumpayTransaction: forumPayTransaction
    }

    if (daysDiff > 0) {
        data.date = moment(start_date).format('MM/DD/YYYY')
    } else {
        data.date = moment(start_date).format('HH') + '-' + moment(end_date).format('HH')
    }
    return data
}

module.exports = {
    getHourlyTransaction
}
