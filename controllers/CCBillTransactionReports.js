const express = require('express')
const router = express.Router()
const _ = require('lodash')
const CCBillTransactionReports = require('../models/CCBillTransactionReports')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const moment = require('moment')

router.post('/', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const currentPage = parseInt(req.body.page, 10)
    const filter = req.body.filter
    const limit = 20
    const query = {}

    const startDate = _.get(filter, 'start_date', '')
    const endDate = _.get(filter, 'end_date', '')
    if (startDate !== '' && endDate !== '') {
        const dateStart = moment(startDate, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00')
        const dateEnd = moment(endDate, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59')
        query.pcp_transaction_date = { $gte: new Date(dateStart), $lte: new Date(dateEnd) }
    }

    const transactionType = _.get(filter, 'transaction_type', [])
    if (transactionType.length > 0) {
        query.type = { $in: transactionType }
    }

    const clientAccountNumber = _.get(filter, 'client_account_number', '')
    if (clientAccountNumber !== '') {
        query.client_account_number = clientAccountNumber
    }

    const clientSubAccount = _.get(filter, 'client_sub_account', '')
    if (clientSubAccount !== '') {
        query.client_sub_account = clientSubAccount
    }

    const subscriptionId = _.get(filter, 'subscription_id', '')
    if (subscriptionId !== '') {
        query.subscription_id = subscriptionId
    }

    const email = _.get(filter, 'email', '')
    if (email !== '') {
        query.email_address = email
    }

    const domain_sub_account_array = _.get(filter, 'domain_sub_account_array', [])
    if (domain_sub_account_array.length > 0) {
        query.client_sub_account = { $in: domain_sub_account_array }
    }
    const totalRows = await CCBillTransactionReports.countDocuments(query)
    const totalPages = Math.ceil(totalRows / limit)

    const offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await CCBillTransactionReports.find(query).skip(offset).limit(limit).sort({ pcp_transaction_date: -1 })
    }
    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

module.exports = router
