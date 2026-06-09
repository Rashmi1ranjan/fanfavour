const express = require('express')
const router = express.Router()
const _ = require('lodash')
const moment = require('moment')
const ContactUs = require('../models/ContactUs')
const { successResponse, errorResponse } = require('../utils/index')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')

router.post('/', async (req, res) => {
    const body = req.body
    const data = {
        name: body.name,
        email: body.email,
        subject: body.subject,
        body: body.body,
        domain: body.domain,
        created_at: new Date(),
        updated_at: new Date()
    }

    let contactUs = new ContactUs(data)
    await contactUs.save()
    return successResponse(res, {}, 'Email saved', 200)
})

router.post('/get_emails', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const limit = 20
        const filter = req.body.filter
        const currentPage = parseInt(req.body.page, 10)
        const start_date = _.get(filter, 'start_date', '')
        const end_date = _.get(filter, 'end_date', '')
        const is_processed = _.get(filter, 'is_processed', 'false')
        const domain = _.get(filter, 'domain', '')
        const email = _.get(filter, 'email', '')
        const aggregate = []

        const query = {
            is_processed: is_processed === 'false' ? { $ne: true } : true
        }

        if (start_date !== '' && end_date !== '') {
            const dateStart = moment(start_date, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00')
            const dateEnd = moment(end_date, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59')
            query.created_at = {
                $gte: new Date(dateStart),
                $lte: new Date(dateEnd)
            }
        }

        if (domain !== '') {
            query.domain = domain
        }

        if (email !== '') {
            query.email = email
        }

        aggregate.push({ $match: query })
        aggregate.push({ $sort: { created_at: -1 } })
        const offset = (currentPage - 1) * limit
        aggregate.push({
            $facet: {
                results: [{ $skip: offset }, { $limit: limit }],
                total: [{ $count: 'count' }]
            }
        })

        const contactUsEmail = await ContactUs.aggregate(aggregate)
        let rows = []
        let totalRows = 0
        let totalPages = 0
        if (contactUsEmail[0].results.length > 0) {
            rows = contactUsEmail[0].results
            totalRows = contactUsEmail[0].total[0].count
            totalPages = Math.ceil(totalRows / limit)
        }

        const response = {
            rows: rows,
            totalPages: totalPages,
            currentPage: currentPage,
            totalRows: totalRows,
            limit: limit
        }
        return successResponse(res, response, 'Contact Us Emails', 200)
    } catch (error) {
        console.log(error)
        return errorResponse(res, {}, 'Error in Contact Us Emails', 400)
    }
})

router.post('/mark_all_as_processed', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const filter = req.body.filter
        const start_date = _.get(filter, 'start_date', '')
        const end_date = _.get(filter, 'end_date', '')
        const domain = _.get(filter, 'domain', '')
        const email = _.get(filter, 'email', '')
        const currentUser = _.get(req, 'body.currentUser', 'Admin')

        if (start_date === '' && end_date === '' && domain === 'all' && email === '') {
            return errorResponse(res, {}, 'Please enter valid data', 400)
        }
        const query = {
            is_processed: { $ne: true }
        }

        if (start_date !== '' && end_date !== '') {
            const dateStart = moment(start_date, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00')
            const dateEnd = moment(end_date, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59')
            query.created_at = {
                $gte: new Date(dateStart),
                $lte: new Date(dateEnd)
            }
        }
        if (domain !== '') {
            query.domain = domain
        }
        if (email !== '') {
            query.email = email
        }
        const contactUs = await ContactUs.updateMany(query, { is_processed: true, processed_by: currentUser, updated_at: new Date() })
        if (contactUs.modifiedCount > 0) {
            return successResponse(res, { status: true }, 'Mail updated successfully.', 200)
        }
        return errorResponse(res, {}, 'Something went wrong', 400)
    } catch (error) {
        return errorResponse(res, {}, 'Error in processed mail', 400)
    }
})

router.post('/mark_as_processed', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const log_id = req.body.log_id
        const currentUser = req.body.currentUser

        const query = {
            is_processed: { $ne: true },
            _id: log_id
        }
        const contactUs = await ContactUs.updateMany(query, { is_processed: true, processed_by: currentUser, updated_at: new Date() })
        if (contactUs.modifiedCount > 0) {
            return successResponse(res, { status: true }, 'Mail updated successfully.', 200)
        }
        return errorResponse(res, {}, 'Something went wrong', 400)
    } catch (error) {
        return errorResponse(res, {}, 'Error in processed mail', 400)
    }
})

module.exports = router
