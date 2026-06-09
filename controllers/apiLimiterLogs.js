const express = require('express')
const router = express.Router()
const ApiLimiter = require('../models/ApiLimiterLogs')
const _ = require('lodash')
const moment = require('moment')

router.post('/add_log', async (req, res) => {
    const body = req.body

    const ipAddress = _.get(body, 'ip_address', '')
    const apiEndPoint = _.get(body, 'api_end_point', '')
    const createdAt = moment().format('YYYY-MM-DDTHH:mm:ss.000Z')
    const domain = _.get(body, 'domain', '')
    const userId = _.get(body, 'user_id', '')
    const payload = _.get(body, 'payload', '')

    let apiLimiterData = new ApiLimiter()
    apiLimiterData.ip_address = ipAddress
    apiLimiterData.domain = domain
    apiLimiterData.api_end_point = apiEndPoint
    apiLimiterData.created_at = createdAt
    apiLimiterData.user_id = userId
    if (payload !== '') {
        apiLimiterData.payload = JSON.stringify(payload)
    }
    apiLimiterData.save()

    return res.send({ message: 'api limiter logs saved successfully' })
})

router.post('/get_api_limiter_logs', async (req, res) => {
    const domain = _.get(req, 'body.domain', '')
    let start_date = _.get(req, 'body.start_date', '')
    let end_date = _.get(req, 'body.end_date', '')
    let user_id = _.get(req, 'body.user_id', '')
    let ip_address = _.get(req, 'body.ip_address', '')
    let api_end_point = _.get(req, 'body.api_end_point', '')

    if (start_date !== '') {
        start_date = moment(start_date).format('YYYY-MM-DDT00:00:00')
        end_date = moment(end_date).format('YYYY-MM-DDT23:59:59')
    }

    const query = {}

    if (start_date !== '') {
        query.created_at = {
            $gte: start_date,
            $lte: end_date
        }
    }

    let currentPage = parseInt(req.query.page_num, 10)

    if (!_.isEmpty(domain)) {
        query.domain = 'https://' + domain.trim()
    }
    if (!_.isEmpty(user_id)) {
        query.user_id = user_id.trim()
    }
    if (!_.isEmpty(ip_address)) {
        query.ip_address = ip_address.trim()
    }
    if (!_.isEmpty(api_end_point)) {
        query.api_end_point = api_end_point.trim()
    }

    const totalRows = await ApiLimiter.countDocuments(query)
    let limit = 10
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await ApiLimiter.find(query)
            .skip(offset).limit(limit).sort({ 'created_at': 'desc' })
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
