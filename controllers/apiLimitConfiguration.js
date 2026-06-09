const express = require('express')
const router = express.Router()
const { successResponse, catchResponse, errorResponse } = require('../utils/index')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const ApiLimitConfiguration = require('../models/ApiLimitConfiguration')
const Joi = require('joi')
const mongoose = require('mongoose')
const _ = require('lodash')
const ApiLimiter = require('../models/ApiLimiterLogs')
const ApiLimitAutoBlockUserLog = require('../models/ApiLimitAutoBlockUserLog')
const moment = require('moment')

const apiLimitSchema = Joi.object({
    api_end_point: Joi.string().required(),
    max_attempt: Joi.number().required(),
    duration: Joi.number().required()
})

const editApiLimitSchema = Joi.object({
    id: Joi.string().required(),
    api_end_point: Joi.string().required(),
    max_attempt: Joi.number().required(),
    duration: Joi.number().required()
})

router.post('/add-api-limit-configuration', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        await apiLimitSchema.validateAsync(req.body)
    } catch (error) {
        return catchResponse(res, {}, error.message, 200)
    }
    try {
        const { api_end_point, max_attempt, duration } = req.body
        const checkConfigurationForSameEndPoint = await ApiLimitConfiguration.findOne({ api_end_point })
        if (checkConfigurationForSameEndPoint !== null) {
            return errorResponse(res, {}, 'API Configuration already exist on same API end Point', 200)
        }
        const apiConfiguration = new ApiLimitConfiguration({ api_end_point, max_attempt, duration })
        await apiConfiguration.save()

        return successResponse(res, {}, 'API Limit Configuration saved.', 200)
    } catch (error) {
        return catchResponse(res, {}, error.message, 200)
    }
})

router.post('/edit-api-limit-configuration', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        await editApiLimitSchema.validateAsync(req.body)
    } catch (error) {
        return catchResponse(res, {}, error.message, 200)
    }
    try {
        const { api_end_point, max_attempt, duration, id } = req.body
        const checkConfigurationForSameEndPoint = await ApiLimitConfiguration.findOne({ api_end_point, _id: { $ne: new mongoose.Types.ObjectId(id) } })
        if (checkConfigurationForSameEndPoint !== null) {
            return errorResponse(res, {}, 'API Configuration already exist on same API end Point', 200)
        }

        await ApiLimitConfiguration.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(id) }, { api_end_point, max_attempt, duration })

        return successResponse(res, {}, 'API Limit Configuration saved.', 200)
    } catch (error) {
        return catchResponse(res, {}, error.message, 200)
    }
})

router.post('/list-api-limit-configuration', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    const query = {}

    const api_end_point = _.get(req.body, 'api_end_point', '')
    if (api_end_point !== '') {
        query.api_end_point = api_end_point
    }

    const totalRows = await ApiLimitConfiguration.countDocuments(query)
    const currentPage = parseInt(req.query.page_num, 10)
    const limit = 20
    const totalPages = Math.ceil(totalRows / limit)
    const offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await ApiLimitConfiguration.find(query).skip(offset).limit(limit).sort({ createdAt: -1 })
    }

    const response = {
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    }
    return successResponse(res, response, 'API Configurations', 200)
})

router.post('/get-api-limit-configuration', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        const configuration_id = _.get(req.body, 'configuration_id', '')

        const configuration = await ApiLimitConfiguration.findById(configuration_id)
        if (configuration === null) {
            return errorResponse(res, {}, 'Configuration not found', 200)
        }
        const response = {
            api_configuration: configuration
        }
        return successResponse(res, response, 'API Configuration', 200)
    } catch (error) {
        return catchResponse(res, {}, error.message, 200)
    }
})

router.post('/check-user-api-limit', async (req, res) => {
    try {
        const { user_id, api_end_point } = req.body
        const response = { user_block_status: false }
        const configurationOfApiLimit = await ApiLimitConfiguration.findOne({ api_end_point })
        if (configurationOfApiLimit === null) {
            return successResponse(res, response, 'Configuration Not found for API', 200)
        }

        const max_attempt = configurationOfApiLimit.max_attempt
        const duration = configurationOfApiLimit.duration
        const start_date = moment().subtract(duration, 'minutes').format()

        const query = {
            created_at: { $gte: start_date },
            user_id: user_id
        }

        const userTransactionLogCount = await ApiLimiter.countDocuments(query)
        if (userTransactionLogCount >= max_attempt) {
            response.user_block_status = true
        }

        return successResponse(res, response, 'User Block Status', 200)
    } catch (error) {
        return catchResponse(res, { user_block_status: false }, error.message, 200)
    }
})

router.post('/save-auto-block-user', async (req, res) => {
    const body = req.body
    const domain = new URL(body.domain)
    const hostName = domain.hostname
    const autoBlockUserData = {
        api_end_point: body.api_end_point,
        user_id: body.user_id,
        domain: hostName,
        user_subscription_status: body.user_subscription_status,
        subscription_id: body.subscription_id,
        payment_gateway: body.payment_gateway,
        ip_address: body.ip_address
    }

    const autoBlockUser = new ApiLimitAutoBlockUserLog(autoBlockUserData)
    autoBlockUser.save()

    return successResponse(res, {}, 'Log for auto block user successfully saved', 200)
})

router.post('/auto-block-user-log', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const query = {}

    const start_date = _.get(req.body, 'start_date', '')
    const end_date = _.get(req.body, 'end_date', '')

    if (start_date !== '' && end_date !== '') {
        const dateStart = moment(start_date, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00')
        const dateEnd = moment(end_date, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59')
        query.createdAt = {
            $gte: new Date(dateStart),
            $lte: new Date(dateEnd)
        }
    }

    const api_end_point = _.get(req.body, 'api_end_point', '')
    if (api_end_point !== '') {
        query.api_end_point = api_end_point
    }

    const user_id = _.get(req.body, 'user_id', '')
    if (user_id !== '') {
        query.user_id = user_id
    }

    const domain = _.get(req.body, 'domain', '')
    if (domain !== '') {
        query.domain = domain
    }

    const subscription_id = _.get(req.body, 'subscription_id', '')
    if (subscription_id !== '') {
        query.subscription_id = subscription_id
    }

    const subscription_status = _.get(req.body, 'subscription_status', '')
    if (subscription_status !== '') {
        query.user_subscription_status = subscription_status
    }

    const payment_gateway = _.get(req.body, 'payment_gateway', '')
    if (payment_gateway !== '') {
        query.payment_gateway = payment_gateway
    }

    const ip_address = _.get(req.body, 'ip_address', '')
    if (ip_address !== '') {
        query.ip_address = ip_address
    }

    const is_processed = _.get(req.body, 'is_processed', 'false')
    if (is_processed !== '') {
        query.is_processed = is_processed === 'false' ? false : true
    }

    const totalRows = await ApiLimitAutoBlockUserLog.countDocuments(query)
    const currentPage = parseInt(req.query.page_num, 10)
    const limit = 20
    const totalPages = Math.ceil(totalRows / limit)
    const offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await ApiLimitAutoBlockUserLog.find(query).skip(offset).limit(limit).sort({ createdAt: -1 })
    }

    const response = {
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    }
    return successResponse(res, response, 'Auto Block User log', 200)
})

router.post('/mark-as-processed', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const data = req.body

    const updateLog = await ApiLimitAutoBlockUserLog.findByIdAndUpdate(data.log_id, { is_processed: true })

    if (updateLog === null) {
        return errorResponse(res, { status: false }, 'Error in update log', 200)
    }
    return successResponse(res, { status: true }, 'Log successfully mark as processed', 200)
})

module.exports = router
