const express = require("express");
const router = express.Router();
const asyncHandler = require('express-async-handler')
const TransactionReports = require('./../models/CCBillTransactionReports')

router.post("/get_charge_by_previous", asyncHandler(async (req, res) => {
    const email = req.body.email.trim()
    const subAccNum = req.body.sub_account_number

    TransactionReports.find({ type: "NEW", email_address: email, client_sub_account: subAccNum }).then(transactionData => {
        if (transactionData.length > 0) {
            const transactionsData = transactionData[0]
            let subscriptionId = transactionsData.subscription_id
            let status = true
            let clientAccnum = transactionsData.client_account_number
            let clientSubacc = transactionsData.client_sub_account
            let cardType = transactionsData.card_type

            var resData = {
                status,
                subscriptionId,
                clientAccnum,
                clientSubacc,
                cardType
            }

            return res.send(resData)
        } else {
            var resData = {
                status: false
            }
            return res.send(resData)
        }
    })
}))

module.exports = router
