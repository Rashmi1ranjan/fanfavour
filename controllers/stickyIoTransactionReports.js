const express = require('express')
const router = express.Router()
const _ = require('lodash')
const StickyIoTransactionReport = require('../models/StickyIoTransactionReport')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const moment = require('moment')
const { NEW, REBILL, CHARGEBACK } = require('./../constants')
const { sendUserDataToWebsiteForBlockChargebackUser } = require('../utils/stickyIoTransactions')

router.post('/get_sticky_io_transaction_reports', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const currentPage = parseInt(req.body.page, 10)

    const filter = req.body.filter
    const limit = Number(filter.limit)
    const query = {}
    const startDate = _.get(filter, 'start_date', '')
    const endDate = _.get(filter, 'end_date', '')
    if (startDate !== '' && endDate !== '') {
        const dateStart = moment(startDate, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00')
        const dateEnd = moment(endDate, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59')
        query.transaction_date = { $gte: new Date(dateStart), $lte: new Date(dateEnd) }
    }

    const websiteUrl = _.get(filter, 'website_url', '')
    if (websiteUrl !== '') {
        query.website_url = websiteUrl
    }

    const transactionType = _.get(filter, 'transaction_type', 'all')
    if (transactionType !== 'all') {
        query.transaction_type = transactionType
    }

    const isRecurring = _.get(filter, 'is_recurring', 'all')
    if (isRecurring !== 'all') {
        query.is_recurring = isRecurring
    }

    const pcpTransactionType = _.get(filter, 'pcp_transaction_type', 'all')
    if (pcpTransactionType !== 'all') {
        query.pcp_transaction_type = pcpTransactionType
    }

    const campaignId = _.get(filter, 'campaign_id', '')
    if (campaignId !== '') {
        query.campaign_id = campaignId
    }

    const orderId = _.get(filter, 'order_id', '')
    if (orderId !== '') {
        query.order_id = orderId
    }

    const email = _.get(filter, 'email', '')
    if (email !== '') {
        query.email = email.trim().toLowerCase()
    }

    const userId = _.get(filter, 'user_id', '')
    if (userId !== '') {
        query.pcp_user_id = userId
    }

    const transactionId = _.get(filter, 'transaction_id', '')
    if (transactionId !== '') {
        query.pcp_transaction_id = transactionId
    }

    const paymentTransactionId = _.get(filter, 'payment_transaction_id', '')
    if (paymentTransactionId !== '') {
        query.transaction_number = paymentTransactionId
    }

    const paymentAuthId = _.get(filter, 'auth_number', '')
    if (paymentAuthId !== '') {
        query.auth_number = paymentAuthId
    }

    const gatewayId = _.get(filter, 'gateway_id', 'all')
    if (gatewayId !== 'all') {
        query.gateway_id = gatewayId
    }

    const totalRows = await StickyIoTransactionReport.countDocuments(query)
    const totalPages = Math.ceil(totalRows / limit)

    const offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await StickyIoTransactionReport.find(query).skip(offset).limit(limit).sort({ 'createdAt': 'desc' })
    }
    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

router.post('/process-chargeback-transaction', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const { transaction_id, notes, chargeback_date } = req.body

        const query = {
            _id: transaction_id,
            transaction_type: { $in: [NEW, REBILL] }
        }

        const transaction = await StickyIoTransactionReport.findOne(query)
        if (transaction === null) {
            return res.send({ status: false, message: 'Invalid Transaction' })
        }
        transaction.has_chargeback = true
        transaction.notes = notes
        transaction.chargeback_added_date = new Date()
        await transaction.save()

        const transaction_date = moment(chargeback_date, 'MM/DD/YYYY').format('YYYY-MM-DD 00:00:00+00:00')

        const transactionData = {
            amount: transaction.amount,
            transaction_date: transaction_date,
            website_url: transaction.website_url,
            pcp_transaction_type: transaction.pcp_transaction_type,
            pcp_user_id: transaction.pcp_user_id,
            first_name: transaction.first_name,
            last_name: transaction.last_name,
            email: transaction.email,
            card_type: transaction.card_type,
            is_recurring: transaction.is_recurring,
            pcp_transaction_id: transaction.pcp_transaction_id,
            transaction_number: transaction.transaction_number,
            auth_number: transaction.auth_number,
            transaction_payment_gateway: transaction.transaction_payment_gateway,
            is_cascaded: transaction.is_cascaded,
            original_gateway_id: transaction.original_gateway_id,
            original_decline_reason: transaction.original_decline_reason,
            gateway_id: transaction.gateway_id,
            notes: notes
        }

        const filter = {
            transaction_type: CHARGEBACK,
            campaign_id: transaction.campaign_id,
            product_id: transaction.product_id,
            order_id: transaction.order_id
        }
        await StickyIoTransactionReport.findOneAndUpdate(filter, transactionData, { upsert: true })

        const blockUserData = {
            user_id: transaction.pcp_user_id,
            chargeback_reason: notes,
            chargeback_date: transaction_date,
            pcp_transaction_id: transaction.pcp_transaction_id
        }
        const website = transaction.website_url
        sendUserDataToWebsiteForBlockChargebackUser(blockUserData, website)
        return res.send({ status: true, message: 'Chargeback Transaction Added' })
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }
})

module.exports = router
