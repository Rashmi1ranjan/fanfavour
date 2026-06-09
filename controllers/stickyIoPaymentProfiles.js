const express = require('express')
const router = express.Router()
const StickyIoPaymentProfiles = require('../models/StickyIoPaymentProfiles')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const axios = require('axios')
const _ = require('lodash')

router.get('/refresh_payment_profile', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const stickyIoApiUrl = 'https://mccandlessgroup.sticky.io/api/v1/gateway_view'
    const username = 'mccandlessgroup_5547'
    const password = 'fdf00e83101003'
    const headerOptions = {
        auth: { username, password },
        headers: { 'Content-Type': 'application/json' }
    }
    const requestData = {
        gateway_id: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    }

    const getPaymentProfile = await axios.post(stickyIoApiUrl, requestData, headerOptions)
    const paymentGatewayIds = getPaymentProfile.data.gateway_ids
    const profileInfo = getPaymentProfile.data.data
    if (paymentGatewayIds.length > 0) {
        for (const gatewayId of paymentGatewayIds) {
            const profile = profileInfo[gatewayId]
            if (profile.response_code === '100') {
                const profileData = {
                    gateway_type: profile.gateway_type,
                    gateway_provider: profile.gateway_provider,
                    gateway_created: profile.gateway_created,
                    gateway_active: profile.gateway_active,
                    gateway_alias: profile.gateway_alias
                }
                const query = {
                    gateway_id: profile.gateway_id
                }
                await StickyIoPaymentProfiles.updateOne(query, profileData, { upsert: true })
            }
        }
    }

    return res.send({ message: 'Payment Profile Successfully Updated'})
})

router.post('/get_profiles', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    let currentPage = parseInt(req.body.page, 10)
    const query = {}
    const filter = req.body.filter
    const limit = 10

    const gateway_alias = _.get(filter, 'gateway_alias', '')
    if (gateway_alias !== '') {
        query.gateway_alias = gateway_alias
    }

    const gateway_active = _.get(filter, 'gateway_active', 'all')
    if (gateway_active !== 'all') {
        query.gateway_active = gateway_active
    }

    const totalRows = await StickyIoPaymentProfiles.countDocuments(query)
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await StickyIoPaymentProfiles.find(query)
            .skip(offset).limit(limit).sort({ 'createdAt': 'desc' })
    }
    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})


router.get('/get_all_profiles', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    const rows = await StickyIoPaymentProfiles.find({}).sort({ 'createdAt': 'desc' })
    return res.send({ rows: rows })
})

module.exports = router
