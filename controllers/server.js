const express = require('express')
const router = express.Router()
const _ = require('lodash')
const Server = require('../models/Server')
const mongoose = require('mongoose')
const { protectAdminRoute } = require('./../middleware/auth.middleware')

router.post('/add_server', protectAdminRoute, async (req, res) => {
    const data = req.body
    delete data._id
    const name = _.get(data, 'name', false)
    const ip_address = _.get(data, 'ip_address', false)

    if (!name || name === '' ||
        !ip_address || ip_address === ''
    ) {
        return res.send({ status: false, message: 'Format error' })
    }

    const condition = {
        $or: [
            { name: name },
            { ip_address: ip_address }
        ]
    }

    let rows = await Server.find(condition)

    if (rows.length > 0) {
        return res.send({ status: false, message: 'You can not add duplicate record' })
    }
    data['created_at'] = new Date()
    let serverData = new Server(data)

    await serverData.save()
    return res.send({ status: true })
})

router.post('/edit_server', protectAdminRoute, async (req, res) => {

    const data = req.body
    const name = _.get(data, 'name', false)
    const ip_address = _.get(data, 'ip_address', false)
    const _id = _.get(data, '_id', false)

    if (!name || name === '' ||
        !ip_address || ip_address === '' ||
        !_id
    ) {
        return res.send({ status: false, message: 'Format error' })
    }

    const newValues = {
        $set: {
            name: name,
            ip_address: ip_address
        }
    }

    const query = { _id: _id }

    try {
        await Server.updateOne(query, newValues)

        return res.send({ status: true })
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }
})

router.get('/get_server_list', protectAdminRoute, async (req, res) => {

    const rows = await Server.find({}).sort({ 'monthly_earning': 'desc' })
    return res.send({
        rows: rows
    })
})

router.get('/get_server_lists', protectAdminRoute, async (req, res) => {

    let rows = await Server.find({}).sort({ 'monthly_earning': 'desc' })
    return res.send({
        rows: rows
    })
})

router.get('/get_all_server_options', protectAdminRoute, async (req, res) => {

    let rows = await Server.find({}, 'name monthly_earning').sort({ 'monthly_earning': 'desc' })
    return res.send({
        rows: rows
    })
})

router.get('/get_server_data_by_id', protectAdminRoute, async (req, res) => {
    let id = new mongoose.Types.ObjectId(req.query._id)

    let data = await Server.find({ _id: id })

    return res.send({
        rows: data
    })
})

module.exports = router
