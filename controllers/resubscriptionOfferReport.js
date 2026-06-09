const express = require('express')
const router = express.Router()
const ResubscriptionOfferReport = require('../models/ResubscriptionOfferReports')
const { SUPER_ADMIN, protectRouteWithRole, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const moment = require('moment')
const _ = require('lodash')
const { API_STATIC_AUTH_TOKEN } = require('./../constants')
const { errorResponse, successResponse } = require('../utils')

router.post('/save-resubscription-report', async (req, res) => {
    try {
        const token = req.body.token
        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponse(res, 'error', 'Invalid Request', 500)
        }

        const requestBody = req.body
        const resubscriptionOfferData = {
            domain: requestBody.domain,
            user_id: requestBody.user_id,
            email: requestBody.email,
            name: requestBody.name,
            registration_date: requestBody.registration_date,
            subscription_date: requestBody.subscription_date,
            subscription_payment_gateway: requestBody.subscription_payment_gateway,
            subscription_detail: requestBody.subscription_detail,
            resubscription_offer_detail: requestBody.resubscription_offer_detail,
            total_amount_spent: requestBody.total_amount_spent,
            total_amount_spent_since_last_subscription: requestBody.total_amount_spent_since_last_subscription
        }

        const resubscriptionOffer = new ResubscriptionOfferReport(resubscriptionOfferData)
        await resubscriptionOffer.save()

        return successResponse(res, {}, 'Resubscription Report Saved', 200)
    } catch (error) {
        console.log(error)
        return errorResponse(res, 'error', 'Error in report save', 500)
    }
})

router.post('/get-resubscription-report', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const filter = req.body.filter
        const currentPage = parseInt(req.body.page, 10)
        const query = {}
        const domain = _.get(filter, 'domain', '')
        const startDate = _.get(filter, 'start_date', '')
        const endDate = _.get(filter, 'end_date', '')
        const email = _.get(filter, 'email', '')
        const user_id = _.get(filter, 'user_id', '')
        const offer_id = _.get(filter, 'offer_id', '')

        if (domain !== '') {
            query.domain = domain
        }

        if (email !== '') {
            query.email = email
        }

        if (user_id !== '') {
            query.user_id = user_id
        }

        if (offer_id !== '') {
            query['resubscription_offer_detail.id'] = offer_id
        }

        if (!_.isEmpty(startDate) && !_.isEmpty(endDate)) {
            let targetStartDate = moment(startDate).format('YYYY-MM-DDT00:00:00')
            let targetEndDate = moment(endDate).format('YYYY-MM-DDT23:59:59')
            query.createdAt = {
                $gte: targetStartDate,
                $lte: targetEndDate
            }
        }
        const totalRows = await ResubscriptionOfferReport.countDocuments(query)

        const limit = 20
        const totalPages = Math.ceil(totalRows / limit)
        const offset = (currentPage - 1) * limit

        let rows = []
        if (totalRows > 0) {
            rows = await ResubscriptionOfferReport.find(query).skip(offset).limit(limit).sort({ 'createdAt': 'desc' })
        }

        const response = {
            rows: rows,
            totalPages: totalPages,
            currentPage: currentPage,
            totalRows: totalRows,
            limit: limit
        }
        return successResponse(res, response, 'Resubscription Report', 200)
    } catch (error) {
        console.log(error)
        return errorResponse(res, 'error', 'Error in report get', 500)
    }
})

module.exports = router
