const express = require('express')
const router = express.Router()
const _ = require('lodash')
const WebsiteReferral = require('../models/WebsiteReferral')
const mongoose = require('mongoose')
const { protectAdminRoute, protectRouteWithRole, ROLE_REFERRAL, SUPER_ADMIN } = require('./../middleware/auth.middleware')
const { errorResponse, successResponse } = require('../utils')
const User = require('./../models/User')
const WebsiteReferralHistory = require('../models/WebsiteReferralHistory')
const Website = require('../models/Website')
const LinkTrackingReferral = require('../models/LinkTrackingReferral')

router.post('/add-or-update', protectAdminRoute, async (req, res) => {

    const data = req.body
    const name = _.get(data, 'name', '')
    const id = _.get(data, '_id', '')

    if (name === '') {
        return errorResponse(res, 'error', 'Format error', 500)
    }

    let rows = await WebsiteReferral.find({
        name: name
    })

    if (rows.length > 0) {
        if (id === '' || (id.toString() !== rows[0]._id.toString())) {
            return errorResponse(res, 'error', 'You can not add duplicate record', 500)
        }
    }

    const newValues = {
        name: name
    }

    if (id === '') {
        newValues['created_at'] = new Date()
        let websiteReferralData = new WebsiteReferral(newValues)

        await websiteReferralData.save()
        return successResponse(res, { status: true }, 'Website Referral Added Successfully', 200)
    }

    const query = { _id: id }

    try {
        await WebsiteReferral.updateOne(query, { $set: newValues })

        return successResponse(res, { status: true }, 'Website Referral Updated Successfully', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
})

router.get('/get-list', protectAdminRoute, async (req, res) => {
    try {
        const totalRows = await WebsiteReferral.countDocuments({})
        let currentPage = parseInt(req.query.page_num, 10)
        let limit = 20
        let totalPages = Math.ceil(totalRows / limit)

        let offset = (currentPage - 1) * limit
        let rows = []

        if (totalRows > 0) {
            rows = await WebsiteReferral.find({}).skip(offset).limit(limit).sort({ 'created_at': 'desc' })
        }
        const data = {
            rows: rows,
            totalPages: totalPages,
            currentPage: currentPage,
            totalRows: totalRows,
            limit: limit
        }
        return successResponse(res, data, 'Website Referral Get Successfully', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
})

router.get('/get-all', protectAdminRoute, async (req, res) => {
    try {
        let rows = await WebsiteReferral.find({})
        return successResponse(res, { rows: rows }, 'Website Referral List Get Successfully', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
})

router.get('/get-by-id', protectAdminRoute, async (req, res) => {
    try {
        let id = new mongoose.Types.ObjectId(req.query._id)

        let data = await WebsiteReferral.find({ _id: id })

        return successResponse(res, data, 'Website Referral Get Successfully', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
})

router.post('/get-referral-websites', protectRouteWithRole([ROLE_REFERRAL, SUPER_ADMIN]), async (req, res) => {
    try {
        let referralName = ''
        if (req.decoded.role === 'SUPER_ADMIN') {
            const referral_name = _.get(req, 'body.referral_name', '')
            if (referral_name === '') {
                return errorResponse(res, 'error', 'Referral name is not found', 500)
            }
            referralName = referral_name
        } else {
            const userData = await User.findOne({ _id: req.decoded.id, role: 'REFERRAL' }, 'name')
            referralName = userData.name
        }

        let condition = {
            $or: [
                { referral_name: referralName.trim() },
                { referral_name1: referralName.trim() },
                { referral_name2: referralName.trim() }
            ]
        }

        let websiteStatuses = ['live', 'published']
        if (req.decoded.role === SUPER_ADMIN) {
            websiteStatuses = ['live', 'published', 'pending', 'removed']
        }

        const referralDomainList = await WebsiteReferralHistory.aggregate([
            {
                '$match': condition
            }, {
                '$lookup': {
                    'from': 'websites',
                    'localField': 'domain',
                    'foreignField': 'website_url',
                    'as': 'websites'
                }
            }, {
                '$unwind': {
                    'path': '$websites'
                }
            }, {
                '$match': {
                    'websites.status': { $in: websiteStatuses }
                }
            }, {
                '$project': {
                    'websites._id': 1,
                    'websites.website_url': 1
                }
            }
        ])
        let rows = []
        for (let element of referralDomainList) {
            const newData = {
                website_url: element.websites.website_url,
                _id: element.websites._id
            }
            let findRecord = _.findIndex(rows, function (n) {
                return (n.website_url === newData.website_url) ? n : false
            })
            if (findRecord === -1) {
                rows.push(newData)
            }
        }
        return successResponse(res, rows, 'Website Referral Get Successfully', 200)
    } catch (error) {
        console.log(error)
        return errorResponse(res, error, error.message, 500)
    }
})

router.get('/get-all-link-referral', protectAdminRoute, async (req, res) => {
    try {
        let rows = await LinkTrackingReferral.find({})
        return successResponse(res, { rows: rows }, 'Link Tracking Referral List Get Successfully', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
})

module.exports = router
