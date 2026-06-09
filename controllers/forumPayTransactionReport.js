const express = require('express')
const router = express.Router()
const ForumPayTransactionReport = require('../models/ForumPayWalletTransactionReports')
const { protectRouteWithRole, SUPER_ADMIN } = require('./../middleware/auth.middleware')
const _ = require('lodash')
const moment = require('moment')
const { REBILL } = require('../constants')

router.post('/get-forum-pay-transaction-report', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    const currentPage = parseInt(req.body.page, 10)
    const filter = req.body.filter
    const limit = Number(filter.limit)
    const query = {}

    const startDate = _.get(filter, 'start_date', '')
    const endDate = _.get(filter, 'end_date', '')
    if (startDate !== '' && endDate !== '') {
        const start_date = moment(startDate, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00')
        const end_date = moment(endDate, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59')
        query.transaction_date = { $gte: start_date, $lte: end_date}
    }
    const websiteUrl = _.get(filter, 'website_url', '')
    if (websiteUrl !== '') {
        query.website_url = websiteUrl
    }
    const pcpTransactionType = _.get(filter, 'pcp_transaction_type', 'all')
    if (pcpTransactionType !== 'all') {
        if (pcpTransactionType === 'rebill') {
            query.transaction_type = REBILL
        } else {
            query.pcp_transaction_type = pcpTransactionType
        }
    }
    const pcpTransactionId = _.get(filter, 'pcp_transaction_id', '')
    if (pcpTransactionId !== '') {
        query.pcp_transaction_id = pcpTransactionId
    }
    const transactionId = _.get(filter, 'transaction_id', '')
    if (transactionId !== '') {
        query.transaction_id = transactionId
    }
    const user_id = _.get(filter, 'user_id', '')
    if (user_id !== '') {
        query.pcp_user_id = user_id
    }
    const email = _.get(filter, 'email', '')
    if (email !== '') {
        query.email = email
    }

    const offset = (currentPage - 1 ) * limit
    let rows = []
    let totalRecord = await ForumPayTransactionReport.countDocuments(query)
    const totalPages = Math.ceil(totalRecord / limit)

    if (totalRecord > 0) {
        rows = await ForumPayTransactionReport.find(query).sort({ transaction_date: -1 }).skip(offset).limit(limit)
    }
    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRecord,
        limit: limit
    })
})

module.exports = router
