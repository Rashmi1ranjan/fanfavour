const express = require('express')
const router = express.Router()
const SuspiciousUser = require('../models/SuspiciousUsers')
const Joi = require('joi')
const moment = require('moment')
const _ = require('lodash')
const { successResponse, catchResponse } = require('../utils/index')
const { SUPER_ADMIN, protectRouteWithRole } = require('../middleware/auth.middleware')
const mongoose = require('mongoose')

const suspiciousUserSchema = Joi.object({
    count: Joi.number().required(),
    user_id: Joi.string().required(),
    email: Joi.string().required(),
    tip_amount: Joi.number().required(),
    name: Joi.string().required(),
    website_url: Joi.string().required(),
    notes: Joi.string(),
    type: Joi.string(),
    total_card: Joi.number(),
    total_tip: Joi.number(),
    modelMessageCount: Joi.number(),
    userMessageCount: Joi.number(),
    totalModelMessageCount: Joi.number(),
    totalUserMessageCount: Joi.number()

})

router.post('/', async (req, res) => {
    try {
        await suspiciousUserSchema.validateAsync(req.body)
    } catch (error) {
        return catchResponse(res, {}, error.message, 400)
    }
    const requestBody = req.body
    const data = {
        count: requestBody.count,
        user_id: requestBody.user_id,
        email: requestBody.email,
        tip_amount: requestBody.tip_amount,
        name: requestBody.name,
        website_url: requestBody.website_url,
        type: requestBody.type,
        fraudDetectionDate: Date.now(),
        model_message_count: requestBody.modelMessageCount,
        user_message_count: requestBody.userMessageCount,
        total_model_message_count: requestBody.totalModelMessageCount,
        total_user_message_count: requestBody.totalUserMessageCount
    }
    const cardUser = await SuspiciousUser.findOne({ user_id: data.user_id, type: 'card' })
    const currentDate = moment().format('DD-MM-YYYY HH:mm:ss')
    try {
        if (data.type == 'card') {
            const cardNote = `${currentDate} : Total ${req.body.total_card} cards added till date`
            if (cardUser && cardUser.type == 'card') {
                if (data.count == 4) {
                    await SuspiciousUser.findOneAndUpdate({ user_id: data.user_id, type: 'card' }, { $set: { count: data.count, fraudDetectionDate: Date.now() }, $push: { notes: { $each: [req.body.notes, cardNote] } } })
                } else {
                    await SuspiciousUser.findOneAndUpdate({ user_id: data.user_id, type: 'card' }, { $set: { count: data.count, fraudDetectionDate: Date.now() } })
                }
            } else {
                data.notes = [
                    req.body.notes,
                    cardNote
                ]
                const suspiciousUserData = new SuspiciousUser(data)
                await suspiciousUserData.save()
            }
        }

        const tipUser = await SuspiciousUser.findOne({ user_id: data.user_id, type: 'tip' })
        if (data.type == 'tip') {
            const requestData = {
                $set: {
                    tip_amount: data.tip_amount,
                    count: data.count,
                    fraudDetectionDate: Date.now(),
                    model_message_count: data.model_message_count,
                    user_message_count: data.user_message_count,
                    total_model_message_count: data.total_model_message_count,
                    total_user_message_count: data.total_user_message_count
                }
            }
            const tipNote = `${currentDate} : Total ${req.body.total_tip} Tips given till date`
            {
                if (tipUser && tipUser.type == 'tip') {
                    if (data.count == 4) {
                        await SuspiciousUser.findOneAndUpdate({ user_id: data.user_id, type: 'tip' }, { ...requestData, $push: { notes: { $each: [req.body.notes, tipNote] } } })
                    } else {
                        await SuspiciousUser.findOneAndUpdate({ user_id: data.user_id, type: 'tip' }, requestData)
                    }
                } else {
                    data.notes = [
                        req.body.notes,
                        tipNote
                    ]
                    const suspiciousUsersData = new SuspiciousUser(data)
                    await suspiciousUsersData.save()
                }
            }
        }
        return successResponse(res, {}, 'Suspicious User saved.', 200)
    } catch (error) {
        return catchResponse(res, {}, error.message, 400)
    }
})

router.post('/getSuspiciousUser', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    const filter = req.body.filter
    const query = {}
    const currentPage = parseInt(req.query.page_num, 10)

    const domain = _.get(filter, 'domain', '')
    if (domain !== '') {
        query.website_url = domain.trim()
    }
    const user_id = _.get(filter, 'user_id', '')
    let isValid = true

    if (user_id.trim() !== '') {
        isValid = mongoose.Types.ObjectId.isValid(user_id.trim())
        if (isValid == true) {
            query.user_id = new mongoose.Types.ObjectId(user_id.trim())
        }
    }
    const totalRows = await SuspiciousUser.countDocuments(query)
    const limit = 20
    const totalPages = Math.ceil(totalRows / limit)
    const offset = (currentPage - 1) * limit

    let totalRecord = []
    if (totalRows > 0) {
        totalRecord = await SuspiciousUser.find(query).skip(offset).limit(limit).sort({ 'fraudDetectionDate': -1 })
    }
    return res.send({
        totalRecord: totalRecord,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit,
        isValid: isValid
    })
})

module.exports = router

