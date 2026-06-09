const express = require('express')
const router = express.Router()
const PromotionReport = require('../models/PromotionReport')
const { SUPER_ADMIN, protectRouteWithRole } = require('./../middleware/auth.middleware')
const moment = require('moment')
const _ = require('lodash')

router.post('/get-promotion-report', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    let currentPage = parseInt(req.query.page_num, 10)
    const query = {}
    const domain = req.body.domain
    const subscriptionPromotionType = _.get(req, 'body.subscription_promotion_type', 'all')
    const contentPromotionType = _.get(req, 'body.content_promotion_type', 'all')
    const startDate = _.get(req, 'body.startDate', '')
    const endDate = _.get(req, 'body.endDate', '')

    if (subscriptionPromotionType !== 'all') {
        query.promotion_type = subscriptionPromotionType
    }

    if (contentPromotionType !== 'all') {
        if (contentPromotionType === 'MASS') {
            query.applicable_to = 'MASS_MESSAGE'
        } else if (contentPromotionType === 'FEED') {
            query.applicable_to = 'EXCLUSIVE_CONTENT'
        } else if (contentPromotionType === 'NEW_USERS') {
            query.applicable_to = 'NEW_USERS'
        } else if (contentPromotionType === 'OLD_USERS') {
            query.applicable_to = 'OLD_USERS'
        }
    }

    if (domain !== '') {
        query.website_url = domain
    }

    if (!_.isEmpty(startDate) && !_.isEmpty(endDate)) {
        let targetStartDate = moment(startDate).format('YYYY-MM-DDT00:00:00')
        let targetEndDate = moment(endDate).format('YYYY-MM-DDT23:59:59')
        query.start_date = {
            $gte: targetStartDate,
            $lte: targetEndDate
        }
    }

    const totalRows = await PromotionReport.countDocuments(query)
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await PromotionReport.find(query)
            .skip(offset).limit(limit).sort({ 'website_url': 'asc' })
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
