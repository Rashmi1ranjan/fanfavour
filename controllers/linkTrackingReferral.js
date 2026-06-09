const express = require('express')
const router = express.Router()
const _ = require('lodash')
const LinkTrackingReferral = require('../models/LinkTrackingReferral')
const mongoose = require('mongoose')
const { protectAdminRoute, protectRouteWithRole, ROLE_REFERRAL, SUPER_ADMIN, protectWebsiteRoute, LINK_REFERRAL } = require('./../middleware/auth.middleware')
const { errorResponse, successResponse, errorResponseWithHTTPStatus } = require('../utils')
const User = require('./../models/User')
const WebsiteReferralHistory = require('../models/WebsiteReferralHistory')
const { HTTP_INTERNAL_SERVER_ERROR_500, HTTP_BAD_REQUEST_400 } = require('../utils/http.status')
const { hashPassword } = require('../utils/universalLogin')
const LinkTrackingAnalytics = require('../models/LinkTrackingAnalytics')
const { API_STATIC_AUTH_TOKEN } = require('../constants')

router.post('/add-or-update', protectAdminRoute, async (req, res) => {

    const data = req.body
    const name = _.get(data, 'name', '').trim().toLowerCase()
    const updatedName = name.replace(/\s+/g, '_')
    const id = _.get(data, '_id', '')

    if (updatedName === '') {
        return errorResponse(res, 'error', 'Referral name is required', HTTP_BAD_REQUEST_400)
    }

    let rows = await LinkTrackingReferral.find({
        name: updatedName
    })

    if (rows.length > 0) {
        if (id === '' || (id.toString() !== rows[0]._id.toString())) {
            return errorResponse(res, 'error', 'You can not add duplicate record', 500)
        }
    }

    const newValues = {
        name: updatedName
    }

    if (id === '') {
        newValues['created_at'] = new Date()
        let linkTrackingReferralData = new LinkTrackingReferral(newValues)

        await linkTrackingReferralData.save()
        return successResponse(res, { status: true }, 'Link Tracking Referral Added Successfully', 200)
    }

    const query = { _id: id }

    try {
        await LinkTrackingReferral.updateOne(query, { $set: newValues })
        return successResponse(res, { status: true }, 'Link Tracking Referral Updated Successfully', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
})

router.get('/get-list', protectAdminRoute, async (req, res) => {
    try {
        const totalRows = await LinkTrackingReferral.countDocuments({})
        let currentPage = parseInt(req.query.page_num, 10)
        let limit = 20
        let totalPages = Math.ceil(totalRows / limit)

        let offset = (currentPage - 1) * limit

        const response = await LinkTrackingReferral.find({}).skip(offset).limit(limit).sort({ created_at: -1 })

        const data = {
            rows: response,
            totalPages: totalPages,
            currentPage: currentPage,
            totalRows: totalRows,
            limit: limit
        }
        return successResponse(res, data, 'Link Tracking Referral Get Successfully', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
})

router.get('/get-all', protectAdminRoute, async (req, res) => {
    try {
        let rows = await LinkTrackingReferral.find({})
        return successResponse(res, { rows: rows }, 'Link Tracking Referral List Get Successfully', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
})

router.get('/get-by-id', protectAdminRoute, async (req, res) => {
    try {
        let id = new mongoose.Types.ObjectId(req.query._id)
        let data = await LinkTrackingReferral.findOne({ _id: id }).lean()

        return successResponse(res, data, 'Link Tracking Referral Get Successfully', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
})

router.post('/get-referral-websites', protectRouteWithRole([ROLE_REFERRAL, SUPER_ADMIN]), async (req, res) => {
    try {
        let referralName = ''
        if (req.decoded.role === 'SUPER_ADMIN') {
            const referral_name = _.get(req, 'body.referral_name', '').trim().toLowerCase()
            if (referral_name === '') {
                return errorResponse(res, 'error', 'Referral name is not found', 500)
            }
            referralName = referral_name
        } else {
            const userData = await User.findOne({ _id: req.decoded.id, role: 'REFERRAL' }, 'name')
            referralName = userData.name.toLowerCase()
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

router.post('/check-referral', protectWebsiteRoute, async (req, res) => {
    try {
        const referral = _.get(req, 'body.referral', '').trim().toLowerCase()
        if (_.isEmpty(referral)) return errorResponseWithHTTPStatus(res, {}, 'Invalid referral', HTTP_BAD_REQUEST_400)

        const referralExist = await LinkTrackingReferral.exists({
            name: { $regex: new RegExp(`^${referral}$`, 'i') }
        })

        return successResponse(res, referralExist, 'Website referral check successfully', 200)
    } catch (error) {
        return errorResponseWithHTTPStatus(res, error, 'Error in get user', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/get-referral-link-analytics', protectRouteWithRole([LINK_REFERRAL, SUPER_ADMIN]), async (req, res) => {
    try {
        // const referral = _.get(req, 'body.referral', '').trim().toLowerCase()
        // if (_.isEmpty(referral)) return errorResponseWithHTTPStatus(res, {}, 'Invalid referral', HTTP_BAD_REQUEST_400)

        // const referralExist = await LinkTrackingReferral.exists({
        //     _id: { $in: referrals.referral_links }
        // })

        // if (!referralExist) return errorResponseWithHTTPStatus(res, {}, 'Referral not found', HTTP_BAD_REQUEST_400)

        let query = {}
        if (req.decoded.role === LINK_REFERRAL) {
            const referrals = await User.findById({ _id: req.decoded.id }, 'referral_links')
            query.referral_id = { $in: referrals.referral_links }
        }

        if (!_.isEmpty(req.body.start_date) && !_.isEmpty(req.body.end_date)) {
            query.date = { $gte: new Date(req.body.start_date), $lte: new Date(req.body.end_date) }
        }

        const totalRows = await LinkTrackingAnalytics.countDocuments(query)
        let currentPage = parseInt(req.body.currentPage, 10)
        let limit = 20
        let totalPages = Math.ceil(totalRows / limit)

        let offset = (currentPage - 1) * limit

        const analyticsData = await LinkTrackingAnalytics.find(query).populate('referral_id', 'name').sort({ date: -1 }).skip(offset).limit(limit)

        const resData = {
            rows: analyticsData,
            totalPages: totalPages,
            currentPage: currentPage,
            totalRows: totalRows,
            limit: limit
        }

        return successResponse(res, resData, 'Website referral check successfully', 200)
    } catch (error) {
        return errorResponseWithHTTPStatus(res, error, 'Error in get user', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.get('/get-user-data', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        const totalRows = await User.countDocuments({ role: LINK_REFERRAL, is_deleted: { $ne: true } })
        let currentPage = parseInt(req.query.page_num, 10)
        let limit = 20
        let totalPages = Math.ceil(totalRows / limit)

        let offset = (currentPage - 1) * limit
        let users = []

        if (totalRows > 0) {
            users = await User.find({ role: LINK_REFERRAL, is_deleted: { $ne: true } }, '_id name email referral_links').populate('referral_links').skip(offset).limit(limit)
        }

        const data = {
            rows: users,
            totalPages: totalPages,
            currentPage: currentPage,
            totalRows: totalRows,
            limit: limit
        }

        return successResponse(res, data, 'User list fetched successfully', 200)
    } catch (error) {
        return errorResponseWithHTTPStatus(res, error, 'Error in get user list', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.get('/get-user-by-id', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        const _id = _.get(req, 'query._id', '').trim()
        if (_.isEmpty(_id)) return errorResponseWithHTTPStatus(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)

        const user = await User.findOne({ _id: _id, is_deleted: { $ne: true }, role: LINK_REFERRAL }, '_id name email referral_links').populate('referral_links')
        if (_.isEmpty(user)) return errorResponseWithHTTPStatus(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)

        return successResponse(res, user, 'User fetched successfully', 200)
    } catch (error) {
        return errorResponseWithHTTPStatus(res, error, 'Error in get user', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/add-referral-user', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        const name = _.get(req, 'body.name', '').trim()
        const email = _.get(req, 'body.email', '').trim().toLowerCase()
        const password = _.get(req, 'body.password', '').trim()
        if (_.isEmpty(email) || _.isEmpty(password)) return errorResponseWithHTTPStatus(res, {}, 'Email and password are required', HTTP_BAD_REQUEST_400)

        const user = await User.findOne({ email: email }, '_id')
        if (!_.isEmpty(user)) return errorResponseWithHTTPStatus(res, {}, 'User already exists', HTTP_BAD_REQUEST_400)

        const referralLinks = []
        if (req.body.referral_links.length > 0) {
            for (let element of req.body.referral_links) {
                if (!mongoose.Types.ObjectId.isValid(element)) {
                    return errorResponseWithHTTPStatus(res, {}, 'Invalid referral link', HTTP_BAD_REQUEST_400)
                }

                const referralExist = await LinkTrackingReferral.exists({
                    _id: element
                })

                if (referralExist) referralLinks.push(element)
            }
        }

        if (referralLinks.length === 0) return errorResponseWithHTTPStatus(res, {}, 'Referral link is required', HTTP_BAD_REQUEST_400)

        const hashedPassword = await hashPassword(password)
        const newUser = new User({
            name: name,
            email: email,
            password: hashedPassword,
            role: LINK_REFERRAL,
            referral_links: referralLinks
        })

        await newUser.save()

        return successResponse(res, {}, 'Referral user added successfully', 200)
    } catch (error) {
        return errorResponseWithHTTPStatus(res, error, 'Error in add referral user', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/edit-referral-user', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        const _id = _.get(req, 'body._id', '').trim()
        if (_.isEmpty(_id)) return errorResponseWithHTTPStatus(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)

        const user = await User.findOne({ _id: _id, role: LINK_REFERRAL, is_deleted: { $ne: true } })
        if (_.isEmpty(user)) return errorResponseWithHTTPStatus(res, {}, 'User not found', HTTP_BAD_REQUEST_400)

        const name = _.get(req, 'body.name', '').trim()
        const password = _.get(req, 'body.password', '').trim()

        const referralLinks = []
        const bodyReferralLinks = _.get(req, 'body.referral_links', [])
        if (bodyReferralLinks.length > 0) {
            for (let element of bodyReferralLinks) {
                if (!mongoose.Types.ObjectId.isValid(element)) {
                    return errorResponseWithHTTPStatus(res, {}, 'Invalid referral link', HTTP_BAD_REQUEST_400)
                }

                const referralExist = await LinkTrackingReferral.exists({
                    _id: element
                })

                if (referralExist) referralLinks.push(element)
            }
        }

        if (referralLinks.length === 0) return errorResponseWithHTTPStatus(res, {}, 'Referral link is required', HTTP_BAD_REQUEST_400)

        user.name = name
        user.referral_links = referralLinks

        if (!_.isEmpty(password)) {
            user.password = await hashPassword(password)
        }

        await user.save()

        return successResponse(res, {}, 'Referral user updated successfully', 200)
    } catch (error) {
        return errorResponseWithHTTPStatus(res, error, 'Error in edit referral user', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/delete-referral-user', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.body._id)) return errorResponseWithHTTPStatus(res, {}, 'Invalid user id', HTTP_BAD_REQUEST_400)
        const user = await User.updateOne({ _id: req.body._id, role: LINK_REFERRAL }, { $set: { is_deleted: true } })

        return successResponse(res, user, 'User deleted successfully', 200)
    } catch (error) {
        return errorResponseWithHTTPStatus(res, error, 'Error in delete user', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/sync-visits', async (req, res) => {
    try {
        const token = req.body.token
        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponse(res, { error: 'You are not authorized' }, 'Unauthorized', 401)
        }

        for (let element of req.body.data) {
            const referral = await LinkTrackingReferral.findOne({ name: element.ffr }, '_id')
            if (_.isEmpty(referral)) continue

            const existingLinkTrackingAnalytics = await LinkTrackingAnalytics.findOne({
                date: new Date(element.date),
                referral_id: referral._id,
                domain: element.domain
            })

            if (!_.isEmpty(existingLinkTrackingAnalytics)) {
                existingLinkTrackingAnalytics.visits = element.visits
                existingLinkTrackingAnalytics.registrations = element.registrations
                existingLinkTrackingAnalytics.subscriptions = element.subscriptions
                await existingLinkTrackingAnalytics.save()
            } else {
                const linkTrackingAnalytics = new LinkTrackingAnalytics({
                    domain: element.domain,
                    visits: element.visits,
                    registrations: element.registrations,
                    subscriptions: element.subscriptions,
                    date: new Date(element.date),
                    referral_id: referral._id
                })

                await linkTrackingAnalytics.save()
            }
        }

        return successResponse(res, {}, 'Link tracking analytics saved successfully', 200)
    } catch (error) {
        return errorResponseWithHTTPStatus(res, error, 'Error in save link tracking analytics', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.get('/get-referral-list', protectRouteWithRole([LINK_REFERRAL, SUPER_ADMIN]), async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.decoded.id }, 'name referral_links')

        const referralLinks = user.referral_links
        const referralList = await LinkTrackingReferral.find({ _id: { $in: referralLinks } }, '_id name')
        return successResponse(res, referralList, 'Referral list get successfully', 200)
    } catch (error) {
        return errorResponseWithHTTPStatus(res, error, 'Error in get referral list', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

module.exports = router
