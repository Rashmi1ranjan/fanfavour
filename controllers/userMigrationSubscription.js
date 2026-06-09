const express = require('express')
const router = express.Router()
const _ = require('lodash')
const StickyIoTransactionReport = require('../models/StickyIoTransactionReport')
const CCBillTransactionReports = require('./../models/CCBillTransactionReports')

router.post('/get-migration-subscription-status', async (req, res) => {
    try {
        const conditions = _.get(req, 'body.conditions', [])
        const subscriptionIdsArray = _.get(req, 'body.subscription_ids', [])
        const stickyIoOrderIdsArray = _.get(req, 'body.sticky_io_order_ids', [])
        let amountArray = []
        if (conditions.length === 0) {
            res.send(amountArray)
        }
        for (let index = 0; index < conditions.length; index++) {
            const condition = conditions[index]
            const userSpentAmount = await getUserSpendAmountByDays(condition.spent_amount_time, subscriptionIdsArray, stickyIoOrderIdsArray)
            amountArray.push(userSpentAmount)
        }
        res.send(amountArray)
    } catch (err) {
        console.log(err)
        res.send([])
    }
})

async function getUserSpendAmountByDays(days, subscriptionIdsArray, stickyIoOrderIdsArray) {
    let userSpentAmount = 0
    const date = new Date()
    date.setDate(date.getDate() - days)
    if (subscriptionIdsArray.length > 0) {
        let rows = await CCBillTransactionReports.find({ pcp_transaction_date: { $gte: date }, subscription_id: { $in: subscriptionIdsArray } }, 'type accounting_amount')
        if (rows.length > 0) {
            for (const row of rows) {
                if (row.type == 'NEW' || row.type == 'REBILL') {
                    userSpentAmount += row.accounting_amount
                } else if (row.type == 'REFUND' || row.type == 'CHARGEBACK' || row.type == 'VOID') {
                    userSpentAmount -= row.accounting_amount
                }
            }
        }
    }

    if (stickyIoOrderIdsArray.length > 0) {
        const transactions = await StickyIoTransactionReport.find({ order_id: { $in: stickyIoOrderIdsArray }, transaction_date: { $gte: date } })
        if (transactions.length > 0) {
            for (const transaction of transactions) {
                if (transaction.transaction_type == 'NEW' || transaction.transaction_type == 'REBILL') {
                    userSpentAmount += parseFloat(transaction.amount)
                } else if (transaction.transaction_type == 'REFUND' || transaction.transaction_type == 'CHARGEBACK' || transaction.transaction_type == 'VOID') {
                    userSpentAmount -= parseFloat(transaction.amount)
                }
            }
        }
    }
    return userSpentAmount
}
module.exports = router
