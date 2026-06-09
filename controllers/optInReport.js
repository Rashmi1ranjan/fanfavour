const express = require('express')
const router = express.Router()
const OptInReport = require('../models/OptInStatusReport')
const { SUPER_ADMIN, protectRouteWithRole } = require('./../middleware/auth.middleware')
const _ = require('lodash')

router.post('/get-opt-in-report', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    let currentPage = parseInt(req.query.page_num, 10)
    const query = {}
    const domain = _.get(req, 'body.domain', 'all')
    if (!_.isEmpty(domain)) {
        query.website_url = domain
    }
    const totalRows = await OptInReport.countDocuments(query)
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    const commonObject = {
        popupDisplayCount: 0,
        activeUserCount: 0,
        activeCancelledUserCount: 0,
        cancelledUserCount: 0,
        registeredUserCount: 0,
        total: 0
    }
    const commonObjectForTotal = {
        popupDisplayCount: 0,
        activeUser: 0,
        activeCancelledUserCount: 0,
        cancelledUserCount: 0,
        registeredUserCount: 0,
        total: 0
    }
    let rows = [{
        opt_in_pending: commonObject,
        opt_in_link_sent: commonObject,
        opt_in: commonObject,
        declined: commonObject,
        bounced: commonObject,
        bounced_declined: commonObject,
        total: commonObjectForTotal
    }]

    if (totalRows > 0) {
        rows = await OptInReport.find(query)
            .skip(offset).limit(limit).sort({ 'website_url': 'asc' })
    }


    return res.send({
        rows: rows[0],
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

router.get('/get-all-opt-in-count', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {

    let rows = await OptInReport.find({ website_url: 'all' })
    const data = rows[0]
    const object = {
        opt_in_pending: data.opt_in_pending.total,
        opt_in_link_sent: data.opt_in_link_sent.total,
        opt_in: data.opt_in.total,
        declined: data.declined.total,
        bounced: data.bounced.total,
        bounced_declined: data.bounced_declined.total,
        total: data.total.total
    }
    return res.send({
        rows: [object]
    })
})

module.exports = router
