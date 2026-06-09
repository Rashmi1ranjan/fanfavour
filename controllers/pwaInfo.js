const express = require('express')
const router = express.Router()
const _ = require('lodash')
const PWAInfo = require('../models/PWAInfo')
const { SUPER_ADMIN, protectRouteWithRole } = require('./../middleware/auth.middleware')
const { errorResponse, successResponse } = require('../utils')
const { API_STATIC_AUTH_TOKEN } = require('./../constants')
const moment = require('moment')

router.post('/save-device-info', async (req, res) => {
    try {
        const token = _.get(req, 'body.token', '')
        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponse(res, 'Unauthorized', 'Unauthorized', 401)
        }

        const pwaInfoData = await PWAInfo.findOne({ user_id: req.body.user_id, domain: req.body.domain })

        if (pwaInfoData === null) {
            const newPWAInfo = req.body

            if (req.body.is_popup_opened) {
                newPWAInfo.popup_display_count = 1
            }

            if (req.body.is_running_from_pwa) {
                newPWAInfo.pwa_user_agent = req.body.user_agent
                newPWAInfo.pwa_last_seen = new Date()
                newPWAInfo.is_running_from_pwa = true
            } else {
                newPWAInfo.non_pwa_user_agent = req.body.user_agent
                newPWAInfo.non_pwa_last_seen = new Date()
                newPWAInfo.is_running_from_pwa = false
            }

            if (req.body.ccbill_subscription_status) {
                newPWAInfo.ccbill_subscription_status = req.body.ccbill_subscription_status
            }

            if (req.body.ccbill_subscription_status) {
                newPWAInfo.ccbill_subscription_status = req.body.ccbill_subscription_status
            }

            const newInfo = new PWAInfo(newPWAInfo)
            await newInfo.save()
        } else {
            const updateQuery = {}

            if (req.body.is_running_from_pwa) {
                updateQuery.pwa_user_agent = req.body.user_agent
                updateQuery.pwa_last_seen = new Date()
                updateQuery.is_running_from_pwa = true
            } else {
                updateQuery.non_pwa_user_agent = req.body.user_agent
                updateQuery.non_pwa_last_seen = new Date()
            }

            if (req.body.is_popup_opened) {
                updateQuery['$inc'] = { popup_display_count: 1 }
            }

            if (req.body.ccbill_subscription_status) {
                updateQuery.ccbill_subscription_status = req.body.ccbill_subscription_status
            }
            await PWAInfo.updateOne({ user_id: req.body.user_id, domain: req.body.domain }, updateQuery)
        }

        return successResponse(res, {}, 'PWA Info saved', 200)
    } catch (error) {
        console.log(error)
        return errorResponse(res, error, error.message, 500)
    }
})

router.post('/get-pwa-info', protectRouteWithRole(SUPER_ADMIN), async (req, res) => {
    try {
        const filter = req.body
        const currentPage = parseInt(req.body.page_num, 10)
        const limit = 20
        const query = {}

        if (filter.device_type !== 'all') {
            if (filter.device_type === 'android') {
                query.pwa_user_agent = { $regex: /(Android)\s+([\d.]+)/ }
            } else if (filter.device_type === 'ios') {
                query.pwa_user_agent = { $regex: /(iPhone|iPod|iPad)/ }
            }
        }

        if (filter.domain !== '') {
            query.domain = filter.domain
        }

        if (filter.subscribers_only !== 'all') {
            query.ccbill_subscription_status = { $in: ['1', '2'] }
        }

        if (filter.is_running_from_pwa !== 'all') {
            query.is_running_from_pwa = filter.is_running_from_pwa === 'true' ? true : false
        }

        const totalRows = await PWAInfo.countDocuments(query)
        const totalPages = Math.ceil(totalRows / limit)
        const offset = (currentPage - 1) * limit
        let rows = []

        if (totalRows > 0) {
            rows = await PWAInfo.find(query).skip(offset).limit(limit).sort({ 'createdAt': 'desc' })
        }

        const days30 = moment().subtract(30, 'days').format('YYYY-MM-DD 00:00:00')
        const newDate30 = new Date(days30)

        const days90 = moment().subtract(90, 'days').format('YYYY-MM-DD 00:00:00')
        const newDate90 = new Date(days90)

        const PWAAnalyticsData = await PWAInfo.aggregate([{
            $match: query
        },
        {
            $facet: {
                averageCountsFor30Days: [{
                    $match: {
                        is_running_from_pwa: true,
                        pwa_last_seen: {
                            $gte: newDate30,
                            $lte: new Date()
                        }
                    }
                }, {
                    $group: {
                        _id: null,
                        count: { $sum: 1 }
                    }
                }],
                averageCountsFor90Days: [{
                    $match: {
                        is_running_from_pwa: true,
                        pwa_last_seen: {
                            $gte: newDate90,
                            $lte: new Date()
                        }
                    }
                }, {
                    $group: {
                        _id: null,
                        count: { $sum: 1 }
                    }
                }],
                totalNoOfInstalls: [{
                    $match: {
                        is_running_from_pwa: true
                    }
                }, {
                    $group: {
                        _id: null,
                        count: { $sum: 1 }
                    }
                }],
                usersShownPopUpAtLeastOnce: [{
                    $match: {
                        popup_display_count: { $gte: 1 }
                    }
                }, {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        popup_display_count: { $sum: '$popup_display_count' }
                    }
                }]
            }
        }])

        const averageCountsFor30Days = _.get(PWAAnalyticsData, '[0]averageCountsFor30Days[0]', { count: 0 })
        const averageCountsFor90Days = _.get(PWAAnalyticsData, '[0]averageCountsFor90Days[0]', { count: 0 })
        const totalNoOfInstalls = _.get(PWAAnalyticsData, '[0]totalNoOfInstalls[0]', { count: 0 })
        const usersShownPopUpAtLeastOnce = _.get(PWAAnalyticsData, '[0]usersShownPopUpAtLeastOnce[0]', { count: 0, popup_display_count: 0 })

        let averageInstalls = 0
        let avgPopupDisplayed = 0

        if (totalNoOfInstalls.count !== 0 && usersShownPopUpAtLeastOnce.count !== 0) {
            averageInstalls = (totalNoOfInstalls.count / usersShownPopUpAtLeastOnce.count) * 100
        }

        if (totalNoOfInstalls.count !== 0 && usersShownPopUpAtLeastOnce.popup_display_count !== 0) {
            avgPopupDisplayed = (totalNoOfInstalls.count / usersShownPopUpAtLeastOnce.popup_display_count)
        }

        const data = {
            rows: rows,
            totalPages: totalPages,
            currentPage: currentPage,
            totalRows: totalRows,
            limit: limit,
            averageCountsFor30Days: averageCountsFor30Days.count,
            averageCountsFor90Days: averageCountsFor90Days.count,
            totalNoOfInstalls: totalNoOfInstalls.count,
            usersShownPopUpAtLeastOnce: usersShownPopUpAtLeastOnce.count,
            averageInstalls: averageInstalls.toFixed(2),
            avgPopupDisplayed: avgPopupDisplayed.toFixed(2)
        }

        return successResponse(res, data, 'PWA Info', 200)
    } catch (error) {
        console.log(error)
        return errorResponse(res, error, error.message, 500)
    }
})

module.exports = router
