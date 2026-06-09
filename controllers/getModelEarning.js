const express = require('express')
const router = express.Router()
const Website = require('../models/Website')
const WebsiteDailyEarningReport = require('../models/WebsiteDailyEarningReport')
const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const moment = require('moment')
const { protectAdminRoute, protectRouteWithRole, ROLE_REFERRAL, SUPER_ADMIN } = require('./../middleware/auth.middleware')
const { getCommissionForDomainForDate } = require('./../dailyEarningReport')
const createCsvWriter = require('csv-writer').createArrayCsvWriter
const WebsiteReferralHistory = require('../models/WebsiteReferralHistory')
const { v4: uuidv4 } = require('uuid')
const User = require('./../models/User')
const { errorResponse, successResponse } = require('../utils')
const WebsiteReferralDailyEarningReport = require('../models/WebsiteReferralDailyEarningReport')
const mongoose = require('mongoose')

router.post('/get-earning-report-for-referral', protectRouteWithRole([ROLE_REFERRAL, SUPER_ADMIN]), async (req, res) => {
    const startDate = moment(req.body.start_date, 'MM-DD-YYYY').format('YYYY-MM-DD 00:00:00')
    const endDate = moment(req.body.end_date, 'MM-DD-YYYY').format('YYYY-MM-DD 23:59:59')

    let referralUserId = ''
    if (req.decoded.role === SUPER_ADMIN) {
        const referralId = _.get(req, 'body.referral_id', '')
        if (referralId === '') {
            return errorResponse(res, 'error', 'Please Select Referral', 500)
        }
        referralUserId = new mongoose.Types.ObjectId(referralId)
    } else {
        const userData = await User.findOne({ _id: req.decoded.id, role: 'REFERRAL' }, 'referral_id name')
        referralUserId = new mongoose.Types.ObjectId(userData.referral_id)
    }

    let condition = {
        $or: [
            { referral_id: referralUserId },
            { referral_id1: referralUserId },
            { referral_id2: referralUserId }
        ]
    }
    const domain = _.get(req, 'body.domain', '')
    if (!['', 'all'].includes(domain)) {
        condition.domain = domain
    }

    let websiteStatuses = ['live', 'published']
    if (req.decoded.role === SUPER_ADMIN) {
        websiteStatuses = ['live', 'published', 'pending', 'removed']
    }
    const totalWebsites = await WebsiteReferralHistory.aggregate([
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
        },
        {
            '$group': {
                '_id': '$websites.website_url',
                'count': {
                    '$sum': 1
                }
            }
        }
    ])
    const totalRows = totalWebsites.length
    let currentPage = parseInt(req.query.page_num, 10)
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)
    let offset = (currentPage - 1) * limit
    let referralEarningReports = []
    let summaryReport = []
    if (totalRows > 0) {
        const referralDomainList = await WebsiteReferralHistory.aggregate([
            {
                '$match': condition
            },
            {
                '$lookup': {
                    'from': 'websites',
                    'localField': 'domain',
                    'foreignField': 'website_url',
                    'as': 'websites'
                }
            },
            {
                '$unwind': {
                    'path': '$websites'
                }
            },
            {
                '$match': {
                    'websites.status': { $in: websiteStatuses }
                }
            },
            {
                '$group': {
                    '_id': '$websites.website_url',
                    'websites': {
                        '$first': {
                            '_id': '$websites._id',
                            'website_url': '$websites.website_url'
                        }
                    }
                }
            },
            {
                $skip: offset
            },
            {
                $limit: limit
            },
            {
                '$project': {
                    'websites._id': 1,
                    'websites.website_url': 1
                }
            }
        ])
        let rows = await getWebsiteList(referralDomainList)
        referralEarningReports = await generateEarningReportByDetail(rows, startDate, endDate, referralUserId, 'report', req.body.requestFrom)
        if (currentPage === 1) {
            delete condition.domain
            const referralDomainListForSummary = await WebsiteReferralHistory.aggregate([
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

            let rowsForSummary = await getWebsiteList(referralDomainListForSummary)
            summaryReport = await generateEarningReportByDetail(rowsForSummary, startDate, endDate, referralUserId, 'summary', req.body.requestFrom)
        }
    }

    const responseObject = {
        row: referralEarningReports,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit,
        summary_report: summaryReport
    }
    return successResponse(res, responseObject, 'Website Referral Earning Report Get Successfully', 200)
})

/**
 *
 * @param {Array} referralDomainList referralDomainList
 * @returns {Array} domain array
 */
async function getWebsiteList(referralDomainList) {
    let array = []
    for (let element of referralDomainList) {
        const newData = {
            website_url: element.websites.website_url,
            _id: element.websites._id
        }
        let findRecord = _.findIndex(array, function (n) {
            return (n.website_url === newData.website_url) ? n : false
        })
        if (findRecord === -1) {
            array.push(newData)
        }
    }
    return array
}

router.post('/get-earning-report-csv-for-referral', protectRouteWithRole([ROLE_REFERRAL, SUPER_ADMIN]), async (req, res) => {
    const startDate = moment(req.body.start_date, 'MM-DD-YYYY').format('YYYY-MM-DD 00:00:00')
    const endDate = moment(req.body.end_date, 'MM-DD-YYYY').format('YYYY-MM-DD 23:59:59')

    let referralUserId = ''
    if (req.decoded.role === 'SUPER_ADMIN') {
        const referralId = _.get(req, 'body.referral_id', '')
        if (referralId === '') {
            return errorResponse(res, 'error', 'Please Select Referral', 500)
        }
        referralUserId = new mongoose.Types.ObjectId(referralId)
    } else {
        const userData = await User.findOne({ _id: req.decoded.id, role: 'REFERRAL' }, 'referral_id name')
        referralUserId = new mongoose.Types.ObjectId(userData.referral_id)
    }
    let condition = {
        $or: [
            { referral_id: referralUserId },
            { referral_id1: referralUserId },
            { referral_id2: referralUserId }
        ]
    }
    const domain = _.get(req, 'body.domain', '')
    if (!['', 'all'].includes(domain)) {
        condition.domain = domain
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

    const referralEarningReports = await generateEarningReportByDetail(rows, startDate, endDate, referralUserId, 'csv', req.body.requestFrom)
    let path = await generateEarningReportCsv(referralEarningReports, false, startDate, 'referralEarning')
    return successResponse(res, { csvUrl: path }, 'csv generated successfully', 200)
})

/**
 * generate earning report for referral
 *
 * @param {string} websites websites
 * @param {string} startDate startDate
 * @param {string} endDate endDate
 * @param {string} referralUserId referralUserId
 * @param {string} dataFormatType  csv, report, summary
 * @param {string} requestFrom empty or link-tracking
 * @returns {any} csv file
 */
async function generateEarningReportByDetail(websites, startDate, endDate, referralUserId, dataFormatType = 'report', requestFrom) {
    let earnings = []
    let count = 1

    for (let element of websites) {
        let row = await getEarningReport(element.website_url, startDate, endDate, requestFrom)
        if (row !== false) {
            let referralId = _.get(row, 'referral_history_id', '')
            if (requestFrom === 'link-tracking') {
                referralId = _.get(row, 'link_tracking_referral_history_id', '')
            }
            let referralAmount = 0
            let referralCommission = []
            if (referralId !== '') {
                let referralDetail = await WebsiteReferralHistory.findOne({ _id: referralId })
                if (referralDetail !== null && referralDetail.total_referral > 0) {
                    if (['normal', 'link-tracking'].includes(referralDetail.referral_type) && referralDetail.referral_id.toString() === referralUserId.toString()) {
                        referralAmount += row.referral_amount
                        let findRecord = _.findIndex(referralCommission, function (n) {
                            return (n.referral_commission === referralDetail.referral_commission) ? n : false
                        })
                        if (findRecord === -1) {
                            referralCommission.push({
                                referral_commission: referralDetail.referral_commission,
                                target_date: moment(referralDetail.target_date).format('YYYY-MM-DD HH:MM:SS')
                            })
                        }
                    }
                    if (referralDetail.total_referral > 1) {
                        if (referralDetail.referral_type1 === 'normal' && referralDetail.referral_id1.toString() === referralUserId.toString()) {
                            referralAmount += row.referral_amount1
                            let findRecord = _.findIndex(referralCommission, function (n) {
                                return (n.referral_commission === referralDetail.referral_commission1) ? n : false
                            })
                            if (findRecord === -1) {
                                referralCommission.push({
                                    referral_commission: referralDetail.referral_commission1,
                                    target_date: moment(referralDetail.target_date).format('YYYY-MM-DD HH:MM:SS')
                                })
                            }
                        }
                        if (referralDetail.total_referral > 2) {
                            if (referralDetail.referral_type2 === 'normal' && referralDetail.referral_id2.toString() === referralUserId.toString()) {
                                referralAmount += row.referral_amount2
                                let findRecord = _.findIndex(referralCommission, function (n) {
                                    return (n.referral_commission === referralDetail.referral_commission2) ? n : false
                                })
                                if (findRecord === -1) {
                                    referralCommission.push({
                                        referral_commission: referralDetail.referral_commission2,
                                        target_date: moment(referralDetail.target_date).format('YYYY-MM-DD HH:MM:SS')
                                    })
                                }
                            }
                        }
                    }
                }
            }
            const newTransactionAmount = row.subscription_amount + row.shop_amount + row.tip_amount
            const refundAmount = row.subscription_refund_amount + row.shop_refund_amount + row.tip_refund_amount
            const voidAmount = row.subscription_void_amount + row.shop_void_amount + row.tip_void_amount
            if (dataFormatType === 'csv') {
                earnings.push([
                    count,
                    element.website_url,
                    (newTransactionAmount.toFixed(2)).toString(),
                    (refundAmount.toFixed(2)).toString(),
                    (voidAmount.toFixed(2)).toString(),
                    (row.chargeback_amount.toFixed(2)).toString(),
                    row.chargeback_count,
                    (row.net_revenue.toFixed(2)).toString(),
                    (row.revenue_collected.toFixed(2)).toString(),
                    (referralAmount.toFixed(2)).toString(),
                    _.replace(_.toString(_.map(referralCommission, function (n) {
                        return n.referral_commission
                    })), /,/g, '\n'),
                    row.platform_commission,
                    (row.platform_earning.toFixed(2)).toString(),
                    (row.model_earning.toFixed(2)).toString()
                ])
                count++
            } else if (dataFormatType === 'summary') {
                if (earnings.length === 0) {
                    const object = {
                        new_transaction: newTransactionAmount.toFixed(2),
                        refund: refundAmount.toFixed(2),
                        void: voidAmount.toFixed(2),
                        chargeback: row.chargeback_amount.toFixed(2),
                        net_revenue: row.net_revenue.toFixed(2),
                        revenue_collected: row.revenue_collected.toFixed(2),
                        referral_earning: referralAmount.toFixed(2),
                        platform_earning: row.platform_earning.toFixed(2),
                        model_earning: row.model_earning.toFixed(2),
                        chargeback_count: row.chargeback_count
                    }
                    earnings.push(object)
                } else {
                    element = earnings[0]
                    const object = {
                        new_transaction: Number(element.new_transaction) + Number(newTransactionAmount.toFixed(2)),
                        refund: Number(element.refund) + Number(refundAmount.toFixed(2)),
                        voidAmount: Number(element.void) + Number(voidAmount.toFixed(2)),
                        chargeback: Number(element.chargeback) + Number(row.chargeback_amount.toFixed(2)),
                        net_revenue: Number(element.net_revenue) + Number(row.net_revenue.toFixed(2)),
                        revenue_collected: Number(element.revenue_collected) + Number(row.revenue_collected.toFixed(2)),
                        referral_earning: Number(element.referral_earning) + Number(referralAmount.toFixed(2)),
                        platform_earning: Number(element.platform_earning) + Number(row.platform_earning.toFixed(2)),
                        model_earning: Number(element.model_earning) + Number(row.model_earning.toFixed(2)),
                        chargeback_count: element.chargeback_count + row.chargeback_count
                    }
                    earnings[0] = object
                }
            } else {
                const object = {
                    domain: element.website_url,
                    platform_earning: (row.platform_earning.toFixed(2)).toString(),
                    chargeback_count: row.chargeback_count,
                    model_earning: (row.model_earning.toFixed(2)).toString(),
                    new_transaction: (newTransactionAmount.toFixed(2)).toString(),
                    refund: (refundAmount.toFixed(2)).toString(),
                    void: (voidAmount.toFixed(2)).toString(),
                    chargeback: (row.chargeback_amount.toFixed(2)).toString(),
                    net_revenue: (row.net_revenue.toFixed(2)).toString(),
                    revenue_collected: (row.revenue_collected.toFixed(2)).toString(),
                    referral_earning: (referralAmount.toFixed(2)).toString(),
                    referral_commission: referralCommission,
                    platform_commission: row.platform_commission
                }
                earnings.push(object)
            }
        }
    }
    return earnings
}

// Earning api and function
router.post('/get_earning_report_all_website', protectAdminRoute, async (req, res) => {
    const body = req.body
    const isReferral = _.get(body, 'isReferral', false)
    const withFormula = _.get(body, 'withFormula', false)
    const excludeStoppedWebsites = _.get(body, 'excludeStoppedWebsites', false)
    let query = {}
    const earningReportSelect = _.get(body, 'earningReportSelect', '')

    let earningReportSelectFlag = (earningReportSelect === 'nonWebsiteReferealPayoutReport') ? true : false

    if (isReferral === true && earningReportSelect !== 'nonWebsiteReferealPayoutReport') {
        query.is_referral = isReferral
    }
    let rows = await Website.find(query, 'website_url subscription_sub_account shop_sub_account tip_sub_account model_name is_referral total_referral referral_name referral_commission referral_name1 referral_commission1 referral_name2 referral_commission2 vendor_name referral_type referral_type1 referral_type2 sticky_io_campaign_id payment_gateway is_crypto_payment_enabled')

    let startDate = req.body.startDate
    let endDate = req.body.endDate

    let earningReport = []
    let referralArray = []

    for (let element of rows) {
        let isReferral = (element.is_referral) ? true : false
        let row = await getEarningReport(element.website_url, startDate, endDate)

        if (row !== false) {
            let commission = await getCommissionForDomainForDate(element.website_url, endDate)
            const platform_earning = row.platform_earning || 0
            const platform_profit = parseFloat(platform_earning)

            row['platform_commission'] = (commission === false) ? 0 : commission.platform_commission
            row['ccbill_fees'] = (commission === false || commission === {}) ? 0 : commission.ccbill_fees
            row['subscription_sub_account'] = element.subscription_sub_account
            row['model_name'] = element.model_name
            row['shop_sub_account'] = element.shop_sub_account
            row['tip_sub_account'] = element.tip_sub_account
            row['vendor_name'] = element.vendor_name || ''
            row['platform_profit'] = platform_profit
            row['sticky_io_fees'] = (commission === false || commission === {}) ? 0 : commission.sticky_io_fees
            row['sticky_io_campaign_id'] = element.sticky_io_campaign_id
            row['sticky_io_fixed_fees'] = (commission === false || commission === {}) ? 0 : commission.sticky_io_fixed_fees
            row['payment_gateway'] = element.payment_gateway
            row['forumpay_fees'] = (commission === false || commission === {}) ? 0 : commission.forumpay_transaction_charge

            let referralId = row.referral_history_id

            if (earningReportSelectFlag === false) {
                if (referralId !== '') {
                    let referralDetail = await WebsiteReferralHistory.findOne({ _id: referralId })
                    if (referralDetail !== null) {
                        if (Number(referralDetail.total_referral) === 0) {
                            row['referral_name'] = ''
                            row['referral_percentage'] = ''
                            row.referral_amount = ''
                            row['referral_name1'] = ''
                            row['referral_percentage1'] = ''
                            row.referral_amount1 = ''
                            row['referral_name2'] = ''
                            row['referral_percentage2'] = ''
                            row.referral_amount2 = ''
                        } else if (Number(referralDetail.total_referral) > 0) {
                            const referral_amount = row.referral_amount || 0
                            const referralAmount = referral_amount

                            row.referral_name = referralDetail.referral_name
                            row.referral_percentage = referralDetail.referral_commission
                            row.platform_profit = row.platform_profit - referralAmount
                            if (referralDetail.referral_type === 'domain') {
                                const object = {
                                    source_domain: element.website_url,
                                    destination_domain: referralDetail.referral_name,
                                    referral_percentage: referralDetail.referral_commission,
                                    referral_amount: referralAmount
                                }
                                referralArray.push(object)
                            }
                            if (Number(referralDetail.total_referral) > 1) {
                                const referral_amount1 = row.referral_amount1 || 0
                                const referralAmount1 = referral_amount1

                                row.referral_name1 = referralDetail.referral_name1
                                row.referral_percentage1 = referralDetail.referral_commission1
                                row.platform_profit = row.platform_profit - referralAmount1
                                if (referralDetail.referral_type1 === 'domain') {
                                    const object = {
                                        source_domain: element.website_url,
                                        destination_domain: referralDetail.referral_name1,
                                        referral_percentage: referralDetail.referral_commission1,
                                        referral_amount: referralAmount1
                                    }
                                    referralArray.push(object)
                                }
                                if (Number(referralDetail.total_referral) > 2) {
                                    const referral_amount2 = row.referral_amount2 || 0
                                    const referralAmount2 = referral_amount2

                                    row.referral_name2 = referralDetail.referral_name2
                                    row.referral_percentage2 = referralDetail.referral_commission2
                                    row.platform_profit = row.platform_profit - referralAmount2
                                    if (referralDetail.referral_type2 === 'domain') {
                                        const object = {
                                            source_domain: element.website_url,
                                            destination_domain: referralDetail.referral_name2,
                                            referral_percentage: referralDetail.referral_commission2,
                                            referral_amount: referralAmount2
                                        }
                                        referralArray.push(object)
                                    }
                                }
                            }
                        }
                    }
                }
                if (isReferral === true && earningReportSelect !== 'nonWebsiteReferealPayoutReport' && row.referral_name !== '') {
                    if (excludeStoppedWebsites && row.status === 'removed') {
                        row.subscription_amount > 0 ? row.subscription_amount = 0 : row.subscription_amount
                        row.subscription_refund_amount > 0 ? row.subscription_refund_amount = 0 : row.subscription_refund_amount
                        row.subscription_chargeback_amount > 0 ? row.subscription_chargeback_amount = 0 : row.subscription_chargeback_amount
                        row.subscription_void_amount > 0 ? row.subscription_void_amount = 0 : row.subscription_void_amount
                        row.shop_amount > 0 ? row.shop_amount = 0 : row.shop_amount
                        row.shop_refund_amount > 0 ? row.shop_refund_amount = 0 : row.shop_refund_amount
                        row.shop_chargeback_amount > 0 ? row.shop_chargeback_amount = 0 : row.shop_chargeback_amount
                        row.shop_void_amount > 0 ? row.shop_void_amount = 0 : row.shop_void_amount
                        row.tip_amount > 0 ? row.tip_amount = 0 : row.tip_amount
                        row.tip_refund_amount > 0 ? row.tip_refund_amount = 0 : row.tip_refund_amount
                        row.tip_chargeback_amount > 0 ? row.tip_chargeback_amount = 0 : row.tip_chargeback_amount
                        row.tip_void_amount > 0 ? row.tip_void_amount = 0 : row.tip_void_amount
                        row.gross_revenue > 0 ? row.gross_revenue = 0 : row.gross_revenue
                        row.gross_refund > 0 ? row.gross_refund = 0 : row.gross_refund
                        row.chargeback_penalty > 0 ? row.chargeback_penalty = 0 : row.chargeback_penalty
                        row.refund_amount > 0 ? row.refund_amount = 0 : row.refund_amount
                        row.void_amount > 0 ? row.void_amount = 0 : row.void_amount
                        row.net_revenue > 0 ? row.net_revenue = 0 : row.net_revenue
                        row.ccbill_charge > 0 ? row.ccbill_charge = 0 : row.ccbill_charge
                        row.platform_earning > 0 ? row.platform_earning = 0 : row.platform_earning
                        row.model_earning > 0 ? row.model_earning = 0 : row.model_earning
                        row.referral_amount > 0 ? row.referral_amount = 0 : row.referral_amount
                        row.referral_amount1 > 0 ? row.referral_amount1 = 0 : row.referral_amount1
                        row.referral_amount2 > 0 ? row.referral_amount2 = 0 : row.referral_amount2
                        row.sticky_io_charge > 0 ? row.sticky_io_charge = 0 : row.sticky_io_charge
                        row.referral_amount_for_fixed_charge > 0 ? row.referral_amount_for_fixed_charge = 0 : row.referral_amount_for_fixed_charge
                        row.referral_amount1_for_fixed_charge > 0 ? row.referral_amount1_for_fixed_charge = 0 : row.referral_amount1_for_fixed_charge
                        row.referral_amount2_for_fixed_charge > 0 ? row.referral_amount2_for_fixed_charge = 0 : row.referral_amount2_for_fixed_charge
                        row.sum_of_fixed_model_earning > 0 ? row.sum_of_fixed_model_earning = 0 : row.sum_of_fixed_model_earning
                        row.sum_of_fixed_platform_earning > 0 ? row.sum_of_fixed_platform_earning = 0 : row.sum_of_fixed_platform_earning
                        row.sum_of_revenue_collected_after_fixed_charge > 0 ? row.sum_of_revenue_collected_after_fixed_charge = 0 : row.sum_of_revenue_collected_after_fixed_charge
                        row.sum_of_fixed_gateway_charge > 0 ? row.sum_of_fixed_gateway_charge = 0 : row.sum_of_fixed_gateway_charge
                        row.sum_of_referral_amount_for_fixed_charge > 0 ? row.sum_of_referral_amount_for_fixed_charge = 0 : row.sum_of_referral_amount_for_fixed_charge
                        row.sum_of_referral_amount1_for_fixed_charge > 0 ? row.sum_of_referral_amount1_for_fixed_charge = 0 : row.sum_of_referral_amount1_for_fixed_charge
                        row.sum_of_referral_amount2_for_fixed_charge > 0 ? row.sum_of_referral_amount2_for_fixed_charge = 0 : row.sum_of_referral_amount2_for_fixed_charge
                        row.sticky_io_transaction_cost > 0 ? row.sticky_io_transaction_cost = 0 : row.sticky_io_transaction_cost
                        row.ecsuite_transaction_cost > 0 ? row.ecsuite_transaction_cost = 0 : row.ecsuite_transaction_cost
                        row.spoton_transaction_cost > 0 ? row.spoton_transaction_cost = 0 : row.spoton_transaction_cost
                        row.forumpay_transaction_charge > 0 ? row.forumpay_transaction_charge = 0 : row.forumpay_transaction_charge
                        row.ccbill_fees > 0 ? row.ccbill_fees = 0 : row.ccbill_fees
                        row.platform_profit > 0 ? row.platform_profit = 0 : row.platform_profit
                        row.sticky_io_fees > 0 ? row.sticky_io_fees = 0 : row.sticky_io_fees
                        row.forumpay_fees > 0 ? row.forumpay_fees = 0 : row.forumpay_fees
                        row.revenue_collected > 0 ? row.revenue_collected = 0 : row.revenue_collected
                        row.subscription_chargeback_count > 0 ? row.subscription_chargeback_count = 0 : row.subscription_chargeback_count
                        row.shop_chargeback_count > 0 ? row.shop_chargeback_count = 0 : row.shop_chargeback_count
                        row.tip_chargeback_count > 0 ? row.tip_chargeback_count = 0 : row.tip_chargeback_count
                        earningReport.push(row)
                    } else {
                        earningReport.push(row)
                    }
                } else if (isReferral === false) {
                    if (excludeStoppedWebsites && row.status === 'removed') {
                        row.subscription_amount > 0 ? row.subscription_amount = 0 : row.subscription_amount
                        row.subscription_refund_amount > 0 ? row.subscription_refund_amount = 0 : row.subscription_refund_amount
                        row.subscription_chargeback_amount > 0 ? row.subscription_chargeback_amount = 0 : row.subscription_chargeback_amount
                        row.subscription_void_amount > 0 ? row.subscription_void_amount = 0 : row.subscription_void_amount
                        row.shop_amount > 0 ? row.shop_amount = 0 : row.shop_amount
                        row.shop_refund_amount > 0 ? row.shop_refund_amount = 0 : row.shop_refund_amount
                        row.shop_chargeback_amount > 0 ? row.shop_chargeback_amount = 0 : row.shop_chargeback_amount
                        row.shop_void_amount > 0 ? row.shop_void_amount = 0 : row.shop_void_amount
                        row.tip_amount > 0 ? row.tip_amount = 0 : row.tip_amount
                        row.tip_refund_amount > 0 ? row.tip_refund_amount = 0 : row.tip_refund_amount
                        row.tip_chargeback_amount > 0 ? row.tip_chargeback_amount = 0 : row.tip_chargeback_amount
                        row.tip_void_amount > 0 ? row.tip_void_amount = 0 : row.tip_void_amount
                        row.gross_revenue > 0 ? row.gross_revenue = 0 : row.gross_revenue
                        row.gross_refund > 0 ? row.gross_refund = 0 : row.gross_refund
                        row.chargeback_penalty > 0 ? row.chargeback_penalty = 0 : row.chargeback_penalty
                        row.refund_amount > 0 ? row.refund_amount = 0 : row.refund_amount
                        row.void_amount > 0 ? row.void_amount = 0 : row.void_amount
                        row.net_revenue > 0 ? row.net_revenue = 0 : row.net_revenue
                        row.ccbill_charge > 0 ? row.ccbill_charge = 0 : row.ccbill_charge
                        row.platform_earning > 0 ? row.platform_earning = 0 : row.platform_earning
                        row.model_earning > 0 ? row.model_earning = 0 : row.model_earning
                        row.referral_amount > 0 ? row.referral_amount = 0 : row.referral_amount
                        row.referral_amount1 > 0 ? row.referral_amount1 = 0 : row.referral_amount1
                        row.referral_amount2 > 0 ? row.referral_amount2 = 0 : row.referral_amount2
                        row.sticky_io_charge > 0 ? row.sticky_io_charge = 0 : row.sticky_io_charge
                        row.referral_amount_for_fixed_charge > 0 ? row.referral_amount_for_fixed_charge = 0 : row.referral_amount_for_fixed_charge
                        row.referral_amount1_for_fixed_charge > 0 ? row.referral_amount1_for_fixed_charge = 0 : row.referral_amount1_for_fixed_charge
                        row.referral_amount2_for_fixed_charge > 0 ? row.referral_amount2_for_fixed_charge = 0 : row.referral_amount2_for_fixed_charge
                        row.sum_of_fixed_model_earning > 0 ? row.sum_of_fixed_model_earning = 0 : row.sum_of_fixed_model_earning
                        row.sum_of_fixed_platform_earning > 0 ? row.sum_of_fixed_platform_earning = 0 : row.sum_of_fixed_platform_earning
                        row.sum_of_revenue_collected_after_fixed_charge > 0 ? row.sum_of_revenue_collected_after_fixed_charge = 0 : row.sum_of_revenue_collected_after_fixed_charge
                        row.sum_of_fixed_gateway_charge > 0 ? row.sum_of_fixed_gateway_charge = 0 : row.sum_of_fixed_gateway_charge
                        row.sum_of_referral_amount_for_fixed_charge > 0 ? row.sum_of_referral_amount_for_fixed_charge = 0 : row.sum_of_referral_amount_for_fixed_charge
                        row.sum_of_referral_amount1_for_fixed_charge > 0 ? row.sum_of_referral_amount1_for_fixed_charge = 0 : row.sum_of_referral_amount1_for_fixed_charge
                        row.sum_of_referral_amount2_for_fixed_charge > 0 ? row.sum_of_referral_amount2_for_fixed_charge = 0 : row.sum_of_referral_amount2_for_fixed_charge
                        row.sticky_io_transaction_cost > 0 ? row.sticky_io_transaction_cost = 0 : row.sticky_io_transaction_cost
                        row.ecsuite_transaction_cost > 0 ? row.ecsuite_transaction_cost = 0 : row.ecsuite_transaction_cost
                        row.spoton_transaction_cost > 0 ? row.spoton_transaction_cost = 0 : row.spoton_transaction_cost
                        row.forumpay_transaction_charge > 0 ? row.forumpay_transaction_charge = 0 : row.forumpay_transaction_charge
                        row.ccbill_fees > 0 ? row.ccbill_fees = 0 : row.ccbill_fees
                        row.platform_profit > 0 ? row.platform_profit = 0 : row.platform_profit
                        row.sticky_io_fees > 0 ? row.sticky_io_fees = 0 : row.sticky_io_fees
                        row.forumpay_fees > 0 ? row.forumpay_fees = 0 : row.forumpay_fees
                        row.revenue_collected > 0 ? row.revenue_collected = 0 : row.revenue_collected
                        row.subscription_chargeback_count > 0 ? row.subscription_chargeback_count = 0 : row.subscription_chargeback_count
                        row.shop_chargeback_count > 0 ? row.shop_chargeback_count = 0 : row.shop_chargeback_count
                        row.tip_chargeback_count > 0 ? row.tip_chargeback_count = 0 : row.tip_chargeback_count
                        earningReport.push(row)
                    } else {
                        earningReport.push(row)
                    }
                }
            } else if (earningReportSelectFlag === true) {
                if (referralId !== '') {
                    let referralDetail = await WebsiteReferralHistory.findOne({ _id: referralId })
                    if (referralDetail !== null) {
                        if (Number(referralDetail.total_referral) > 0) {
                            if (referralDetail.referral_type !== 'domain') {
                                const referral_amount = row.referral_amount || 0
                                const referralAmount = referral_amount

                                let findRecord = _.findIndex(earningReport, function (n) {
                                    return (n.referral_name === referralDetail.referral_name) ? n : false
                                })
                                if (findRecord !== -1) {
                                    earningReport[findRecord].vendor_name = earningReport[findRecord].vendor_name + ',' + element.vendor_name
                                    earningReport[findRecord].total_amount += referralAmount
                                    earningReport[findRecord].referral_amount = earningReport[findRecord].referral_amount + ',' + Number(referralAmount).toFixed(2)
                                } else {
                                    let object = {
                                        referral_name: referralDetail.referral_name,
                                        vendor_name: element.vendor_name || '',
                                        referral_amount: Number(referralAmount).toFixed(2),
                                        total_amount: referralAmount
                                    }
                                    earningReport.push(object)
                                }
                            }
                            if (Number(referralDetail.total_referral) > 1) {
                                if (referralDetail.referral_type1 !== 'domain') {
                                    const referral_amount1 = row.referral_amount1 || 0
                                    const referralAmount1 = referral_amount1

                                    let findRecord = _.findIndex(earningReport, function (n) {
                                        return (n.referral_name === referralDetail.referral_name1) ? n : false
                                    })
                                    if (findRecord !== -1) {
                                        earningReport[findRecord].vendor_name = earningReport[findRecord].vendor_name + ',' + element.vendor_name
                                        earningReport[findRecord].total_amount += referralAmount1
                                        earningReport[findRecord].referral_amount = earningReport[findRecord].referral_amount + ',' + Number(referralAmount1).toFixed(2)
                                    } else {
                                        let object = {
                                            referral_name: referralDetail.referral_name1,
                                            vendor_name: element.vendor_name || '',
                                            referral_amount: Number(referralAmount1).toFixed(2),
                                            total_amount: referralAmount1
                                        }
                                        earningReport.push(object)
                                    }
                                }
                                if (Number(referralDetail.total_referral) > 2) {
                                    if (referralDetail.referral_type2 !== 'domain') {
                                        const referral_amount2 = row.referral_amount2 || 0
                                        const referralAmount2 = referral_amount2

                                        let findRecord = _.findIndex(earningReport, function (n) {
                                            return (n.referral_name === referralDetail.referral_name2) ? n : false
                                        })
                                        if (findRecord !== -1) {
                                            earningReport[findRecord].vendor_name = earningReport[findRecord].vendor_name + ',' + element.vendor_name
                                            earningReport[findRecord].total_amount += referralAmount2
                                            earningReport[findRecord].referral_amount = earningReport[findRecord].referral_amount + ',' + Number(referralAmount2).toFixed(2)
                                        } else {
                                            let object = {
                                                referral_name: referralDetail.referral_name2,
                                                vendor_name: element.vendor_name || '',
                                                referral_amount: Number(referralAmount2).toFixed(2),
                                                total_amount: referralAmount2
                                            }
                                            earningReport.push(object)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    let earningReportArray = []
    if (earningReportSelectFlag) {
        let sortEarningReport = _.orderBy(earningReport, ['referral_name'], ['asc'])
        for (let i = 0; i < sortEarningReport.length; i++) {
            let element = sortEarningReport[i]

            let amount = element.total_amount === '' ? '' : formatCurrency(element.total_amount)
            let vendor_name = _.replace(_.toString(element.vendor_name), /,/g, '\n')
            let referral_amount = '$' + _.replace(_.toString(element.referral_amount), /,/g, '\n$')
            earningReportArray.push(
                [
                    i + 1,
                    element.referral_name,
                    vendor_name,
                    referral_amount,
                    amount
                ]
            )
        }
    } else {
        for (let i = 0; i < earningReport.length; i++) {
            let element = earningReport[i]
            let index = i + 2

            let modelEarning = element.model_earning || 0
            let platformEarning = element.platform_earning || 0
            let paymentGatewayCharge = element.sticky_io_charge + element.ccbill_charge + element.forumpay_transaction_charge || 0
            let revenueCollected = element.revenue_collected || 0

            let referral_earning = 0
            let referral_websites
            let referral_commission
            let referral_amounts = 0
            let total_amount = 0
            total_amount += Number(modelEarning)

            let getReferralArray = _.filter(referralArray, function (n) {
                return (n.destination_domain === element.domain) ? n : false
            })

            if (getReferralArray.length > 0) {
                referral_earning = _.sumBy(getReferralArray, function (n) {
                    return n.referral_amount
                })
                referral_websites = _.replace(_.toString(_.map(getReferralArray, function (n) {
                    return n.source_domain
                })), /,/g, '\n')

                referral_commission = _.replace(_.toString(_.map(getReferralArray, function (n) {
                    return n.referral_percentage
                })), /,/g, '\n')

                referral_amounts = _.replace(_.toString(_.map(getReferralArray, function (n) {
                    return n.referral_amount
                })), /,/g, '\n')

                total_amount += Number(referral_earning)
            }

            let referralAmount = 0
            let referralAmount1 = 0
            let referralAmount2 = 0
            if (element.referral_amount !== undefined) {
                const referral_amount = element.referral_amount || 0
                referralAmount = referral_amount
            }

            if (element.referral_amount1 !== undefined) {
                const referral_amount1 = element.referral_amount1 || 0
                referralAmount1 = referral_amount1
            }

            if (element.referral_amount2 !== undefined) {
                const referral_amount2 = element.referral_amount2 || 0
                referralAmount2 = referral_amount2
            }

            earningReportArray.push(
                [
                    element.website_id,
                    element.domain,
                    element.subscription_sub_account,
                    element.shop_sub_account,
                    element.tip_sub_account,
                    element.model_name,
                    element.platform_commission,
                    element.ccbill_fees,
                    (withFormula === true) ? element.subscription_amount.toFixed(2) : formatCurrency(element.subscription_amount),
                    (withFormula === true) ? element.shop_amount.toFixed(2) : formatCurrency(element.shop_amount),
                    (withFormula === true) ? element.tip_amount.toFixed(2) : formatCurrency(element.tip_amount),
                    (withFormula === true) ? element.subscription_refund_amount.toFixed(2) : formatCurrency(element.subscription_refund_amount),
                    (withFormula === true) ? element.shop_refund_amount.toFixed(2) : formatCurrency(element.shop_refund_amount),
                    (withFormula === true) ? element.tip_refund_amount.toFixed(2) : formatCurrency(element.tip_refund_amount),
                    (withFormula === true) ? element.subscription_chargeback_amount.toFixed(2) : formatCurrency(element.subscription_chargeback_amount),
                    (withFormula === true) ? element.shop_chargeback_amount.toFixed(2) : formatCurrency(element.shop_chargeback_amount),
                    (withFormula === true) ? element.tip_chargeback_amount.toFixed(2) : formatCurrency(element.tip_chargeback_amount),
                    element.subscription_chargeback_count,
                    element.shop_chargeback_count,
                    element.tip_chargeback_count,
                    (withFormula === true) ? element.subscription_void_amount.toFixed(2) : formatCurrency(element.subscription_void_amount),
                    (withFormula === true) ? element.shop_void_amount.toFixed(2) : formatCurrency(element.shop_void_amount),
                    (withFormula === true) ? element.tip_void_amount.toFixed(2) : formatCurrency(element.tip_void_amount),
                    (withFormula === true) ? '=I' + index + '+J' + index + '+K' + index : formatCurrency(element.gross_revenue),
                    (withFormula === true) ? '=L' + index + '+M' + index + '+N' + index + '+O' + index + '+P' + index + '+Q' + index + '+U' + index + '+V' + index + '+W' + index : formatCurrency(element.gross_refund),
                    (withFormula === true) ? '=(R' + index + '+S' + index + '+T' + index + ')*25' : formatCurrency(element.chargeback_penalty),
                    (withFormula === true) ? '=X' + index + '-Y' + index + '-Z' + index : formatCurrency(element.net_revenue),
                    (withFormula === true) ? paymentGatewayCharge.toFixed(2) : formatCurrency(paymentGatewayCharge),
                    (withFormula === true) ? revenueCollected.toFixed(2) : formatCurrency(revenueCollected),
                    (withFormula === true) ? platformEarning.toFixed(2) : formatCurrency(platformEarning),
                    (withFormula === true) ? element.platform_profit.toFixed(2) : formatCurrency(element.platform_profit),
                    (withFormula === true) ? '=FIXED(AC' + index + '-AD' + index + ', 2, TRUE)' : formatCurrency(modelEarning),
                    element.vendor_name,
                    element.referral_name,
                    element.referral_percentage,
                    formatCurrency(referralAmount),
                    element.referral_name1,
                    element.referral_percentage1,
                    formatCurrency(referralAmount1),
                    element.referral_name2,
                    element.referral_percentage2,
                    formatCurrency(referralAmount2),
                    formatCurrency(referral_earning),
                    referral_websites,
                    referral_commission,
                    formatCurrency(referral_amounts),
                    formatCurrency(total_amount),
                    element.sticky_io_campaign_id,
                    formatCurrency(element.ccbill_charge),
                    formatCurrency(element.sticky_io_transaction_cost),
                    formatCurrency(element.ecsuite_transaction_cost),
                    formatCurrency(element.spoton_transaction_cost),
                    formatCurrency(element.forumpay_transaction_charge),
                    formatCurrency(paymentGatewayCharge)
                ]
            )
        }
    }

    let path = await generateEarningReportCsv(earningReportArray, earningReportSelectFlag, startDate)
    res.send({ csvUrl: path })
})

/**
 * convert number to string with $ sign and fixed with 2 decimal places
 *
 * @param {number} amount amount
 * @returns {string} $ + amount + tofixed 2
 */
function formatCurrency(amount) {
    return '$' + Number(amount).toFixed(2)
}

async function generateEarningReportCsv(earningReport, earningReportSelectFlag, date, type = 'modelEarning') {
    let paths = path.resolve(`${__dirname}`, './../temp/')
    removeOldCSVFiles(paths)

    let fileName = `${moment(date).format('MMMM-YYYY')}-${uuidv4()}.csv`
    let tempPath = path.resolve(`${__dirname}`, `./../temp/${fileName}`)
    let header = []
    if (type === 'referralEarning') {
        header = ['index', 'Domain', 'New Transaction', 'Refund', 'Void', 'Chargeback', 'Chargeback count', 'Net Revenue', 'Revenue Collected', 'Referral Amount', 'Referral Commission', 'Platform Commission', 'Platform Earning', 'Model Earning']
    } else {
        if (earningReportSelectFlag) {
            header = ['index', 'Referral Name', 'Vender Name', 'Payout', 'Total Payout']
        } else {
            header = ['Id', 'Domain',
                'Subscription Sub Account', 'Shop Sub Account', 'Tip Sub Account',
                'Model Name', 'Platform Commission', 'Ccbill fees',
                'Subscription Gross Amount', 'Shop Gross Amount', 'Tip Gross Amount',
                'Subscription Refund Amount', 'Shop Refund Amount', 'Tip Refund Amount',
                'Subscription Chargeback Amount', 'Shop Chargeback Amount', 'Tip Chargeback Amount',
                'Subscription Chargeback Count', 'Shop Chargeback Count', 'Tip Chargeback Count',
                'Subscription Void Amount', 'Shop Void Amount', 'Tip Void Amount',
                'Gross Revenue', 'Gross Refund', 'Chargeback Penalty',
                'Net Revenue', 'Payment Gateway Charge', 'Revenue Collected',
                'Platform Earning', 'Platform Profit', 'Model Earning', 'Vendor Name',
                'Referral Name 1', 'Referral Percentage 1', 'Referral Amount 1',
                'Referral Name 2', 'Referral Percentage 2', 'Referral Amount 2',
                'Referral Name 3', 'Referral Percentage 3', 'Referral Amount 3',
                'Referral Earnings', 'Referral Websites', 'Referral Commission',
                'Referral Amounts', 'Payout', 'Campaign Id', 'CCBill Charge', 'Sticky.io Charge', 'ECSuite Charge', 'SpotOn Charge', 'ForumPay Charge', 'Total Payment Gateway Charge'
            ]
        }
    }
    const csvWriter = createCsvWriter({
        header: header,
        path: tempPath
    })
    csvWriter.writeRecords(earningReport)
        .then(() => {
        })
    // return '/report/' + fileName
    return fileName
}

router.post('/download_csv', protectAdminRoute, async (req, res) => {
    try {
        const fileName = req.body.file
        if (_.isEmpty(fileName)) {
            res.send({ error: 'file is required' })
            return
        }
        const options = {
            root: path.resolve(__dirname, '../temp'),
            headers: {
                'Content-disposition': `attachment; filename=${fileName}`,
                'x-timestamp': Date.now(),
                'x-sent': true
            }
        }

        res.sendFile(fileName, options, function (error) {
            if (error) {
                console.log(error)
            }
        })
    } catch (error) {
        console.log(error)
    }
})

async function getEarningReport(domain, startDate, endDate, requestFrom) {
    let transactionStartDate = moment(startDate).format('YYYY-MM-DD 00:00:00')
    let transactionEndDate = moment(endDate).format('YYYY-MM-DD 23:59:59')

    let getWebsiteId = await Website.findOne({ website_url: domain }, { website_id: 1, status: 1 })

    const project = {
        subscription_amount: 1,
        subscription_refund_amount: 1,
        subscription_chargeback_amount: 1,
        subscription_chargeback_count: 1,
        subscription_void_amount: 1,
        shop_amount: 1,
        shop_refund_amount: 1,
        shop_chargeback_amount: 1,
        shop_chargeback_count: 1,
        shop_void_amount: 1,
        tip_amount: 1,
        tip_refund_amount: 1,
        tip_chargeback_amount: 1,
        tip_chargeback_count: 1,
        tip_void_amount: 1,
        gross_revenue: 1,
        gross_refund: 1,
        chargeback_amount: 1,
        chargeback_count: 1,
        chargeback_penalty: 1,
        refund_amount: 1,
        void_amount: 1,
        net_revenue: 1,
        ccbill_charge: 1,
        revenue_collected: 1,
        platform_earning: 1,
        model_earning: 1,
        referral_amount: 1,
        referral_amount1: 1,
        referral_amount2: 1,
        referral_history_id: 1,
        link_tracking_referral_history_id: 1,
        sticky_io_charge: 1,
        fixed_sticky_io_charge: 1,
        fixed_model_earning: 1,
        fixed_platform_earning: 1,
        revenue_collected_after_fixed_charge: 1,
        referral_amount_for_fixed_charge: 1,
        referral_amount1_for_fixed_charge: 1,
        referral_amount2_for_fixed_charge: 1,
        sum_of_fixed_model_earning: {
            $cond: [
                {
                    $eq: ['$payment_gateway', 'ccbill']
                },
                '$model_earning',
                '$fixed_model_earning'
            ]
        },
        sum_of_fixed_platform_earning: {
            $cond: [
                {
                    $eq: ['$payment_gateway', 'ccbill']
                },
                '$platform_earning',
                '$fixed_platform_earning'
            ]
        },
        sum_of_revenue_collected_after_fixed_charge: {
            $cond: [
                {
                    $eq: ['$payment_gateway', 'ccbill']
                },
                '$revenue_collected',
                '$revenue_collected_after_fixed_charge'
            ]
        },
        sum_of_fixed_gateway_charge: {
            $cond: [
                {
                    $eq: ['$payment_gateway', 'ccbill']
                },
                '$ccbill_charge',
                '$fixed_sticky_io_charge'
            ]
        },
        sum_of_referral_amount_for_fixed_charge: {
            $cond: [
                {
                    $eq: ['$payment_gateway', 'ccbill']
                },
                '$referral_amount',
                '$referral_amount_for_fixed_charge'
            ]
        },
        sum_of_referral_amount1_for_fixed_charge: {
            $cond: [
                {
                    $eq: ['$payment_gateway', 'ccbill']
                },
                '$referral_amount1',
                '$referral_amount1_for_fixed_charge'
            ]
        },
        sum_of_referral_amount2_for_fixed_charge: {
            $cond: [
                {
                    $eq: ['$payment_gateway', 'ccbill']
                },
                '$referral_amount2',
                '$referral_amount2_for_fixed_charge'
            ]
        },
        platform_commission: 1,
        sticky_io_transaction_cost: {
            $cond: [
                {
                    $eq: ['$payment_gateway', 'ccbill']
                },
                0,
                '$sticky_io_transaction_cost'
            ]
        },
        ecsuite_transaction_cost: {
            $cond: [
                {
                    $eq: ['$sticky_io_payment_gateway', 'ecsuite']
                },
                { $subtract: ['$sticky_io_charge', '$sticky_io_transaction_cost'] },
                0
            ]
        },
        spoton_transaction_cost: {
            $cond: [
                {
                    $eq: ['$sticky_io_payment_gateway', 'spoton']
                },
                { $subtract: ['$sticky_io_charge', '$sticky_io_transaction_cost'] },
                0
            ]
        },
        forumpay_transaction_charge: 1
    }

    let WebsiteDailyEarning = WebsiteDailyEarningReport
    if (requestFrom === 'link-tracking') {
        WebsiteDailyEarning = WebsiteReferralDailyEarningReport
    }

    let dailyEarningAmount = await WebsiteDailyEarning.aggregate([{
        $match: {
            'target_date': { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
            'domain': domain
        }
    },
    {
        $addFields: {
            sticky_io_payment_gateway: {
                $cond: [
                    { $eq: ['$payment_gateway', 'sticky.io'] },
                    { $ifNull: ['$sticky_io_payment_gateway', 'ecsuite'] },
                    '$payment_gateway'
                ]
            }
        }
    },
    { $project: project },
    {
        $group: {
            _id: null,
            'sum_of_fixed_model_earning': { $sum: '$sum_of_fixed_model_earning' },
            'sum_of_fixed_platform_earning': { $sum: '$sum_of_fixed_platform_earning' },
            'sum_of_fixed_gateway_charge': { $sum: '$sum_of_fixed_gateway_charge' },
            'sum_of_revenue_collected_after_fixed_charge': { $sum: '$sum_of_revenue_collected_after_fixed_charge' },
            'sum_of_referral_amount_for_fixed_charge': { $sum: '$sum_of_referral_amount_for_fixed_charge' },
            'sum_of_referral_amount1_for_fixed_charge': { $sum: '$sum_of_referral_amount1_for_fixed_charge' },
            'sum_of_referral_amount2_for_fixed_charge': { $sum: '$sum_of_referral_amount2_for_fixed_charge' },

            'subscription_amount': { '$sum': '$subscription_amount' },
            'subscription_refund_amount': { '$sum': '$subscription_refund_amount' },
            'subscription_chargeback_amount': { '$sum': '$subscription_chargeback_amount' },
            'subscription_chargeback_count': { '$sum': '$subscription_chargeback_count' },
            'subscription_void_amount': { '$sum': '$subscription_void_amount' },

            'shop_amount': { '$sum': '$shop_amount' },
            'shop_refund_amount': { '$sum': '$shop_refund_amount' },
            'shop_chargeback_amount': { '$sum': '$shop_chargeback_amount' },
            'shop_chargeback_count': { '$sum': '$shop_chargeback_count' },
            'shop_void_amount': { '$sum': '$shop_void_amount' },

            'tip_amount': { '$sum': '$tip_amount' },
            'tip_refund_amount': { '$sum': '$tip_refund_amount' },
            'tip_chargeback_amount': { '$sum': '$tip_chargeback_amount' },
            'tip_chargeback_count': { '$sum': '$tip_chargeback_count' },
            'tip_void_amount': { '$sum': '$tip_void_amount' },
            'gross_revenue': { '$sum': '$gross_revenue' },
            'gross_refund': { '$sum': '$gross_refund' },

            'chargeback_amount': { '$sum': '$chargeback_amount' },
            'chargeback_count': { '$sum': '$chargeback_count' },
            'chargeback_penalty': { '$sum': '$chargeback_penalty' },
            'refund_amount': { '$sum': '$refund_amount' },
            'void_amount': { '$sum': '$void_amount' },
            'net_revenue': { '$sum': '$net_revenue' },
            'ccbill_charge': { '$sum': '$ccbill_charge' },
            'revenue_collected': { '$sum': '$revenue_collected' },
            'platform_earning': { '$sum': '$platform_earning' },
            'model_earning': { '$sum': '$model_earning' },
            'referral_amount': { '$sum': '$referral_amount' },
            'referral_amount1': { '$sum': '$referral_amount1' },
            'referral_amount2': { '$sum': '$referral_amount2' },
            'referral_history_id': { '$addToSet': '$referral_history_id' },
            'link_tracking_referral_history_id': { '$addToSet': '$link_tracking_referral_history_id' },
            'sticky_io_charge': { '$sum': '$sticky_io_charge' },
            'fixed_sticky_io_charge': { '$sum': '$fixed_sticky_io_charge' },
            'fixed_model_earning': { '$sum': '$fixed_model_earning' },
            'fixed_platform_earning': { '$sum': '$fixed_platform_earning' },
            'revenue_collected_after_fixed_charge': { '$sum': '$revenue_collected_after_fixed_charge' },
            'referral_amount_for_fixed_charge': { '$sum': '$referral_amount_for_fixed_charge' },
            'referral_amount1_for_fixed_charge': { '$sum': '$referral_amount1_for_fixed_charge' },
            'referral_amount2_for_fixed_charge': { '$sum': '$referral_amount2_for_fixed_charge' },
            'platform_commission': { '$addToSet': '$platform_commission' },
            'sticky_io_transaction_cost': { '$sum': '$sticky_io_transaction_cost' },
            'ecsuite_transaction_cost': { '$sum': '$ecsuite_transaction_cost' },
            'spoton_transaction_cost': { '$sum': '$spoton_transaction_cost' },
            'forumpay_transaction_charge': { '$sum': '$forumpay_transaction_charge' }
        }
    }
    ])

    if (dailyEarningAmount.length > 0) {
        const dailyEarning = dailyEarningAmount[0]
        return {
            website_id: getWebsiteId.website_id,
            domain: domain,
            subscription_amount: dailyEarning.subscription_amount,
            subscription_refund_amount: dailyEarning.subscription_refund_amount,
            subscription_chargeback_amount: dailyEarning.subscription_chargeback_amount,
            subscription_chargeback_count: dailyEarning.subscription_chargeback_count,
            subscription_void_amount: dailyEarning.subscription_void_amount,
            shop_amount: dailyEarning.shop_amount,
            shop_refund_amount: dailyEarning.shop_refund_amount,
            shop_chargeback_amount: dailyEarning.shop_chargeback_amount,
            shop_chargeback_count: dailyEarning.shop_chargeback_count,
            shop_void_amount: dailyEarning.shop_void_amount,
            tip_amount: dailyEarning.tip_amount,
            tip_refund_amount: dailyEarning.tip_refund_amount,
            tip_chargeback_amount: dailyEarning.tip_chargeback_amount,
            tip_chargeback_count: dailyEarning.tip_chargeback_count,
            tip_void_amount: dailyEarning.tip_void_amount,
            gross_revenue: dailyEarning.gross_revenue,
            gross_refund: dailyEarning.gross_refund,
            chargeback_amount: dailyEarning.chargeback_amount,
            chargeback_count: dailyEarning.chargeback_count,
            chargeback_penalty: dailyEarning.chargeback_penalty,
            refund_amount: dailyEarning.refund_amount,
            void_amount: dailyEarning.void_amount,
            net_revenue: dailyEarning.net_revenue,
            ccbill_charge: dailyEarning.ccbill_charge,
            revenue_collected: dailyEarning.revenue_collected,
            platform_earning: dailyEarning.platform_earning,
            model_earning: dailyEarning.model_earning,
            referral_amount: Number(dailyEarning.referral_amount),
            referral_amount1: Number(dailyEarning.referral_amount1),
            referral_amount2: Number(dailyEarning.referral_amount2),
            referral_history_id: (dailyEarning.referral_history_id[0] !== null) ? dailyEarning.referral_history_id[0] : '',
            link_tracking_referral_history_id: (dailyEarning.referral_history_id[0] !== null) ? dailyEarning.link_tracking_referral_history_id[0] : '',
            sticky_io_charge: dailyEarning.sticky_io_charge,
            fixed_sticky_io_charge: dailyEarning.fixed_sticky_io_charge,
            fixed_model_earning: dailyEarning.fixed_model_earning,
            fixed_platform_earning: dailyEarning.fixed_platform_earning,
            revenue_collected_after_fixed_charge: dailyEarning.revenue_collected_after_fixed_charge,
            referral_amount_for_fixed_charge: dailyEarning.referral_amount_for_fixed_charge,
            referral_amount1_for_fixed_charge: dailyEarning.referral_amount1_for_fixed_charge,
            referral_amount2_for_fixed_charge: dailyEarning.referral_amount2_for_fixed_charge,
            sum_of_fixed_model_earning: dailyEarning.sum_of_fixed_model_earning,
            sum_of_fixed_platform_earning: dailyEarning.sum_of_fixed_platform_earning,
            sum_of_revenue_collected_after_fixed_charge: dailyEarning.sum_of_revenue_collected_after_fixed_charge,
            sum_of_fixed_gateway_charge: dailyEarning.sum_of_fixed_gateway_charge,
            sum_of_referral_amount_for_fixed_charge: dailyEarning.sum_of_referral_amount_for_fixed_charge,
            sum_of_referral_amount1_for_fixed_charge: dailyEarning.sum_of_referral_amount1_for_fixed_charge,
            sum_of_referral_amount2_for_fixed_charge: dailyEarning.sum_of_referral_amount2_for_fixed_charge,
            platform_commission: (dailyEarning.platform_commission[0] !== null) ? dailyEarning.platform_commission[0] : '',
            sticky_io_transaction_cost: dailyEarning.sticky_io_transaction_cost,
            ecsuite_transaction_cost: dailyEarning.ecsuite_transaction_cost,
            spoton_transaction_cost: dailyEarning.spoton_transaction_cost,
            forumpay_transaction_charge: dailyEarning.forumpay_transaction_charge,
            status: getWebsiteId.status
        }
    }
    return {
        website_id: getWebsiteId.website_id,
        domain: domain,
        subscription_amount: 0,
        subscription_refund_amount: 0,
        subscription_chargeback_amount: 0,
        subscription_chargeback_count: 0,
        subscription_void_amount: 0,
        shop_amount: 0,
        shop_refund_amount: 0,
        shop_chargeback_amount: 0,
        shop_chargeback_count: 0,
        shop_void_amount: 0,
        tip_amount: 0,
        tip_refund_amount: 0,
        tip_chargeback_amount: 0,
        tip_chargeback_count: 0,
        tip_void_amount: 0,
        gross_revenue: 0,
        gross_refund: 0,
        chargeback_amount: 0,
        chargeback_count: 0,
        chargeback_penalty: 0,
        refund_amount: 0,
        void_amount: 0,
        net_revenue: 0,
        ccbill_charge: 0,
        revenue_collected: 0,
        platform_earning: 0,
        model_earning: 0,
        referral_amount: 0,
        referral_amount1: 0,
        referral_amount2: 0,
        referral_history_id: '',
        link_tracking_referral_history_id: '',
        sticky_io_charge: 0,
        referral_amount_for_fixed_charge: 0,
        referral_amount1_for_fixed_charge: 0,
        referral_amount2_for_fixed_charge: 0,
        sum_of_fixed_model_earning: 0,
        sum_of_fixed_platform_earning: 0,
        sum_of_revenue_collected_after_fixed_charge: 0,
        sum_of_fixed_gateway_charge: 0,
        sum_of_referral_amount_for_fixed_charge: 0,
        sum_of_referral_amount1_for_fixed_charge: 0,
        sum_of_referral_amount2_for_fixed_charge: 0,
        platform_commission: 0,
        sticky_io_transaction_cost: 0,
        ecsuite_transaction_cost: 0,
        spoton_transaction_cost: 0,
        forumpay_transaction_charge: 0,
        status: getWebsiteId.status
    }
}

router.post('/get_daily_earning_report', protectAdminRoute, async (req, res) => {
    const body = req.body
    const domain = _.get(body, 'domain', false)
    const startDate = _.get(body, 'startDate', false)
    const endDate = _.get(body, 'endDate', false)
    let query = {}

    if (domain !== false && domain !== '') {
        query['domain'] = domain
    }

    if (startDate !== false && endDate !== false) {
        const startDateJS = new Date(startDate)
        const endDateJS = new Date(endDate)
        query['target_date'] = { $gte: startDateJS, $lte: endDateJS }
    }

    if (domain === false && startDate === false && endDate === false) {
        let lastRecord = await WebsiteDailyEarningReport.findOne({}, 'target_date').sort({ 'target_date': 'desc' })
        query['target_date'] = { $gte: lastRecord.target_date }
    }

    const totalRows = await WebsiteDailyEarningReport.countDocuments(query)

    let currentPage = parseInt(req.query.page_num, 10)
    let limit = 50
    let totalPages = Math.ceil(totalRows / limit)
    let offset = (currentPage - 1) * limit
    let rows = []
    if (totalRows > 0) {
        rows = await WebsiteDailyEarningReport.aggregate([
            { $match: query },
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
                    _id: 1,
                    domain: 1,
                    target_date: 1,
                    subscription_sub_account: 1,
                    shop_sub_account: 1,
                    tip_sub_account: 1,
                    platform_commission: 1,
                    ccbill_commission: 1,
                    subscription_amount: 1,
                    subscription_refund_amount: 1,
                    subscription_chargeback_amount: 1,
                    subscription_chargeback_count: 1,
                    subscription_void_amount: 1,
                    shop_amount: 1,
                    shop_refund_amount: 1,
                    shop_chargeback_amount: 1,
                    shop_chargeback_count: 1,
                    shop_void_amount: 1,
                    tip_amount: 1,
                    tip_refund_amount: 1,
                    tip_chargeback_amount: 1,
                    tip_chargeback_count: 1,
                    tip_void_amount: 1,
                    gross_revenue: 1,
                    gross_refund: 1,
                    chargeback_amount: 1,
                    chargeback_count: 1,
                    chargeback_penalty: 1,
                    refund_amount: 1,
                    void_amount: 1,
                    net_revenue: 1,
                    ccbill_charge: 1,
                    revenue_collected: 1,
                    platform_earning: 1,
                    model_earning: 1,
                    updated_at: 1,
                    referral_history_id: 1,
                    link_tracking_referral_history_id: 1,
                    referral_amount: 1,
                    referral_amount1: 1,
                    referral_amount2: 1,
                    created_at: 1,
                    'website.website_id': 1,
                    payment_gateway: 1,
                    sticky_io_campaign_id: 1,
                    sticky_io_charge: 1,
                    sticky_io_commission: 1,
                    gateway_charges: 1,
                    sticky_io_transaction_charge: 1,
                    sticky_io_payment_gateway: 1,
                    forumpay_transaction_charge: 1
                }
            }, {
                $sort: { 'target_date': -1 }
            }
        ])
    }

    let rowArray = []
    if (rows.length > 0) {
        for (let element of rows) {
            let object = {
                website_id: element.website.website_id,
                domain: element.domain,
                target_date: element.target_date,
                subscription_sub_account: element.subscription_sub_account,
                shop_sub_account: element.shop_sub_account,
                tip_sub_account: element.tip_sub_account,
                subscription_amount: (element.subscription_amount === 0) ? '$0' : formatCurrency(element.subscription_amount),
                subscription_refund_amount: (element.subscription_refund_amount === 0) ? '$0' : formatCurrency(element.subscription_refund_amount),
                subscription_chargeback_amount: (element.subscription_chargeback_amount === 0) ? '$0' : formatCurrency(element.subscription_chargeback_amount),
                subscription_chargeback_count: (element.subscription_chargeback_count === 0) ? '0' : element.subscription_chargeback_count,
                subscription_void_amount: (element.subscription_void_amount === 0) ? '$0' : formatCurrency(element.subscription_void_amount),
                shop_amount: (element.shop_amount === 0) ? '$0' : formatCurrency(element.shop_amount),
                shop_refund_amount: (element.shop_refund_amount === 0) ? '$0' : formatCurrency(element.shop_refund_amount),
                shop_chargeback_amount: (element.shop_chargeback_amount === 0) ? '$0' : formatCurrency(element.shop_chargeback_amount),
                shop_chargeback_count: (element.shop_chargeback_count === 0) ? '0' : element.shop_chargeback_count,
                shop_void_amount: (element.shop_void_amount === 0) ? '$0' : formatCurrency(element.shop_void_amount),
                tip_amount: (element.tip_amount === 0) ? '$0' : formatCurrency(element.tip_amount),
                tip_refund_amount: (element.tip_refund_amount === 0) ? '$0' : formatCurrency(element.tip_refund_amount),
                tip_chargeback_amount: (element.tip_chargeback_amount === 0) ? '$0' : formatCurrency(element.tip_chargeback_amount),
                tip_chargeback_count: (element.tip_chargeback_count === 0) ? '0' : element.tip_chargeback_count,
                tip_void_amount: (element.tip_void_amount === 0) ? '$0' : formatCurrency(element.tip_void_amount),
                chargeback_amount: (element.chargeback_amount === 0) ? '$0' : formatCurrency(element.chargeback_amount),
                chargeback_count: (element.chargeback_count === 0) ? '0' : element.chargeback_count,
                refund_amount: (element.refund_amount === 0) ? '$0' : formatCurrency(element.refund_amount),
                void_amount: (element.void_amount === 0) ? '$0' : formatCurrency(element.void_amount),
                gross_refund: (element.gross_refund === 0) ? '$0' : formatCurrency(element.gross_refund),
                gross_revenue: (element.gross_revenue === 0) ? '$0' : formatCurrency(element.gross_revenue),
                platform_commission: (element.platform_commission === 0) ? '0' : element.platform_commission,
                ccbill_commission: (element.ccbill_commission === 0) ? '0' : element.ccbill_commission,
                ccbill_charge: (element.ccbill_charge === 0) ? '$0' : formatCurrency(element.ccbill_charge),
                platform_earning: (element.platform_earning === 0) ? '$0' : formatCurrency(element.platform_earning),
                model_earning: (element.model_earning === 0) ? '$0' : formatCurrency(element.model_earning),
                chargeback_penalty: (element.chargeback_penalty === 0) ? '$0' : formatCurrency(element.chargeback_penalty),
                net_revenue: (element.net_revenue === 0) ? '$0' : formatCurrency(element.net_revenue),
                revenue_collected: (element.revenue_collected === 0) ? '$0' : formatCurrency(element.revenue_collected),
                referral_amount: (element.referral_amount === undefined) ? '$0' : formatCurrency(element.referral_amount),
                referral_amount1: (element.referral_amount === undefined) ? '$0' : formatCurrency(element.referral_amount1),
                referral_amount2: (element.referral_amount === undefined) ? '$0' : formatCurrency(element.referral_amount2),
                payment_gateway: element.payment_gateway,
                sticky_io_campaign_id: (element.sticky_io_campaign_id === undefined) ? '' : element.sticky_io_campaign_id,
                sticky_io_charge: (element.sticky_io_charge === 0) ? '$0' : formatCurrency(element.sticky_io_charge),
                sticky_io_commission: (element.sticky_io_commission === 0) ? '0' : element.sticky_io_commission,
                gateway_charges: element.gateway_charges,
                sticky_io_transaction_charge: (element.sticky_io_transaction_charge === undefined) ? '' : element.sticky_io_transaction_charge,
                sticky_io_payment_gateway: (element.sticky_io_payment_gateway === undefined) ? '' : element.sticky_io_payment_gateway,
                forumpay_transaction_charge: (element.forumpay_transaction_charge === undefined) ? '$0' : formatCurrency(element.forumpay_transaction_charge)
            }
            rowArray.push(object)
        }
    }

    return res.send({
        rows: rowArray,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

/**
 * @description Remove old csv from folder
 * @param {string} paths Dir path
 */
function removeOldCSVFiles(paths) {
    fs.readdirSync(paths).forEach(file => {
        if (file !== '.gitignore') {
            fs.stat(paths + '/' + file, function (err, stat) {
                const now = new Date().getTime()
                const endTime = new Date(stat.mtime).getTime() + (60 * 60 * 1000) // 1 hour in milliseconds
                if (err) { return console.error(err) }
                if (now > endTime) {
                    fs.unlinkSync(paths + '/' + file)
                }
            })
        }
    })
}

module.exports = router
