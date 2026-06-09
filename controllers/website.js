const express = require('express')
const router = express.Router()
const _ = require('lodash')
const Website = require('../models/Website')
const mongoose = require('mongoose')
const { protectAdminRoute, SUPER_ADMIN, ROLE_ANALYTICS, protectRouteWithRole, ROLE_SUPPORT, ROLE_ACCOUNT_MANAGER } = require('./../middleware/auth.middleware')
const WebsiteCommission = require('../models/WebsiteCommission')
const { errorResponse, successResponse } = require('../utils')

router.post('/add_website', protectAdminRoute, async (req, res) => {
    try {
        const data = req.body
        delete data._id
        const subscription_sub_account = _.get(data, 'subscription_sub_account', '').trim()
        const shop_sub_account = _.get(data, 'shop_sub_account', '').trim()
        const tip_sub_account = _.get(data, 'tip_sub_account', '').trim()
        const website_url = _.get(data, 'website_url', '').trim().toLowerCase()
        const status = _.get(data, 'status', '')
        const database_id = _.get(data, 'database_id', '')
        const server_id = _.get(data, 'server_id', '')
        const sticky_io_campaign_id = _.get(data, 'sticky_io_campaign_id', '').trim()
        const rating = _.get(data, 'rating', 0)
        const model_name = _.get(data, 'model_name', '').trim()
        const model_email = _.get(data, 'model_email', '').trim()
        data.recaptcha_website_id = data.recaptcha_website_id.trim()

        if (rating < 0 || rating > 5 || rating === '') {
            return errorResponse(res, {}, 'Please add rating between 0 to 5.')
        }

        if (website_url === '') return errorResponse(res, {}, 'Please add domain')

        const websiteRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        const checkWebsite = website_url.match(websiteRegex)
        if (checkWebsite === null) {
            return errorResponse(res, {}, 'Please enter valid domain name')
        }
        const emailRegex = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/
        const checkEmail = model_email.match(emailRegex)

        if (database_id === '') return errorResponse(res, {}, 'Please Select Database')
        if (server_id === '') return errorResponse(res, {}, 'Please Select Server')
        if (status === '') return errorResponse(res, {}, 'Please Select Status')
        if (model_name === '') return errorResponse(res, {}, 'Please enter valid model name')
        if (model_email === '' || checkEmail === null) return errorResponse(res, {}, 'Please enter valid model email')

        const numberPattern = /^\d+$/
        if (data.payment_gateway === 'sticky.io') {
            if (sticky_io_campaign_id === '') {
                return errorResponse(res, {}, 'Please Enter Sticky.io Camping ID')
            }
        } else {
            if (subscription_sub_account === '') return errorResponse(res, {}, 'Please Enter CCBill Subscription Sub Account Number')
            if (shop_sub_account === '') return errorResponse(res, {}, 'Please Enter CCBill Shop Sub Account Number')
            if (tip_sub_account === '') return errorResponse(res, {}, 'Please Enter CCBill Tip Sub Account Number')
            if (data.payment_gateway === 'hybrid') {
                if (sticky_io_campaign_id === '') {
                    return errorResponse(res, {}, 'Please Enter Sticky.io Camping ID')
                }
            }
        }

        const subAccounts = [subscription_sub_account, shop_sub_account, tip_sub_account]
        if (subscription_sub_account !== '' && shop_sub_account !== '' || tip_sub_account !== '') {
            if (new Set(subAccounts).size !== subAccounts.length) {
                return errorResponse(res, {}, 'You cannot add duplicate CCBill Sub Account Number')
            }
        }

        if (subscription_sub_account !== '') {
            if (subscription_sub_account.match(numberPattern) === null || subscription_sub_account.length !== 4) {
                return errorResponse(res, {}, 'Enter Valid CCBill Subscription Sub Account Number')
            }
        }

        if (shop_sub_account !== '') {
            if (shop_sub_account.match(numberPattern) === null || shop_sub_account.length !== 4) {
                return errorResponse(res, {}, 'Enter Valid CCBill Shop Sub Account Number')
            }
        }

        if (tip_sub_account !== '') {
            if (tip_sub_account.match(numberPattern) === null || tip_sub_account.length !== 4) {
                return errorResponse(res, {}, 'Enter Valid CCBill Tip Sub Account Numbers')
            }
        }

        if (sticky_io_campaign_id !== '' && sticky_io_campaign_id.match(numberPattern) === null) {
            return errorResponse(res, {}, 'Enter Valid Sticky.io Camping ID')
        }

        const condition = {
            $or: [
                { website_url: website_url }
            ]
        }

        if (subscription_sub_account !== '') {
            condition.$or.push({ subscription_sub_account: subscription_sub_account },
                { shop_sub_account: subscription_sub_account },
                { tip_sub_account: subscription_sub_account })
        }

        if (shop_sub_account !== '') {
            condition.$or.push({ subscription_sub_account: shop_sub_account },
                { shop_sub_account: shop_sub_account },
                { tip_sub_account: shop_sub_account })
        }

        if (tip_sub_account !== '') {
            condition.$or.push({ subscription_sub_account: tip_sub_account },
                { shop_sub_account: tip_sub_account },
                { tip_sub_account: tip_sub_account })
        }

        if (sticky_io_campaign_id !== '') {
            condition.$or.push({ sticky_io_campaign_id: sticky_io_campaign_id })
        }

        let rows = await Website.find(condition)
        if (rows.length > 0) {
            const websiteData = rows[0]
            const subscriptionSubAccount = websiteData.subscription_sub_account.trim()
            const shopSubAccount = websiteData.shop_sub_account.trim()
            const tipSubAccount = websiteData.tip_sub_account.trim()
            if (website_url === websiteData.website_url) return errorResponse(res, {}, 'You can not add duplicate website')
            if (subscription_sub_account !== '' && (subscription_sub_account === subscriptionSubAccount ||
                subscription_sub_account === shopSubAccount ||
                subscription_sub_account === tipSubAccount)) {
                return errorResponse(res, {}, 'CCBill Subscription Sub Account Already exist')
            }
            if (shop_sub_account !== '' && (shop_sub_account === subscriptionSubAccount ||
                shop_sub_account === shopSubAccount ||
                shop_sub_account === tipSubAccount)) {
                return errorResponse(res, {}, 'CCBill Shop Sub Account Already exist')
            }
            if (tip_sub_account !== '' && (tip_sub_account === subscriptionSubAccount ||
                tip_sub_account === shopSubAccount ||
                tip_sub_account === tipSubAccount)) {
                return errorResponse(res, {}, 'CCBill Tip Sub Account Already exist')
            }

            if (sticky_io_campaign_id !== '' && (sticky_io_campaign_id === websiteData.sticky_io_campaign_id.trim())) {
                return errorResponse(res, {}, 'Sticky.io Campaign Id Already exist')
            }
        }
        // get auto increment id for website
        const lastWebsite = await Website.findOne().sort({ website_id: -1 })
        data['website_id'] = lastWebsite === null ? 1 : lastWebsite.website_id + 1
        data['created_at'] = new Date()
        data['website_url'] = website_url
        data['subscription_sub_account'] = subscription_sub_account
        data['shop_sub_account'] = shop_sub_account
        data['tip_sub_account'] = tip_sub_account
        data['sticky_io_campaign_id'] = sticky_io_campaign_id
        let websiteData = new Website(data)

        await websiteData.save()
        return successResponse(res, {}, 'Website information added successfully', 200)
    } catch (error) {
        return errorResponse(res, error, 'There was a problem in add website data.', 500)
    }
})

router.post('/edit_website', protectAdminRoute, async (req, res) => {
    try {
        const data = req.body.data
        const previousData = req.body.previousData
        const subscription_sub_account = _.get(data, 'subscription_sub_account', '').trim()
        const shop_sub_account = _.get(data, 'shop_sub_account', '').trim()
        const tip_sub_account = _.get(data, 'tip_sub_account', '').trim()
        const website_url = _.get(data, 'website_url', '').trim().toLowerCase()
        const _id = _.get(data, '_id', '')
        const status = _.get(data, 'status', '')
        const google_analytics = _.get(data, 'google_analytics', false)
        const is_cloudfront = _.get(data, 'is_cloudfront', false)
        const database_id = _.get(data, 'database_id', '')
        const server_id = _.get(data, 'server_id', '')
        const model_name = _.get(data, 'model_name', '').trim()
        const model_email = _.get(data, 'model_email', '').trim()
        const vendor_name = _.get(data, 'vendor_name', '')
        const sticky_io_campaign_id = _.get(data, 'sticky_io_campaign_id', '').trim()
        const tag = _.get(data, 'tag', '')
        const recaptcha_website_id = _.get(data, 'recaptcha_website_id', '').trim()
        const rating = _.get(data, 'rating', 0)
        const setup_date = _.get(data, 'setup_date', '')
        const launch_date = _.get(data, 'lunch_date', '')
        const bring_down_date = _.get(data, 'bring_down_date', '')
        const is_crypto_payment_enabled = _.get(data, 'is_crypto_payment_enabled', false)

        if (rating < 0 || rating > 5 || rating === '') {
            return errorResponse(res, {}, 'Please add rating between 0 to 5.')
        }

        if (_id === '') return errorResponse(res, {}, 'Website Not Found')
        if (website_url === '') return errorResponse(res, {}, 'Please add domain')

        const websiteRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        const checkWebsite = website_url.match(websiteRegex)
        if (checkWebsite === null) {
            return errorResponse(res, {}, 'Please enter valid domain name')
        }
        const emailRegex = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/
        const checkEmail = model_email.match(emailRegex)

        if (database_id === '') return errorResponse(res, {}, 'Please Select Database')
        if (server_id === '') return errorResponse(res, {}, 'Please Select Server')
        if (status === '') return errorResponse(res, {}, 'Please Select Status')
        if (model_name === '') return errorResponse(res, {}, 'Please enter valid model name')
        if (model_email === '' || checkEmail === null) return errorResponse(res, {}, 'Please enter valid model email')
        const numberPattern = /^\d+$/

        if (data.payment_gateway === 'sticky.io') {
            if (sticky_io_campaign_id === '') {
                return errorResponse(res, {}, 'Enter Sticky.io Camping ID')
            }
        } else {
            if (subscription_sub_account === '') return errorResponse(res, {}, 'Please Enter CCBill Subscription Sub Account Number')
            if (shop_sub_account === '') return errorResponse(res, {}, 'Please Enter CCBill Shop Sub Account Number')
            if (tip_sub_account === '') return errorResponse(res, {}, 'Please Enter CCBill Tip Sub Account Number')
            if (data.payment_gateway === 'hybrid') {
                if (sticky_io_campaign_id === '') return errorResponse(res, {}, 'Enter Sticky.io Camping ID')
            }
        }

        const subAccounts = [subscription_sub_account, shop_sub_account, tip_sub_account]
        if (subscription_sub_account !== '' && shop_sub_account !== '' || tip_sub_account !== '') {
            if (new Set(subAccounts).size !== subAccounts.length) {
                return errorResponse(res, {}, 'You cannot add duplicate CCBill Sub Account Number')
            }
        }

        if (subscription_sub_account !== '' && shop_sub_account !== '' || tip_sub_account !== '') {
            if (new Set(subAccounts).size !== subAccounts.length) {
                return errorResponse(res, {}, 'You cannot add duplicate CCBill Sub Account Number')
            }
        }

        if (subscription_sub_account !== '') {
            if (subscription_sub_account.match(numberPattern) === null || subscription_sub_account.length !== 4) {
                return errorResponse(res, {}, 'Enter Valid CCBill Subscription Sub Account Number')
            }
        }

        if (shop_sub_account !== '') {
            if (shop_sub_account.match(numberPattern) === null || shop_sub_account.length !== 4) {
                return errorResponse(res, {}, 'Enter Valid CCBill Shop Sub Account Number')
            }
        }

        if (tip_sub_account !== '') {
            if (tip_sub_account.match(numberPattern) === null || tip_sub_account.length !== 4) {
                return errorResponse(res, {}, 'Enter Valid CCBill Tip Sub Account Number')
            }
        }

        if (sticky_io_campaign_id !== '' && sticky_io_campaign_id.match(numberPattern) === null) {
            return errorResponse(res, {}, 'Enter Valid Sticky.io Camping ID')
        }

        const newValues = {
            $set: {
                website_url: website_url,
                subscription_sub_account: subscription_sub_account,
                shop_sub_account: shop_sub_account,
                tip_sub_account: tip_sub_account,
                status: status,
                google_analytics: google_analytics,
                is_cloudfront: is_cloudfront,
                database_id: database_id,
                server_id: server_id,
                model_email: model_email,
                model_name: model_name,
                vendor_name: vendor_name,
                payment_gateway: data.payment_gateway,
                sticky_io_campaign_id: sticky_io_campaign_id,
                recaptcha_website_id: recaptcha_website_id,
                rating: rating,
                setup_date: setup_date,
                lunch_date: launch_date,
                bring_down_date: bring_down_date,
                is_crypto_payment_enabled: is_crypto_payment_enabled
            }
        }

        if (data.payment_gateway === 'sticky.io' || data.payment_gateway === 'ccbill') {
            newValues.$set.tag = tag
        }

        const condition = { $or: [] }

        const previousWebsiteUrl = _.get(previousData, 'domain', '').trim()
        const previousSubscriptionSubAccount = _.get(previousData, 'subscription_sub_account', '').trim()
        const previousShopSubAccount = _.get(previousData, 'shop_sub_account', '').trim()
        const previousTipSubAccount = _.get(previousData, 'tip_sub_account', '').trim()
        const stickyIoCampaignId = _.get(previousData, 'sticky_io_campaign_id', '').trim()

        if (previousWebsiteUrl !== website_url) {
            condition.$or.push({ website_url: website_url })
        }

        if (previousSubscriptionSubAccount !== subscription_sub_account) {
            condition.$or.push({ subscription_sub_account: subscription_sub_account },
                { shop_sub_account: subscription_sub_account },
                { tip_sub_account: subscription_sub_account })

        }
        if (previousShopSubAccount !== shop_sub_account) {
            condition.$or.push({ subscription_sub_account: shop_sub_account },
                { shop_sub_account: shop_sub_account },
                { tip_sub_account: shop_sub_account })
        }
        if (previousTipSubAccount !== tip_sub_account) {
            condition.$or.push({ subscription_sub_account: tip_sub_account },
                { shop_sub_account: tip_sub_account },
                { tip_sub_account: tip_sub_account })
        }

        if (stickyIoCampaignId !== sticky_io_campaign_id) {
            condition.$or.push({ sticky_io_campaign_id: sticky_io_campaign_id })
        }

        if (condition.$or.length === 0) {
            delete condition.$or
        }

        let rows = []
        if (!_.isEmpty(condition)) {
            rows = await Website.find(condition)
        }

        if (rows.length > 0) {
            const websiteData = rows[0]
            const subscriptionSubAccount = websiteData.subscription_sub_account.trim()
            const shopSubAccount = websiteData.shop_sub_account.trim()
            const tipSubAccount = websiteData.tip_sub_account.trim()

            if (previousWebsiteUrl !== website_url) {
                if (website_url === websiteData.website_url) return errorResponse(res, {}, 'You can not add duplicate website')
            }

            if (subscription_sub_account !== '' && (subscription_sub_account === subscriptionSubAccount ||
                subscription_sub_account === shopSubAccount ||
                subscription_sub_account === tipSubAccount)) {
                return errorResponse(res, {}, 'CCBill Subscription Sub Account Already exist')
            }
            if (shop_sub_account !== '' && (shop_sub_account === subscriptionSubAccount ||
                shop_sub_account === shopSubAccount ||
                shop_sub_account === tipSubAccount)) {
                return errorResponse(res, {}, 'CCBill Shop Sub Account Already exist')
            }
            if (tip_sub_account !== '' && (tip_sub_account === subscriptionSubAccount ||
                tip_sub_account === shopSubAccount ||
                tip_sub_account === tipSubAccount)) {
                return errorResponse(res, {}, 'CCBill Tip Sub Account Already exist')
            }
            if (sticky_io_campaign_id !== '' && (sticky_io_campaign_id === websiteData.sticky_io_campaign_id.trim())) {
                return errorResponse(res, {}, 'Sticky.io Campaign Id Already exist')
            }
        }

        const query = { _id: _id }
        await Website.updateOne(query, newValues)

        return successResponse(res, {}, 'Website information updated successfully', 200)
    } catch (error) {
        return errorResponse(res, error, 'There was a problem in update website data.', 500)
    }
})

router.post('/add_website_tags', protectAdminRoute, async (req, res) => {
    const data = req.body
    const _id = _.get(data, '_id', false)
    const tag = _.get(data, 'tag', [])

    if (!_id) {
        return errorResponse(res, {}, 'Format error')
    }

    const newValues = {
        $set: {
            tag: tag
        }
    }

    const query = { _id: _id }
    try {
        await Website.updateOne(query, newValues)

        return successResponse(res, {}, 'Tags updated successfully', 200)
    } catch (error) {
        console.log(error.message)
        return errorResponse(res, error, 'There was a problem in update tags.', 500)
    }

})

router.post('/get_website_list', protectAdminRoute, async (req, res) => {
    try {
        const domain = req.body.domain
        const server = req.body.server
        const database = req.body.database
        const status =  _.get(req.body, 'status', [])
        const payment_gateway = req.body.payment_gateway
        const subscription_sub_account = req.body.subAccountNo
        const sticky_io_campaign_id = req.body.campaignId
        const tag = _.get(req.body, 'tag', [])
        const is_crypto_enabled = req.body.is_crypto_enabled
        let currentPage = parseInt(req.query.page_num, 10)

        let query = {}
        if (domain !== '') {
            query.website_url = domain
        }

        if (server !== '') {
            query.server_id = new mongoose.Types.ObjectId(server)
        }

        if (database !== '') {
            query.database_id = new mongoose.Types.ObjectId(database)
        }

        if (status.length > 0) {
            query.status = { $in: status }
        }

        if (payment_gateway !== '') {
            query.payment_gateway = payment_gateway
        }

        if (is_crypto_enabled !== '') {
            query.is_crypto_payment_enabled = is_crypto_enabled === 'true' ? true : { $ne: true }
        }

        if (tag.length > 0) {
            query.tag = { $in: tag }
        }

        if (subscription_sub_account !== '') {
            query['$or'] = [{ subscription_sub_account: subscription_sub_account }, { shop_sub_account: subscription_sub_account }, { tip_sub_account: subscription_sub_account }]
        }

        if (sticky_io_campaign_id !== '') {
            query.sticky_io_campaign_id = sticky_io_campaign_id
        }

        const totalRows = await Website.countDocuments(query)
        let limit = 20
        let totalPages = Math.ceil(totalRows / limit)

        let offset = (currentPage - 1) * limit
        let rows = []

        if (totalRows > 0) {
            rows = await Website.aggregate([
                {
                    $match: query
                },
                {
                    $sort: {
                        monthly_earning: -1,
                        _id: -1
                    }
                },
                {
                    $skip: offset
                }, {
                    $limit: limit
                }, {
                    '$lookup': {
                        'from': 'databases',
                        'localField': 'database_id',
                        'foreignField': '_id',
                        'as': 'database'
                    }
                }, {
                    $unwind: '$database'
                }, {
                    '$lookup': {
                        'from': 'servers',
                        'localField': 'server_id',
                        'foreignField': '_id',
                        'as': 'server'
                    }
                }, {
                    $unwind: '$server'
                }, {
                    $project: {
                        'website_id': 1,
                        'website_url': 1,
                        'subscription_sub_account': 1,
                        'shop_sub_account': 1,
                        'tip_sub_account': 1,
                        'is_cloudfront': 1,
                        'vendor_name': 1,
                        'server.name': 1,
                        'database.name': 1,
                        'status': 1,
                        'created_at': 1,
                        payment_gateway: 1,
                        sticky_io_campaign_id: 1,
                        tag: 1,
                        recaptcha_website_id: 1,
                        is_crypto_payment_enabled: 1,
                        'rating': 1,
                        monthly_earning: 1
                    }
                }
            ])
        }

        const data = {
            rows: rows,
            totalPages: totalPages,
            currentPage: currentPage,
            totalRows: totalRows,
            limit: limit
        }
        return successResponse(res, data, 'Website data get successfully', 200)
    } catch (error) {
        return errorResponse(res, error, 'There was a problem in fetch website data.', 500)
    }
})

router.get('/get_website_lists', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS, ROLE_ACCOUNT_MANAGER]), async (req, res) => {
    let rows = await Website.find({}).sort({ 'website_url': 'asc' })

    const data = {
        rows: rows
    }
    return successResponse(res, data, 'Website data get successfully', 200)
})

router.get('/get_all_website_options', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT, ROLE_ACCOUNT_MANAGER]), async (req, res) => {
    const payment_gateway = _.get(req.query, 'payment_gateway', '')
    const query = {}
    if (payment_gateway !== '') {
        query.payment_gateway = payment_gateway
    }
    let rows = await Website.find(query, 'website_url is_referral subscription_sub_account shop_sub_account tip_sub_account payment_gateway').sort({ 'monthly_earning': 'desc' })
    return res.send({
        rows: rows
    })
})

router.get('/get_website_data_by_id', protectAdminRoute, async (req, res) => {
    try {
        const id = new mongoose.Types.ObjectId(req.query._id)
        const data = await Website.findById(id)

        return successResponse(res, data, 'Website data get successfully', 200)
    } catch (error) {
        return errorResponse(res, error, 'There was a problem in fetch website data.', 500)
    }
})

router.post('/get_website_commission_list', protectAdminRoute, async (req, res) => {

    const data = req.body
    let query = {}

    if (data.domain) {
        query['domain'] = data.domain
    }

    const totalRows = await WebsiteCommission.countDocuments(query)

    let currentPage = parseInt(req.query.page_num, 10)
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await WebsiteCommission.aggregate([
            { $match: query },
            { $sort: { 'target_date': -1 } },
            { $skip: offset },
            { $limit: limit },
            {
                '$lookup': {
                    'from': 'websites',
                    'localField': 'domain',
                    'foreignField': 'website_url',
                    'as': 'website'
                }
            }, {
                $unwind: '$website'
            }, {
                $project: {
                    '_id': 1,
                    'domain': 1,
                    'platform_commission': 1,
                    'ccbill_fees': 1,
                    'subscription_revenue': 1,
                    'target_date': 1,
                    'created_at': 1,
                    'website.website_id': 1,
                    'payment_gateway': 1,
                    'sticky_io_charges': 1,
                    'sticky_io_transaction_charge': 1,
                    'sticky_io_new_transaction_fix_charge': 1,
                    'sticky_io_void_refund_transaction_fix_charge': 1,
                    'sticky_io_decline_transaction_fix_charge': 1,
                    'sticky_io_fixed_fees': 1,
                    'ccbill_transaction_charge': 1,
                    'forumpay_transaction_charge': 1
                }
            }
        ])
    }

    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

router.post('/get_website_commission', protectAdminRoute, async (req, res) => {

    const data = req.body
    let query = {}

    if (data.domain) {
        query['domain'] = data.domain
    }

    let row = await WebsiteCommission.findOne(query).sort({ _id: -1 })

    return res.send({
        row: row
    })
})

module.exports = router
