const express = require('express')
const router = express.Router()
const _ = require('lodash')
const Database = require('../models/Database')
const mongoose = require('mongoose')
const { protectAdminRoute } = require('./../middleware/auth.middleware')

router.post('/add_database', protectAdminRoute, async (req, res) => {
    const data = req.body
    delete data._id
    const name = _.get(data, 'name', false)

    if (!name || name === '') {
        return res.send({ status: false, message: 'Format error' })
    }

    const condition = {
        name: name
    }

    let rows = await Database.find(condition)

    if (rows.length > 0) {
        return res.send({ status: false, message: 'You can not add duplicate record' })
    }
    data['created_at'] = new Date()
    let databaseData = new Database(data)

    await databaseData.save()
    return res.send({ status: true })
})

router.post('/edit_database', protectAdminRoute, async (req, res) => {

    const data = req.body
    const name = _.get(data, 'name', false)
    const _id = _.get(data, '_id', false)

    if (!name || name === '' || !_id) {
        return res.send({ status: false, message: 'Format error' })
    }

    const newValues = {
        $set: {
            name: name
        }
    }
    const query = { _id: _id }

    try {
        await Database.updateOne(query, newValues)

        return res.send({ status: true })
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }
})

router.get('/get_database_list', protectAdminRoute, async (req, res) => {

    const totalRows = await Database.countDocuments({})
    let currentPage = parseInt(req.query.page_num, 10)
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await Database.find({}).skip(offset).limit(limit).sort({ 'monthly_earning': 'desc' })
    }

    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

router.get('/get_database_data_by_id', protectAdminRoute, async (req, res) => {
    let id = new mongoose.Types.ObjectId(req.query._id)

    let data = await Database.find({ _id: id })

    return res.send({
        rows: data
    })
})

router.get('/get_database_lists', protectAdminRoute, async (req, res) => {

    let rows = await Database.find({}).sort({ 'monthly_earning': 'desc' })

    return res.send({
        rows: rows
    })
})

router.get('/get_all_database_options', protectAdminRoute, async (req, res) => {

    let rows = await Database.find({}, 'name monthly_earning').sort({ 'monthly_earning': 'desc' })
    return res.send({
        rows: rows
    })
})

module.exports = router
