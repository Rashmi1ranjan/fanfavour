const express = require('express')
const router = express.Router()
const _ = require('lodash')
const moment = require('moment')
const UniversalLoginEventLogs = require('../models/UniversalLoginEventLogs')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('../middleware/auth.middleware')
const { errorResponseWithHTTPStatus, successResponse } = require('../utils/index')
const { API_STATIC_AUTH_TOKEN } = require('./../constants')

/**
 * @description Adding Logs of Universal Login events
 *
 * @param {object} req request body
 * @param {string} req.body.email user email
 * @param {string} req.body.event event name Example: register, register_merge, merge, add_new_card, change_card, change_payment_method
 * @param {string} req.body.domain emitted domain
 * @param {object} req.body.meta event meta
 */
router.post('/add-log', async (req, res) => {
    try {
        const token = _.get(req, 'headers.token', '')
        if (token !== API_STATIC_AUTH_TOKEN) return errorResponseWithHTTPStatus(res, {}, 'You are not authorized', 401)

        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', 400)
        const event = _.get(req, 'body.event', '')
        if (_.isEmpty(event)) return errorResponseWithHTTPStatus(res, {}, 'Invalid event', 400)

        const meta = _.get(req, 'body.meta', {})

        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid domain', 400)

        const eventLog = new UniversalLoginEventLogs({ email, event, domain, meta })
        await eventLog.save()
        return successResponse(res, {}, 'Log added successfully')
    } catch (error) {
        console.log(error)
        return errorResponseWithHTTPStatus(res, error, 'There was a problem while store log data', 500)
    }
})

/**
 * @description Adding Logs of Universal Login events
 *
 * @param {object} req request body
 * @param {string} req.body.email user email
 * @param {string} req.body.eventName event name Example: register, register_merge, merge, add_new_card, change_card, change_payment_method
 * @param {string} req.body.domain emitted domain
 * @param {object} req.body.details event metadata
 */
router.post('/get-event-logs', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', [])
        let currentPage = _.get(req, 'body.page', 1)
        const start_date = _.get(req, 'body.start_date', moment().format('MM/DD/YYYY'))
        const end_date = _.get(req, 'body.end_date', moment().format('MM/DD/YYYY'))
        const dateStart = start_date ? moment(start_date, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00.000+00:00') : ''
        const dateEnd = end_date ? moment(end_date, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59.999+00:00') : ''
        const event = _.get(req, 'body.event', [])
        const email = _.get(req, 'body.email', '').toLowerCase().trim()

        currentPage = parseInt(currentPage, 10)
        const limit = 20
        const project = {
            domain: 1,
            email: 1,
            event: 1,
            createdAt: 1,
            meta: 1
        }

        const query = {}

        if (dateStart && dateEnd) {
            query.createdAt = {
                $gte: new Date(dateStart),
                $lte: new Date(dateEnd)
            }
        }

        if (!_.isEmpty(email)) {
            query.email = email
        }
        if (domain.length > 0) {
            query.domain = { $in: domain }
        }

        if (event.length > 0) {
            query.event = { $in: event }
        }

        const totalRows = await UniversalLoginEventLogs.countDocuments(query)
        const totalPage = Math.ceil(totalRows / limit)
        let offset = (currentPage - 1) * limit

        let rows = []
        if (totalRows > 0) {
            rows = await UniversalLoginEventLogs.find(query, project).sort({ createdAt: -1 }).skip(offset).limit(limit)
        }

        const data = {
            rows: rows,
            currentPage: currentPage,
            limit: limit,
            totalRows: totalRows,
            totalPage: totalPage
        }
        return successResponse(res, data, 'Log data fetched successfully')
    } catch (error) {
        return errorResponseWithHTTPStatus(res, error, 'There was a problem while store log data', 500)
    }
})

module.exports = router
