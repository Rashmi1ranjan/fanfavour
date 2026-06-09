const express = require('express')
const router = express.Router()
const moment = require('moment')
const asyncHandler = require('express-async-handler')
const { protectRouteWithRole, SUPER_ADMIN } = require('./../middleware/auth.middleware')
const WebsiteDailyEarningReport = require('../models/WebsiteDailyEarningReport')
const Website = require('../models/Website')
const { successResponse, catchResponse, getDatesArray } = require('../utils/index')
const _ = require('lodash')

/**
 * @description get All active website listing
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/get-earning', protectRouteWithRole([SUPER_ADMIN]), asyncHandler(async (req, res) => {
    try {
        const domain = req.body.domain !== undefined ? req.body.domain : ''
        const payment_gateway = req.body.payment_gateway !== undefined ? req.body.payment_gateway : ''

        const start_date = (req.body.start_date == '') ? moment().subtract(7, 'days').format('MM/DD/YYYY') : req.body.start_date
        const end_date = (req.body.end_date == '') ? moment().subtract(1, 'days').format('MM/DD/YYYY') : req.body.end_date

        const dateStart = moment(start_date, 'MM/DD/YYYY').format('YYYY-MM-DD')
        const dateEnd = moment(end_date, 'MM/DD/YYYY').format('YYYY-MM-DD')

        const allDates = getDatesArray(dateStart, dateEnd)
        const earnings = []
        for (const date of allDates) {
            const start = moment.utc(moment(date, 'YYYY-MM-DD').format('YYYY-MM-DDT00:00:00'))
            const end = moment.utc(moment(date, 'YYYY-MM-DD').format('YYYY-MM-DDT23:59:59'))

            const getEarningByDate = await getWebsiteEarning(start, end, domain, payment_gateway)
            earnings.push(getEarningByDate)
        }

        return successResponse(res, earnings, 'Daily Earning', 200)
    } catch (error) {
        return catchResponse(res, {}, 'Error in website get', 200)
    }
}))

/**
 * @description get All active website total earning
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/get-earning-reports', protectRouteWithRole([SUPER_ADMIN]), asyncHandler(async (req, res) => {
    try {
        const targetDate = (req.body.target_date == '') ? moment().format('YYYY-MM-DD h:mm:ss') : req.body.target_date
        let dateStart = moment(targetDate, 'YYYY-MM-DD h:mm:ss').format('YYYY-MM-DD 00:00:00')
        let dateEnd = moment(targetDate, 'YYYY-MM-DD h:mm:ss').format('YYYY-MM-DD 23:59:59')
        const domain = _.get(req, 'body.domain', '')
        const onLoad = _.get(req, 'body.onLoad', false)

        if (onLoad === true) {
            let lastRecord = await WebsiteDailyEarningReport.findOne({}, 'target_date').sort({ 'target_date': 'desc' })
            let lastRecordTargetDate = moment(lastRecord.target_date).format('YYYY-MM-DD')
            const formatDate = moment(targetDate).format('YYYY-MM-DD')

            if (lastRecordTargetDate < formatDate) {
                dateStart = moment.utc(moment(lastRecordTargetDate, 'YYYY-MM-DD h:mm:ss').format('YYYY-MM-DDT00:00:00'))
                dateEnd = moment.utc(moment(lastRecordTargetDate, 'YYYY-MM-DD h:mm:ss').format('YYYY-MM-DDT23:59:59'))
            }
        }

        const earnings = await getWebsiteEarningReport(dateStart, dateEnd, domain)
        const response = {
            rows: earnings
        }

        return successResponse(res, response, 'Monthly Earning', 200)
    } catch (error) {
        return catchResponse(res, {}, 'Error in earning report generate', 200)
    }
}))

/**
 * @description get All active website total earning
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/get-last-date-for-report', protectRouteWithRole([SUPER_ADMIN]), asyncHandler(async (req, res) => {
    try {
        const lastRecord = await WebsiteDailyEarningReport.findOne({}, 'target_date').sort({ 'target_date': 'desc' })
        const lastRecordTargetDate = moment(lastRecord.target_date).format('YYYY-MM-DD')
        const formatDate = moment(lastRecordTargetDate).format('YYYY-MM-DD')

        const response = { date: formatDate }
        return successResponse(res, response, 'Monthly Last Record Date', 200)
    } catch (error) {
        return catchResponse(res, {}, 'Error in earning report generate', 200)
    }
}))

/**
 * @description Get Website Earning from date, domain and payment Gateway
 * @param {string} start_date Start Date
 * @param {string} end_date End Date
 * @param {string} domain Domain Name
 * @param {string} payment_gateway Payment Gateway name
 * @returns {object} Website earning
 */
async function getWebsiteEarningReport(start_date, end_date, domain = '', payment_gateway = '') {
    const filter = {
        target_date: {
            $gte: new Date(start_date),
            $lte: new Date(end_date)
        }
    }

    if (domain !== '') {
        filter.domain = domain
    }

    if (payment_gateway !== '') {
        filter.payment_gateway = payment_gateway
    }

    const earnings = await WebsiteDailyEarningReport.aggregate([
        { $match: filter },
        {
            $group: {
                _id: {
                    sticky_io_payment_gateway: {
                        $cond: [
                            { $eq: ['$payment_gateway', 'sticky.io'] },
                            { $ifNull: ['$sticky_io_payment_gateway', 'ecsuite'] },
                            '$payment_gateway'
                        ]
                    },
                    payment_gateway: '$payment_gateway'
                },
                new_transaction: {
                    $sum: {
                        $add: ['$subscription_amount', '$shop_amount', '$tip_amount']
                    }
                },
                refund: {
                    $sum: {
                        $add: ['$subscription_refund_amount', '$shop_refund_amount', '$tip_refund_amount']
                    }
                },
                void: {
                    $sum: {
                        $add: ['$subscription_void_amount', '$shop_void_amount', '$tip_void_amount']
                    }
                },
                chargeback: {
                    $sum: {
                        $add: ['$subscription_chargeback_amount', '$shop_chargeback_amount', '$tip_chargeback_amount']
                    }
                },
                net_revenue: { $sum: '$net_revenue' },
                revenue_collected: { $sum: '$revenue_collected' },
                model_earning: { $sum: '$model_earning' },
                sticky_io_transaction_cost: { $sum: '$sticky_io_transaction_cost' },
                payment_gateway_charge: {
                    $sum: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$payment_gateway', 'sticky.io'] }, then: '$sticky_io_charge' },
                                { case: { $eq: ['$payment_gateway', 'forumpay'] }, then: '$forumpay_transaction_charge' }
                            ],
                            default: '$ccbill_charge'
                        }
                    }
                }
            }
        }
    ])

    let Earning = []
    let newTransactionTotal = 0
    let refundTotal = 0
    let voidTotal = 0
    let chargebackTotal = 0
    let netProfitTotal = 0
    let paymentGatewayChargeTotal = 0
    let revenueCollectedTotal = 0
    let stickyIoTransactionCostTotal = 0
    let modelEarningTotal = 0
    if (earnings.length > 0) {
        for (const earning of earnings) {
            if (earning.new_transaction !== 0) {
                newTransactionTotal += Number(earning.new_transaction.toFixed(2))
            }
            if (earning.refund !== 0) {
                refundTotal += Number(earning.refund.toFixed(2))
            }
            if (earning.void !== 0) {
                voidTotal += Number(earning.void.toFixed(2))
            }
            if (earning.chargeback !== 0) {
                chargebackTotal += Number(earning.chargeback)
            }

            if (earning.net_revenue !== 0) {
                netProfitTotal += Number(earning.net_revenue)
            }

            if (earning.revenue_collected !== 0) {
                revenueCollectedTotal += Number(earning.revenue_collected)
            }

            if (earning.payment_gateway_charge !== 0) {
                paymentGatewayChargeTotal += Number(earning.payment_gateway_charge)
            }

            if (earning.sticky_io_transaction_cost !== 0) {
                stickyIoTransactionCostTotal += Number(earning.sticky_io_transaction_cost)
            }

            modelEarningTotal += Number(earning.model_earning)

            const newTransactionAmount = earning.new_transaction !== 0 ? earning.new_transaction.toFixed(2) : '0.00'
            const refundAmount = earning.refund !== 0 ? earning.refund.toFixed(2) : '0.00'
            const voidAmount = earning.void !== 0 ? earning.void.toFixed(2) : '0.00'
            const chargebackAmount = earning.chargeback !== 0 ? earning.chargeback.toFixed(2) : '0.00'
            const netProfitAmount = earning.net_revenue !== 0 ? earning.net_revenue.toFixed(2) : '0.00'
            const revenueCollectedAmount = earning.revenue_collected !== 0 ? earning.revenue_collected.toFixed(2) : '0.00'
            const paymentGatewayAmount = earning.payment_gateway_charge !== 0 ? earning.payment_gateway_charge.toFixed(2) : '0.00'
            const stickyIoCostAmount = earning.sticky_io_transaction_cost !== 0 ? earning.sticky_io_transaction_cost.toFixed(2) : '0.00'
            const modelEarning = earning.model_earning !== 0 ? earning.model_earning.toFixed(2) : '0.00'

            const element = {
                date: moment(start_date).format('YYYY-MM-DD'),
                domain: domain,
                payment_gateway: earning._id,
                new_transaction: Number(newTransactionAmount),
                refund: refundAmount,
                void: voidAmount,
                chargeback: chargebackAmount,
                net_revenue: netProfitAmount,
                revenue_collected: revenueCollectedAmount,
                payment_gateway_charge: paymentGatewayAmount,
                sticky_io_transaction_cost: stickyIoCostAmount,
                model_earning: modelEarning
            }
            Earning.push(element)
        }

        Earning = _.orderBy(Earning, ['new_transaction'], ['desc'])

        refundTotal = Number(refundTotal) !== 0 ? refundTotal.toFixed(2) : '0.00'
        voidTotal = Number(voidTotal) !== 0 ? voidTotal.toFixed(2) : '0.00'
        chargebackTotal = Number(chargebackTotal) !== 0 ? chargebackTotal.toFixed(2) : '0.00'
        netProfitTotal = Number(netProfitTotal) !== 0 ? netProfitTotal.toFixed(2) : '0.00'
        revenueCollectedTotal = Number(revenueCollectedTotal) !== 0 ? revenueCollectedTotal.toFixed(2) : '0.00'
        paymentGatewayChargeTotal = Number(paymentGatewayChargeTotal) !== 0 ? paymentGatewayChargeTotal.toFixed(2) : '0.00'
        stickyIoTransactionCostTotal = Number(stickyIoTransactionCostTotal) !== 0 ? stickyIoTransactionCostTotal.toFixed(2) : '0.00'
        modelEarningTotal = Number(modelEarningTotal) !== 0 ? modelEarningTotal.toFixed(2) : '0.00'

        const objectData = {
            date: '',
            domain: domain,
            payment_gateway: { payment_gateway: 'Total', sticky_io_payment_gateway: 'Total' },
            new_transaction: newTransactionTotal.toFixed(2),
            refund: refundTotal,
            void: voidTotal,
            chargeback: chargebackTotal,
            net_revenue: netProfitTotal,
            revenue_collected: revenueCollectedTotal,
            payment_gateway_charge: paymentGatewayChargeTotal,
            sticky_io_transaction_cost: stickyIoTransactionCostTotal,
            model_earning: modelEarningTotal
        }
        Earning.push(objectData)
    }
    return Earning
}

/**
 * @description get All active website listing
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/get-monthly-earning', protectRouteWithRole([SUPER_ADMIN]), asyncHandler(async (req, res) => {
    try {
        const start_date = (req.body.start_date == '') ? moment().startOf('month').format('YYYY-MM-DD h:mm:ss') : req.body.start_date
        const end_date = (req.body.end_date == '') ? moment().endOf('month').format('YYYY-MM-DD h:mm:ss') : req.body.end_date

        const dateStart = moment(start_date, 'YYYY-MM-DD h:mm:ss').format('YYYY-MM-DD')
        const dateEnd = moment(end_date, 'YYYY-MM-DD h:mm:ss').format('YYYY-MM-DD')
        let websiteWhere = {
            status: { $in: ['live', 'published'] }
        }

        let isWebsiteFilterApply = false
        const domain = _.get(req, 'body.domain', '')
        if (domain !== '') {
            isWebsiteFilterApply = true
            websiteWhere.website_url = domain
        }

        const project = { website_url: 1, website_id: 1 }

        const totalRows = await Website.countDocuments(websiteWhere)

        const currentPage = parseInt(req.query.page_num, 10)
        const limit = 50
        const totalPages = Math.ceil(totalRows / limit)
        const offset = (currentPage - 1) * limit

        const websites = await Website.find(websiteWhere, project).sort({ website_id: 1 }).skip(offset).limit(limit)
        const allMonthlyEarning = []
        for (const website of websites) {
            const earnings = await getWebsiteMonthlyEarning(dateStart, dateEnd, website.website_url, isWebsiteFilterApply)
            allMonthlyEarning.push(...earnings)
        }
        const totalEarning = await getWebsiteMonthlyTotalEarning(dateStart, dateEnd, websiteWhere.website_url)

        const response = {
            rows: allMonthlyEarning,
            totalEarning: totalEarning,
            totalPages: totalPages,
            currentPage: currentPage,
            totalRows: totalRows,
            limit: limit
        }

        return successResponse(res, response, 'Monthly Earning', 200)
    } catch (error) {
        console.log(error)
        return catchResponse(res, {}, 'Error in website get', 200)
    }
}))

/**
 * @description Get Website Earning from date, domain and payment Gateway
 * @param {string} start_date Start Date
 * @param {string} end_date End Date
 * @param {string} domain Domain Name
 * @param {string} payment_gateway Payment Gateway name
 * @returns {object} Website earning
 */
async function getWebsiteEarning(start_date, end_date, domain = '', payment_gateway = '') {
    const filter = {
        target_date: {
            $gte: new Date(start_date),
            $lte: new Date(end_date)
        }
    }

    if (domain !== '') {
        filter.domain = domain
    }

    if (payment_gateway !== '') {
        filter.payment_gateway = payment_gateway
    }

    const earning = await WebsiteDailyEarningReport.aggregate([
        { $match: filter },
        {
            $group: {
                _id: null,
                new_transaction: {
                    $sum: {
                        $add: ['$subscription_amount', '$shop_amount', '$tip_amount']
                    }
                },
                refund: {
                    $sum: {
                        $add: ['$subscription_refund_amount', '$shop_refund_amount', '$tip_refund_amount']
                    }
                },
                void: {
                    $sum: {
                        $add: ['$subscription_void_amount', '$shop_void_amount', '$tip_void_amount']
                    }
                },
                chargeback: {
                    $sum: {
                        $add: ['$subscription_chargeback_amount', '$shop_chargeback_amount', '$tip_chargeback_amount']
                    }
                },
                new_transaction_count: {
                    $sum: {
                        $add: ['$subscription_count', '$shop_count', '$tip_count']
                    }
                },
                chargeback_count: {
                    $sum: {
                        $add: ['$subscription_chargeback_count', '$shop_chargeback_count', '$tip_chargeback_count']
                    }
                },
                refund_transaction_count: {
                    $sum: {
                        $add: ['$subscription_refund_count', '$shop_refund_count', '$tip_refund_count']
                    }
                },
                void_transaction_count: {
                    $sum: {
                        $add: ['$subscription_void_count', '$shop_void_count', '$tip_void_count']
                    }
                }
            }
        }
    ])

    if (earning.length > 0) {
        const dailyEarning = earning[0]
        return {
            date: moment(start_date).format('YYYY-MM-DD'),
            new_transaction: dailyEarning.new_transaction,
            refund: dailyEarning.refund,
            void: dailyEarning.void,
            chargeback: dailyEarning.chargeback,
            new_transaction_count: dailyEarning.new_transaction_count,
            chargeback_count: dailyEarning.chargeback_count,
            refund_transaction_count: dailyEarning.refund_transaction_count,
            void_transaction_count: dailyEarning.void_transaction_count
        }
    }
    return {
        date: moment(start_date).format('YYYY-MM-DD'),
        new_transaction: 0,
        refund: 0,
        void: 0,
        chargeback: 0,
        new_transaction_count: 0,
        chargeback_count: 0,
        refund_transaction_count: 0,
        void_transaction_count: 0
    }
}

/**
 * @description Get Website Earning from date, domain and payment Gateway
 * @param {string} start_date Start Date
 * @param {string} end_date End Date
 * @param {string} domain Domain Name
 * @returns {object} Website earning
 */
async function getWebsiteMonthlyEarning(start_date, end_date, domain) {
    const filter = {
        target_date: {
            $gte: new Date(start_date),
            $lte: new Date(end_date)
        },
        domain: domain
    }

    const earnings = await WebsiteDailyEarningReport.aggregate([
        { $match: filter },
        {
            $addFields: {
                difference_of_actual_and_fixed_sticky_io_charge: { $subtract: ['$sticky_io_charge', '$fixed_sticky_io_charge'] }
            }
        },
        {
            $group: {
                _id: {
                    sticky_io_payment_gateway: {
                        $cond: [
                            { $eq: ['$payment_gateway', 'sticky.io'] },
                            { $ifNull: ['$sticky_io_payment_gateway', 'ecsuite'] },
                            '$payment_gateway'
                        ]
                    },
                    payment_gateway: '$payment_gateway'
                },
                new_transaction: {
                    $sum: {
                        $add: ['$subscription_amount', '$shop_amount', '$tip_amount']
                    }
                },
                refund: {
                    $sum: {
                        $add: ['$subscription_refund_amount', '$shop_refund_amount', '$tip_refund_amount']
                    }
                },
                void: {
                    $sum: {
                        $add: ['$subscription_void_amount', '$shop_void_amount', '$tip_void_amount']
                    }
                },
                chargeback: {
                    $sum: {
                        $add: ['$subscription_chargeback_amount', '$shop_chargeback_amount', '$tip_chargeback_amount']
                    }
                },
                chargeback_count: { $sum: '$chargeback_count' },
                net_revenue: { $sum: '$net_revenue' },
                ccbill_charge: { $sum: '$ccbill_charge' },
                sticky_io_charge: { $sum: '$sticky_io_charge' },
                revenue_collected: { $sum: '$revenue_collected' },
                platform_earning: { $sum: '$platform_earning' },
                model_earning: { $sum: '$model_earning' },
                total_transaction_count: { $sum: '$total_transaction_count' },
                sticky_io_transaction_cost: { $sum: '$sticky_io_transaction_cost' },
                forumpay_transaction_charge: { $sum: '$forumpay_transaction_charge' }
            }
        }
    ])

    const monthlyEarning = []
    if (earnings.length > 0) {
        for (const earning of earnings) {
            monthlyEarning.push({
                date: moment(start_date).format('YYYY-MM'),
                domain: domain,
                payment_gateway: earning._id,
                new_transaction: '$' + earning.new_transaction.toFixed(2),
                refund: '$' + earning.refund.toFixed(2),
                void: '$' + earning.void.toFixed(2),
                chargeback: '$' + earning.chargeback.toFixed(2),
                chargeback_count: earning.chargeback_count,
                net_revenue: '$' + earning.net_revenue.toFixed(2),
                ccbill_charge: '$' + earning.ccbill_charge.toFixed(2),
                sticky_io_charge: '$' + earning.sticky_io_charge.toFixed(2),
                revenue_collected: '$' + earning.revenue_collected.toFixed(2),
                platform_earning: '$' + earning.platform_earning.toFixed(2),
                model_earning: '$' + earning.model_earning.toFixed(2),
                total_transaction_count: earning.total_transaction_count,
                sticky_io_transaction_cost: '$' + earning.sticky_io_transaction_cost.toFixed(2),
                forumpay_transaction_charge: '$' + earning.forumpay_transaction_charge.toFixed(2)
            })
        }
    } else {
        monthlyEarning.push({
            date: moment(start_date).format('YYYY-MM'),
            domain: domain,
            payment_gateway: '',
            new_transaction: '$0.00',
            refund: '$0.00',
            void: '$0.00',
            chargeback: '$0.00',
            chargeback_count: 0,
            net_revenue: '$0.00',
            ccbill_charge: '$0.00',
            sticky_io_charge: '$0.00',
            revenue_collected: '$0.00',
            platform_earning: '$0.00',
            model_earning: '$0.00',
            total_transaction_count: 0,
            sticky_io_transaction_cost: '$0.00',
            forumpay_transaction_charge: '$0.00'
        })
    }
    return monthlyEarning
}

async function getWebsiteMonthlyTotalEarning(start_date, end_date, domain = '') {
    const filter = {
        target_date: {
            $gte: new Date(start_date),
            $lte: new Date(end_date)
        }
    }
    if (domain !== '') {
        filter.domain = domain
    }
    const totalMonthlyEarnings = await WebsiteDailyEarningReport.aggregate([
        { $match: filter },
        {
            $group: {
                _id: {
                    payment_gateway: 'total'
                },
                new_transaction: {
                    $sum: {
                        $add: ['$subscription_amount', '$shop_amount', '$tip_amount']
                    }
                },
                refund: {
                    $sum: {
                        $add: ['$subscription_refund_amount', '$shop_refund_amount', '$tip_refund_amount']
                    }
                },
                void: {
                    $sum: {
                        $add: ['$subscription_void_amount', '$shop_void_amount', '$tip_void_amount']
                    }
                },
                chargeback: {
                    $sum: {
                        $add: ['$subscription_chargeback_amount', '$shop_chargeback_amount', '$tip_chargeback_amount']
                    }
                },
                chargeback_count: { $sum: '$chargeback_count' },
                net_revenue: { $sum: '$net_revenue' },
                ccbill_charge: { $sum: '$ccbill_charge' },
                sticky_io_charge: { $sum: '$sticky_io_charge' },
                revenue_collected: { $sum: '$revenue_collected' },
                platform_earning: { $sum: '$platform_earning' },
                model_earning: { $sum: '$model_earning' },
                total_transaction_count: { $sum: '$total_transaction_count' },
                sticky_io_transaction_cost: { $sum: '$sticky_io_transaction_cost' },
                forumpay_transaction_charge: { $sum: '$forumpay_transaction_charge' }
            }
        }
    ])

    const totalEarning = []
    if (totalMonthlyEarnings.length > 0) {
        for (const earning of totalMonthlyEarnings) {
            totalEarning.push({
                date: moment(start_date).format('YYYY-MM'),
                domain: 'Total',
                payment_gateway: earning._id,
                new_transaction: '$' + earning.new_transaction.toFixed(2),
                refund: '$' + earning.refund.toFixed(2),
                void: '$' + earning.void.toFixed(2),
                chargeback: '$' + earning.chargeback.toFixed(2),
                chargeback_count: earning.chargeback_count,
                net_revenue: '$' + earning.net_revenue.toFixed(2),
                ccbill_charge: '$' + earning.ccbill_charge.toFixed(2),
                sticky_io_charge: '$' + earning.sticky_io_charge.toFixed(2),
                revenue_collected: '$' + earning.revenue_collected.toFixed(2),
                platform_earning: '$' + earning.platform_earning.toFixed(2),
                model_earning: '$' + earning.model_earning.toFixed(2),
                total_transaction_count: earning.total_transaction_count,
                sticky_io_transaction_cost: '$' + earning.sticky_io_transaction_cost.toFixed(2),
                forumpay_transaction_charge: '$' + earning.forumpay_transaction_charge.toFixed(2)
            })
        }
    }

    return totalEarning
}

module.exports = router
