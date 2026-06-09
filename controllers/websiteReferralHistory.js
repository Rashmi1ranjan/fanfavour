const express = require('express')
const router = express.Router()
const _ = require('lodash')
const WebsiteReferralHistory = require('../models/WebsiteReferralHistory')
const Website = require('./../models/Website')
const { protectAdminRoute } = require('./../middleware/auth.middleware')
const mongoose = require('mongoose')
const moment = require('moment')

router.post('/add_website_referral', protectAdminRoute, async (req, res) => {
    const data = req.body
    delete data._id
    const domain = _.get(data, 'domain', false)
    const target_date = _.get(data, 'target_date', moment().startOf('day').toISOString())
    const referral_type = _.get(data, 'referral_type', false)
    const referral_type1 = _.get(data, 'referral_type1', false)
    const referral_type2 = _.get(data, 'referral_type2', false)

    const referral_name = _.get(data, 'referral_name', false)
    const referral_name1 = _.get(data, 'referral_name1', false)
    const referral_name2 = _.get(data, 'referral_name2', false)

    const referral_commission = _.get(data, 'referral_commission', false)
    const referral_commission1 = _.get(data, 'referral_commission1', false)
    const referral_commission2 = _.get(data, 'referral_commission2', false)

    const referral_id = _.get(data, 'referral_id', false)
    const referral_id1 = _.get(data, 'referral_id1', false)
    const referral_id2 = _.get(data, 'referral_id2', false)

    const total_referral = _.get(data, 'total_referral', 0)
    if (total_referral === 0) {
        return res.send({ status: false, message: 'Please Add At least one referral' })
    }

    if ((total_referral === 1 && _.isEmpty(referral_name)) || (total_referral === 2 && _.isEmpty(referral_name1)) || (total_referral === 3 && _.isEmpty(referral_name2))) {
        return res.send({ status: false, message: 'Please select referral' })
    }

    if ((total_referral === 1 && _.isEmpty(referral_commission)) || (total_referral === 2 && _.isEmpty(referral_commission1)) || (total_referral === 3 && _.isEmpty(referral_commission2))) {
        return res.send({ status: false, message: 'Please add referral commission' })
    }

    if (domain !== 'all' && referral_type !== 'link-tracking') {
        let rows = await Website.find({ website_url: domain })
        if (rows.length === 0) {
            return res.send({ status: false, message: 'Data not found' })
        }
    }
    const condition = {
        domain: domain
    }
    condition.target_date = { $gte: target_date }

    let row = await WebsiteReferralHistory.find(condition)

    if (row.length > 0) {
        return res.send({ status: false, message: 'Please select different date' })
    }

    const filter = {
        domain: domain,
        referral_type: 'link-tracking'
    }

    if (domain === 'all') {
        filter.referral_name = referral_name
    }

    let rowWebsite = await WebsiteReferralHistory.find(filter)
    let errorMessage = 'This domain is already in use. Please choose a different domain.'
    if (rowWebsite.length > 0) {
        return res.send({ status: false, message: errorMessage })
    }

    const query = {
        domain: domain
    }

    if (domain === 'all') {
        query.referral_name = referral_name
    }
    let rowsData = await WebsiteReferralHistory.find(query)
    if (rowsData.length > 0 && referral_type === 'link-tracking') {
        return res.send({ status: false, message: errorMessage })
    }

    // const referralData = await WebsiteReferralHistory.find({ referral_type: 'link-tracking', referral_name: referral_name })

    // if (referralData.length > 0) {
    //     return res.send({ status: false, message: 'Link already used.' })
    // }

    const newData = {
        domain: domain,
        referral_type: referral_type,
        referral_name: referral_name,
        referral_commission: referral_commission,
        target_date: target_date,
        total_referral: total_referral,
        created_at: new Date()
    }

    if (['domain', 'normal'].includes(referral_type)) {
        newData.referral_type1 = referral_type1
        newData.referral_type2 = referral_type2
        newData.referral_name1 = referral_name1
        newData.referral_name2 = referral_name2
        newData.referral_commission1 = referral_commission1
        newData.referral_commission2 = referral_commission2
    }

    if ((referral_id !== false && referral_id !== '')) {
        newData.referral_id = new mongoose.Types.ObjectId(referral_id)
    }
    if (referral_id1 !== false && referral_id1 !== '') {
        newData.referral_id1 = new mongoose.Types.ObjectId(referral_id1)
    }
    if (referral_id2 !== false && referral_id2 !== '') {
        newData.referral_id2 = new mongoose.Types.ObjectId(referral_id2)
    }

    let websiteReferralHistoryData = new WebsiteReferralHistory(newData)
    await websiteReferralHistoryData.save()
    return res.send({ status: true })
})

router.post('/edit_website_referral', protectAdminRoute, async (req, res) => {
    const data = req.body
    const _id = _.get(data, '_id', false)
    const referral_type = _.get(data, 'referral_type', false)
    const referral_type1 = _.get(data, 'referral_type1', false)
    const referral_type2 = _.get(data, 'referral_type2', false)

    const referral_name = _.get(data, 'referral_name', false)
    const referral_name1 = _.get(data, 'referral_name1', false)
    const referral_name2 = _.get(data, 'referral_name2', false)

    const referral_commission = _.get(data, 'referral_commission', false)
    const referral_commission1 = _.get(data, 'referral_commission1', false)
    const referral_commission2 = _.get(data, 'referral_commission2', false)

    const referral_id = _.get(data, 'referral_id', false)
    const referral_id1 = _.get(data, 'referral_id1', false)
    const referral_id2 = _.get(data, 'referral_id2', false)

    const total_referral = _.get(data, 'total_referral', false)

    if ((total_referral === 1 && _.isEmpty(referral_name)) || (total_referral === 2 && _.isEmpty(referral_name1)) || (total_referral === 3 && _.isEmpty(referral_name2))) {
        return res.send({ status: false, message: 'Please select referral' })
    }

    if ((total_referral === 1 && _.isEmpty(referral_commission)) || (total_referral === 2 && _.isEmpty(referral_commission1)) || (total_referral === 3 && _.isEmpty(referral_commission2))) {
        return res.send({ status: false, message: 'Please add referral commission' })
    }
    const target_date = _.get(data, 'target_date', false)

    const newValues = {
        referral_type: referral_type,
        referral_name: referral_name,
        referral_commission: referral_commission,
        total_referral: total_referral,
        target_date: target_date
    }

    if (['domain', 'normal'].includes(referral_type)) {
        newValues.referral_type1 = referral_type1
        newValues.referral_type2 = referral_type2
        newValues.referral_name1 = referral_name1
        newValues.referral_name2 = referral_name2
        newValues.referral_commission1 = referral_commission1
        newValues.referral_commission2 = referral_commission2
    }

    if ((referral_id !== false && referral_id !== '')) {
        newValues.referral_id = new mongoose.Types.ObjectId(referral_id)
    }
    if (referral_id1 !== false && referral_id1 !== '') {
        newValues.referral_id1 = new mongoose.Types.ObjectId(referral_id1)
    }
    if (referral_id2 !== false && referral_id2 !== '') {
        newValues.referral_id2 = new mongoose.Types.ObjectId(referral_id2)
    }
    const query = { _id: _id }
    try {
        await WebsiteReferralHistory.updateOne(query, { $set: newValues })

        return res.send({ status: true })
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }
})

router.post('/get_website_referral_history_list', protectAdminRoute, async (req, res) => {
    const domain = _.get(req, 'body.domain', 'all')

    let currentPage = parseInt(req.query.page_num, 10)

    let query = {}
    if (domain !== 'all') {
        query.domain = domain
    }
    const totalRows = await WebsiteReferralHistory.countDocuments(query)
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    let pipeline = [
        { $match: query },
        {
            $sort: { target_date: -1 }
        },
        { $skip: offset },
        { $limit: limit }
    ]
    if (domain !== 'all') {
        pipeline.push(
            {
                '$lookup': {
                    'from': 'websites',
                    'localField': 'domain',
                    'foreignField': 'website_url',
                    'as': 'website'
                }
            },
            {
                $unwind: '$website'
            },
            {
                $project: {
                    domain: 1,
                    referral_type: 1,
                    referral_name: 1,
                    referral_commission: 1,
                    referral_type1: 1,
                    referral_name1: 1,
                    referral_commission1: 1,
                    referral_type2: 1,
                    referral_name2: 1,
                    referral_commission2: 1,
                    total_referral: 1,
                    target_date: 1,
                    created_at: 1,
                    'website.website_id': 1
                }
            }
        )
    } else {
        pipeline.push(
            {
                $project: {
                    domain: 1,
                    referral_type: 1,
                    referral_name: 1,
                    referral_commission: 1,
                    referral_type1: 1,
                    referral_name1: 1,
                    referral_commission1: 1,
                    referral_type2: 1,
                    referral_name2: 1,
                    referral_commission2: 1,
                    total_referral: 1,
                    target_date: 1,
                    created_at: 1
                }
            }
        )
    }

    if (totalRows > 0) {
        rows = await WebsiteReferralHistory.aggregate(pipeline)
    }

    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

router.post('/get_website_referral_history_by_domain', protectAdminRoute, async (req, res) => {
    const domain = _.get(req, 'body.domain', '')
    const fields = 'domain referral_type referral_name referral_commission referral_type1 referral_name1 referral_commission1 referral_type2 referral_name2 referral_commission2 total_referral target_date created_at referral_id referral_id1 referral_id2'
    let rows = await WebsiteReferralHistory.find({ domain: domain }, fields).sort({ target_date: -1 })

    return res.send({
        rows: rows
    })
})

router.get('/get_website_referral_data_by_id', protectAdminRoute, async (req, res) => {
    let id = new mongoose.Types.ObjectId(req.query._id)
    let data = await WebsiteReferralHistory.findById(id)

    return res.send({
        rows: data
    })
})

module.exports = router
