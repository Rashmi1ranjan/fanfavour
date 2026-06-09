const express = require('express')
const router = express.Router()
const _ = require('lodash')
const CCBillErrorCodeDescription = require('../models/CCBillErrorCodeDescription')
const mongoose = require('mongoose')
const { protectAdminRoute, protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')

router.post('/add_ccbill_error_code_description', protectAdminRoute, async (req, res) => {
    const data = req.body
    delete data._id

    data['created_at'] = new Date()
    let row = await CCBillErrorCodeDescription.findOne({ ccbill_error_code: data.ccbill_error_code })
    if (row !== null) {
        return res.send({ status: false, message: 'You can not add duplicate record' })
    }
    let ccbillErrorLogDescriptionData = new CCBillErrorCodeDescription(data)

    await ccbillErrorLogDescriptionData.save()
    return res.send({ status: true })
})

router.post('/edit_ccbill_error_code_description', protectAdminRoute, async (req, res) => {

    const data = req.body
    const _id = _.get(data, '_id', false)
    const ccbill_error_code = _.get(data, 'ccbill_error_code', false)
    const description = _.get(data, 'description', false)
    const error_message = _.get(data, 'error_message', '')

    let row = await CCBillErrorCodeDescription.findOne({ ccbill_error_code: ccbill_error_code })

    if (row !== null && row._id.toString() !== _id) {
        return res.send({ status: false, message: 'You can not add duplicate record' })
    }

    const newValues = {
        $set: {
            ccbill_error_code: ccbill_error_code,
            description: description,
            error_message: error_message,
            updated_at: new Date()
        }
    }

    const query = { _id: _id }

    try {
        await CCBillErrorCodeDescription.updateOne(query, newValues)

        return res.send({ status: true })
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }
})

router.get('/get_ccbill_error_code_description_list', protectAdminRoute, async (req, res) => {

    const totalRows = await CCBillErrorCodeDescription.countDocuments({})
    let currentPage = parseInt(req.query.page_num, 10)
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await CCBillErrorCodeDescription.find({}).skip(offset).limit(limit).sort({ 'created_at': 'desc' })
    }

    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

router.get('/get_ccbill_error_code_description_by_id', protectAdminRoute, async (req, res) => {
    let id = new mongoose.Types.ObjectId(req.query._id)

    let data = await CCBillErrorCodeDescription.find({ _id: id })

    return res.send({
        rows: data
    })
})

router.get('/get_all_ccbill_error_code_description_options', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {

    let rows = await CCBillErrorCodeDescription.find({}, 'ccbill_error_code description').sort({ 'ccbill_error_code': 1 })
    return res.send({
        rows: rows
    })
})

module.exports = router
