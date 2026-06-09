const ForumPayWalletTransactionReports = require('./../models/ForumPayWalletTransactionReports')
const StickyIoTransactionsReport = require('./../models/StickyIoTransactionReport')

/**
 * @description Calculate user amount spent with forum pay
 * @param {string} user_id User id
 * @param {string} domain Domain name
 * @returns {object} Object of amount spent
 */
async function calculateUserAmountSpentWithForumPay(user_id, domain) {
    let amountSpent = {
        amount: 0,
        refundAmount: 0,
        voidAmount: 0,
        chargeBackAmount: 0,
        chargeBackCount: 0
    }

    const transactions = await ForumPayWalletTransactionReports.aggregate([
        { $match: { pcp_user_id: user_id, website_url: domain } },
        {
            $group: {
                _id: '$transaction_type',
                amount: { $sum: { $toDouble: '$amount' } },
                count: { $sum: 1 }
            }
        }
    ])

    if (transactions.length > 0) {
        amountSpent = calculateAmounts(transactions)
    }

    return amountSpent
}

/**
 * @description Calculate user amount spent with forum pay
 * @param {string} user_id User id
 * @param {string} domain Domain name
 * @returns {object} Object of amount spent
 */
async function calculateUserAmountSpentWithStickyIo(user_id, domain) {
    let amountSpent = {
        amount: 0,
        refundAmount: 0,
        voidAmount: 0,
        chargeBackAmount: 0,
        chargeBackCount: 0
    }

    const transactions = await StickyIoTransactionsReport.aggregate([
        { $match: { pcp_user_id: user_id, website_url: domain } },
        {
            $group: {
                _id: '$transaction_type',
                amount: { $sum: { $toDouble: '$amount' } },
                count: { $sum: 1 }
            }
        }
    ])

    if (transactions.length > 0) {
        amountSpent = calculateAmounts(transactions)
    }

    return amountSpent
}

/**
 * @description calculate amounts
 * @param {object} transactions Object of transactions
 * @returns {object} Calculate user amount spent
 */
function calculateAmounts(transactions) {
    let totalAmountSpent = 0
    let totalRefundAmount = 0
    let totalVoidAmount = 0
    let totalChargeBackAmount = 0
    let chargeBackCount = 0

    for (const transaction of transactions) {
        if (transaction._id === 'NEW' || transaction._id === 'REBILL') {
            totalAmountSpent += parseFloat(transaction.amount)
        }

        if (transaction._id === 'REFUND' || transaction._id === 'VOID' || transaction._id === 'CHARGEBACK') {
            totalAmountSpent -= parseFloat(transaction.amount)
            if (transaction._id === 'REFUND') {
                totalRefundAmount += parseFloat(transaction.amount)
            }
            if (transaction._id === 'VOID') {
                totalVoidAmount += parseFloat(transaction.amount)
            }
            if (transaction._id === 'CHARGEBACK') {
                totalChargeBackAmount += parseFloat(transaction.amount)
                chargeBackCount = transaction.count
            }
        }
    }

    return {
        amount: totalAmountSpent,
        refundAmount: totalRefundAmount,
        voidAmount: totalVoidAmount,
        chargeBackAmount: totalChargeBackAmount,
        chargeBackCount: chargeBackCount
    }
}

module.exports = {
    calculateUserAmountSpentWithForumPay,
    calculateUserAmountSpentWithStickyIo
}
