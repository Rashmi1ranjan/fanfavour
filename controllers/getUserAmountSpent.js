const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const TransactionReports = require('./../models/CCBillTransactionReports')
const StickyIoTransactionsReport = require('./../models/StickyIoTransactionReport')
const { calculateUserAmountSpentWithForumPay, calculateUserAmountSpentWithStickyIo } = require('../utils/userAmountSpent')
const { successResponse, catchResponse } = require('../utils/index')
const _ = require('lodash')
const moment = require('moment')

router.post('/', asyncHandler(async (req, res) => {
    const subscriptionIdArray = req.body.subscription_id_array
    let lastSubscriptionDate = _.get(req.body, 'last_subscription_date', '')
    let totalAmountSpent = 0
    let totalRefundAmount = 0
    let totalChargeBackAmount = 0
    let totalVoidAmount = 0
    let chargeBackCount = 0
    let spentAmountAfterResubscription = 0

    for (let index = 0; index < subscriptionIdArray.length; index++) {
        const subscriptionId = subscriptionIdArray[index]
        let rows = await TransactionReports.find({ subscription_id: subscriptionId }, 'type accounting_amount pcp_transaction_date')

        if (rows.length > 0) {
            for (let index = 0; index < rows.length; index++) {
                const row = rows[index]

                if (row.type == 'NEW' || row.type == 'REBILL') {
                    totalAmountSpent += row.accounting_amount

                    if (lastSubscriptionDate !== '') {
                        const pcpTransactionDate = new Date(row.pcp_transaction_date)
                        if (moment(pcpTransactionDate).isSameOrAfter(lastSubscriptionDate)) {
                            spentAmountAfterResubscription += row.accounting_amount
                        }
                    }
                } else if (row.type == 'REFUND' || row.type == 'CHARGEBACK' || row.type == 'VOID') {
                    totalAmountSpent -= row.accounting_amount
                    if (row.type == 'REFUND') {
                        totalRefundAmount += row.accounting_amount
                    }
                    if (row.type == 'CHARGEBACK') {
                        totalChargeBackAmount += row.accounting_amount
                        chargeBackCount++
                    }
                    if (row.type == 'VOID') {
                        totalVoidAmount += row.accounting_amount
                    }
                }
            }
        }
    }

    const amounts = {
        amount: totalAmountSpent,
        refundAmount: totalRefundAmount,
        voidAmount: totalVoidAmount,
        chargeBackAmount: totalChargeBackAmount,
        chargeBackCount: chargeBackCount,
        spentAmountAfterResubscription
    }

    return res.send(amounts)
}))

router.post('/sticky-io', asyncHandler(async (req, res) => {
    const orderIdArray = req.body.order_id_array
    let totalAmountSpent = 0
    let totalRefundAmount = 0
    let totalChargeBackAmount = 0
    let totalVoidAmount = 0
    let chargeBackCount = 0

    const transactions = await StickyIoTransactionsReport.find({ order_id: { $in: orderIdArray } })
    if (transactions.length > 0) {
        for (const transaction of transactions) {
            if (transaction.transaction_type == 'NEW' || transaction.transaction_type == 'REBILL') {
                totalAmountSpent += parseFloat(transaction.amount)
            } else if (transaction.transaction_type == 'REFUND' || transaction.transaction_type == 'CHARGEBACK' || transaction.transaction_type == 'VOID') {
                totalAmountSpent -= parseFloat(transaction.amount)
                if (transaction.transaction_type == 'REFUND') {
                    totalRefundAmount += parseFloat(transaction.amount)
                }
                if (transaction.transaction_type == 'CHARGEBACK') {
                    totalChargeBackAmount += parseFloat(transaction.amount)
                    chargeBackCount++
                }
                if (transaction.transaction_type == 'VOID') {
                    totalVoidAmount += parseFloat(transaction.amount)
                }
            }
        }
    }

    const amounts = {
        amount: totalAmountSpent,
        refundAmount: totalRefundAmount,
        voidAmount: totalVoidAmount,
        chargeBackAmount: totalChargeBackAmount,
        chargeBackCount: chargeBackCount
    }

    return res.send(amounts)
}))

router.post('/all-amount-spent', asyncHandler(async (req, res) => {
    try {
        const users = req.body.user_ids
        const domain = req.body.domain
        const userAmountSpent = []
        for (const user of users) {
            const forumPayAmountSpent = await calculateUserAmountSpentWithForumPay(user._id, domain)
            const stickyIoSpent = await calculateUserAmountSpentWithStickyIo(user._id, domain)

            const amounts = {
                user_id: user._id,
                amount: forumPayAmountSpent.amount + stickyIoSpent.amount,
                refundAmount: forumPayAmountSpent.refundAmount + stickyIoSpent.refundAmount,
                voidAmount: forumPayAmountSpent.voidAmount + stickyIoSpent.voidAmount,
                chargeBackAmount: forumPayAmountSpent.chargeBackAmount + stickyIoSpent.chargeBackAmount,
                chargeBackCount: forumPayAmountSpent.chargeBackCount + stickyIoSpent.chargeBackCount
            }

            userAmountSpent.push(amounts)
        }

        return successResponse(res, userAmountSpent, 'User Amount Spent', 200)
    } catch (error) {
        console.log('Error in user amount spent')
        console.log(error)
        return catchResponse(res, {}, error.message, 200)
    }
}))

module.exports = router
