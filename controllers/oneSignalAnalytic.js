const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const _ = require('lodash')
const moment = require('moment')
const OneSignalAnalytics = require('../models/OneSignalAnalytics')
const { errorResponse, successResponse } = require('../utils')
const { SUPER_ADMIN, protectRouteWithRole } = require('./../middleware/auth.middleware')

router.post('/add-notification-data', asyncHandler(async (req, res) => {
    try {
        let notificationData = {}
        const notification_id = _.get(req, 'body.notification_id', false)
        const message = _.get(req, 'body.message', '')
        const from = _.get(req, 'body.from', '')
        const domain = _.get(req, 'body.domain', '')

        if (notification_id !== false) {
            notificationData.notification_id = notification_id
            notificationData.message = message
            notificationData.from = from
            notificationData.domain = domain
        }
        const oneSignalAnalytics = new OneSignalAnalytics(notificationData)
        await oneSignalAnalytics.save()
        return successResponse(res, { oneSignalAnalytics }, 'Success', 200)
    } catch (error) {
        console.log(error)
        return errorResponse(res, error, 'Something wrong', 500)
    }
}))

router.get('/get', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', [])
        let currentPage = _.get(req, 'query.page', 1)
        const start_date = _.get(req, 'query.start_date', moment().format('MM/DD/YYYY'))
        const end_date = _.get(req, 'query.end_date', moment().format('MM/DD/YYYY'))
        const dateStart = moment(new Date(start_date)).format('YYYY-MM-DDT00:00:00.000+00:00')
        const dateEnd = moment(new Date(end_date)).format('YYYY-MM-DDT23:59:59.999+00:00')

        currentPage = parseInt(currentPage, 10)

        const limit = 20
        const project = {
            notification_id: 1,
            message: 1,
            from: 1,
            domain: 1,
            createdAt: 1,
            sended: {
                successful: '$onesignal_res.successful',
                failed: '$onesignal_res.failed',
                errored: '$onesignal_res.errored'
            }
        }

        const query = {
            createdAt: {
                $gte: new Date(dateStart),
                $lte: new Date(dateEnd)
            }
        }
        if (_.isEmpty(domain) === false) {
            query.domain = { $in: domain }
        }
        const totalRows = await OneSignalAnalytics.countDocuments(query)
        const totalPage = Math.ceil(totalRows / limit)
        let offset = (currentPage - 1) * limit

        let rows = []
        if (totalRows > 0) {
            rows = await OneSignalAnalytics.find(query, project).sort({ createdAt: -1 }).skip(offset).limit(limit)
        }

        const data = {
            rows: rows,
            currentPage: currentPage,
            limit: limit,
            totalRows: totalRows,
            totalPage: totalPage
        }
        return successResponse(res, data, 'Success', 200)
    } catch (error) {
        console.log(error)
        return errorResponse(res, error, 'Invalid Request', 500)
    }
})

module.exports = router
