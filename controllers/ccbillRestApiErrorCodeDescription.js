const express = require('express')
const router = express.Router()
const _ = require('lodash')
const CCBillRestApiErrorCodeDescription = require('../models/CCBillRestApiErrorCodeDescription')
const { protectRouteWithRole, SUPER_ADMIN } = require('./../middleware/auth.middleware')
const Joi = require('joi')

const restApiErrorCodeSchema = Joi.object({
    ccbill_error_code: Joi.string().required(),
    description: Joi.string().required(),
    error_message: Joi.string().required()
})

router.post('/add-error-code', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        await restApiErrorCodeSchema.validateAsync(req.body)
    } catch (error) {
        console.log('from error', error.message)
        return res.send({ status: false, message: error.message })
    }

    try {
        const data = req.body
        const checkErrorCode = await CCBillRestApiErrorCodeDescription.findOne({ ccbill_error_code: data.ccbill_error_code })
        if (checkErrorCode !== null) {
            return res.send({ status: false, message: 'You can not add duplicate record' })
        }

        const ccbillErrorLogDescriptionData = new CCBillRestApiErrorCodeDescription(data)
        await ccbillErrorLogDescriptionData.save()

        return res.send({ status: true })
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }
})

router.post('/edit-error-code', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        await restApiErrorCodeSchema.validateAsync(req.body)
    } catch (error) {
        console.log('from error', error.message)
        return res.send({ status: false, message: error.message })
    }

    try {
        const data = req.body
        const _id = _.get(data, '_id', false)
        const ccbill_error_code = _.get(data, 'ccbill_error_code', false)
        const description = _.get(data, 'description', false)
        const error_message = _.get(data, 'error_message', '')

        const checkErrorCode = await CCBillRestApiErrorCodeDescription.findOne({ ccbill_error_code: ccbill_error_code })
        if (checkErrorCode !== null && checkErrorCode._id.toString() !== _id) {
            return res.send({ status: false, message: 'You can not add duplicate record' })
        }

        const newValues = {
            $set: {
                ccbill_error_code: ccbill_error_code,
                description: description,
                error_message: error_message
            }
        }

        const query = { _id: _id }
        await CCBillRestApiErrorCodeDescription.updateOne(query, newValues)

        return res.send({ status: true })
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }
})

router.get('/get-error-code-list', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {

    const totalRows = await CCBillRestApiErrorCodeDescription.countDocuments({})
    const currentPage = parseInt(req.query.page_num, 10)
    const limit = 20
    const totalPages = Math.ceil(totalRows / limit)

    const offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await CCBillRestApiErrorCodeDescription.find({}).skip(offset).limit(limit).sort({ 'created_at': 'desc' })
    }

    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

router.get('/get-error-code-by-id', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    const id = req.query._id

    const errorDetail = await CCBillRestApiErrorCodeDescription.findById(id)

    return res.send({
        rows: errorDetail
    })
})

router.get('/get-all-error-code-option', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {

    const rows = await CCBillRestApiErrorCodeDescription.find({}, 'ccbill_error_code description').sort({ 'ccbill_error_code': 1 })
    return res.send({
        rows: rows
    })
})

module.exports = router
