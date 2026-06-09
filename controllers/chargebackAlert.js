const express = require('express')
const router = express.Router()
const _ = require('lodash')
const ChargebackAlert = require('../models/ChargebackAlert')
const { successResponse, errorResponse } = require('../utils/index')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const moment = require('moment')

router.post('/', async (req, res) => {
    try {
        const alert_type = _.get(req, 'body.hook.event', '')
        const data = {
            alert_type: alert_type,
            body: req.body,
            query: req.query
        }

        const ChargebackAlertData = new ChargebackAlert(data)
        await ChargebackAlertData.save()
        return successResponse(res, { message: 'Chargeback Alert Data successfully saved' }, 'Chargeback Alert Data successfully saved', 200)
    } catch (error) {
        return errorResponse(res, {}, 'Error in get Alerts', 200)
    }
})

router.post('/get-log', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const limit = 20
        const currentPage = parseInt(req.body.page, 10)
        const start_date = _.get(req, 'body.filter.start_date', '')
        const end_date = _.get(req, 'body.filter.end_date', '')
        const is_processed = _.get(req, 'body.filter.is_processed', 'false')
        const aggregate = []
        const query = {
            is_processed: is_processed === 'false' ? { $ne: true } : true
        }
        if (start_date !== '' && end_date !== '') {
            const dateStart = moment(start_date, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00')
            const dateEnd = moment(end_date, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59')
            query.createdAt = {
                $gte: new Date(dateStart),
                $lte: new Date(dateEnd)
            }
        }

        aggregate.push({ $match: query })
        aggregate.push({ $unwind: '$body.data.chargebacks' })

        const case_number = _.get(req, 'body.filter.case_number', '')
        if (case_number !== '') {
            aggregate.push({ $match: { 'body.data.chargebacks.chargeback.case_number': case_number } })
        }

        const card_number = _.get(req, 'body.filter.card_number', '')
        if (card_number !== '') {
            aggregate.push({ $match: { 'body.data.chargebacks.chargeback.card_number': card_number } })
        }

        aggregate.push({ $sort: { createdAt: -1 } })

        const offset = (currentPage - 1) * limit
        aggregate.push({
            $facet: {
                results: [{ $skip: offset }, { $limit: limit }],
                total: [{ $count: 'count' }]
            }
        })
        const chargebackAlerts = await ChargebackAlert.aggregate(aggregate)
        let rows = []
        let totalRows = 0
        let totalPages = 0
        if (chargebackAlerts[0].results.length > 0) {
            rows = chargebackAlerts[0].results
            totalRows = chargebackAlerts[0].total[0].count
            totalPages = Math.ceil(totalRows / limit)
        }
        const response = {
            rows: rows,
            totalPages: totalPages,
            currentPage: currentPage,
            totalRows: totalRows,
            limit: limit
        }
        return successResponse(res, response, 'Chargeback Alerts', 200)
    } catch (error) {
        return errorResponse(res, {}, 'Error in get Alerts', 200)
    }
})

router.post('/mark-all-as-processed', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const case_number = _.get(req, 'body.filter.case_number', '')
        if (case_number !== '') {
            let query = {
                is_processed: { $ne: true },
                'body.data.chargebacks.chargeback.case_number': case_number
            }
            const chargebackAlerts = await ChargebackAlert.updateMany(query, { is_processed: true })

            if (chargebackAlerts.modifiedCount > 0) {
                return successResponse(res, { status: true }, 'Alerts updated successfully.', 200)
            }
        } else {
            return errorResponse(res, {}, 'Case number is required', 400)
        }
    } catch (error) {
        return errorResponse(res, {}, 'Error in update log', 400)
    }
})

router.post('/mark-as-processed', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const data = req.body

    const updateLog = await ChargebackAlert.findByIdAndUpdate(data.log_id, { is_processed: true })

    if (updateLog === null) {
        return errorResponse(res, { status: false }, 'Error in update log', 400)
    }
    return successResponse(res, { status: true }, 'Log successfully mark as processed', 400)
})

module.exports = router
