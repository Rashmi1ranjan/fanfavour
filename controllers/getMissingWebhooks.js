const express = require('express')
const router = express.Router()
const TransactionReports = require('../models/CCBillTransactionReports')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_ANALYTICS, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const _ = require('lodash')

// this api is for get list of missing webhooks
router.get('/get_missing_webhook_list', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS, ROLE_SUPPORT]), async (req, res) => {

    const totalRows = await TransactionReports.find({ is_webhook_missing: true }).countDocuments()

    const currentPage = parseInt(req.query.page_num, 10)
    const limit = 20
    const totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await TransactionReports.aggregate([
            {
                $match: { is_webhook_missing: true }
            }, {
                $sort: {
                    pcp_transaction_date: -1
                }
            }, {
                $skip: offset
            }, {
                $limit: limit
            }, {
                '$lookup': {
                    'from': 'websites',
                    'localField': 'client_sub_account',
                    'foreignField': 'subscription_sub_account',
                    'as': 'website'
                }
            }, {
                $unwind: '$website'
            }, {
                $project: {
                    'subscription_id': 1,
                    'client_sub_account': 1,
                    'website.website_url': 1,
                    'first_name': 1,
                    'last_name': 1,
                    'email_address': 1,
                    'pcp_transaction_date': 1
                }
            }
        ])
    }

    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

// this api is use to resolve webhook
router.get('/resolve_missing_webhook', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS, ROLE_SUPPORT]), async (req, res) => {
    const transactionId = req.query._id.trim()
    if (_.isEmpty(transactionId)) {
        return res.send({ status: false, message: 'Transaction id not get' })
    }
    await TransactionReports.findByIdAndUpdate(transactionId,
        {
            $unset:
            {
                is_webhook_missing: 1
            }
        })
    return res.send({ status: true, message: 'Webhook resolved' })
})

module.exports = router
