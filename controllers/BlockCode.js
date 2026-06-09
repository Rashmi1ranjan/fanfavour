const express = require('express')
const router = express.Router()
const _ = require('lodash')
const BlockCodes = require('../models/BlockCodes')
const mongoose = require('mongoose')
const { protectAdminRoute, protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')

router.post('/block_code', protectAdminRoute, async (req, res) => {
    const data = req.body
    delete data._id

    let row = await BlockCodes.findOne({ code: data.code })
    if (row !== null) {
        return res.send({ status: false, message: 'You can not add duplicate record' })
    }
    let ccbillErrorLogDescriptionData = new BlockCodes(data)

    await ccbillErrorLogDescriptionData.save()
    return res.send({ status: true })
})

router.put('/block_code', protectAdminRoute, async (req, res) => {

    const data = req.body
    const _id = _.get(data, '_id', false)
    const code = _.get(data, 'code', false)
    const message = _.get(data, 'message', '')

    let row = await BlockCodes.findOne({ code: code })

    if (row !== null && row._id.toString() !== _id) {
        return res.send({ status: false, message: 'You can not add duplicate record' })
    }

    const newValues = {
        $set: {
            code: code,
            message: message,
            updated_at: new Date()
        }
    }

    const query = { _id: _id }

    try {
        await BlockCodes.updateOne(query, newValues)

        return res.send({ status: true })
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }
})

router.get('/block_code', protectAdminRoute, async (req, res) => {

    const totalRows = await BlockCodes.countDocuments({})
    let currentPage = parseInt(req.query.page_num, 10)
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await BlockCodes.find({}).skip(offset).limit(limit).sort({ 'created_at': 'desc' })
    }
    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

router.get('/block_code_by_id', protectAdminRoute, async (req, res) => {
    let id = new mongoose.Types.ObjectId(req.query._id)

    let data = await BlockCodes.find({ _id: id })

    return res.send({
        rows: data
    })
})

router.get('/block_code/all', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    let rows = await BlockCodes.find({}, '_id message')
    return res.send({
        rows: rows
    })
})

module.exports = router
