const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const moment = require('moment')
const _ = require('lodash')
const logger = require('./../config/winston')
const TransactionReports = require('./../models/CCBillTransactionReports')
const TransactionApiQueue = require('./../models/TransactionApiQueue')
const WebsiteDailyEarningReport = require('../models/WebsiteDailyEarningReport')

router.post('/add_transaction_queue', (req, res) => {
    let startDateTime = moment(req.body.start_date).startOf().format('YYYYMMDDHHmmss')
    let endDateTime = moment(req.body.end_date).endOf().format('YYYYMMDDHHmmss')

    TransactionApiQueue.find({ start_date_timestamp: startDateTime, end_date_timestamp: endDateTime }).then(queue => {
        if (queue.length == 0) {
            logger.info('Adding Data in Queue')
            const obj = {
                start_date_timestamp: startDateTime,
                end_date_timestamp: endDateTime
            }

            let transactionApiQueue = new TransactionApiQueue(obj)

            transactionApiQueue.save().then(() => {

            })
        }
    })

    return res.send('Data Added')
})

router.post('/get_transactions_details_new', asyncHandler(async (req, res) => {
    let latestTransaction = await TransactionReports.findOne({}, 'pcp_transaction_date').sort({ 'pcp_transaction_date': 'desc' })
    let date = latestTransaction.pcp_transaction_date
    let yesterday = moment(date).format('YYYY-MM-DD 00:00:00')
    let startDate = moment(yesterday).startOf('month').format('YYYY-MM-DD HH:mm:ss')
    let endDate = moment(yesterday).endOf('month').format('YYYY-MM-DD HH:mm:ss')
    let previousMonthStartDate = moment(yesterday).subtract(1, 'months').startOf('month').format('YYYY-MM-DD HH:mm:ss')
    let previousMonthEndDate = moment(yesterday).subtract(1, 'months').endOf('month').format('YYYY-MM-DD HH:mm:ss')

    yesterday = new Date(yesterday)
    startDate = new Date(startDate)
    endDate = new Date(endDate)
    previousMonthStartDate = new Date(previousMonthStartDate)
    previousMonthEndDate = new Date(previousMonthEndDate)

    let yestarday_day = moment(yesterday).format('MMM D')
    let current_month = moment(startDate).format('MMM YYYY')
    let previous_month = moment(previousMonthStartDate).format('MMM YYYY')

    let yesterdaysEarning = await getModelEarning({ $gte: yesterday }, req, 'pcp_model_earnings')
    let currentMonthEarnings = await getModelEarning({ $gte: startDate, $lte: endDate }, req, 'pcp_model_earnings')
    let previousMonthEarnings = await getModelEarning({ $gte: previousMonthStartDate, $lte: previousMonthEndDate }, req, 'pcp_model_earnings')
    let totalEarnings = await getModelEarning({}, req, 'pcp_model_earnings')

    let yesterdaysRefunds = await getModelRefunds({ $gte: yesterday }, req, 'pcp_model_earnings')
    let currentMonthRefunds = await getModelRefunds({ $gte: startDate, $lte: endDate }, req, 'pcp_model_earnings')
    let previousMonthRefunds = await getModelRefunds({ $gte: previousMonthStartDate, $lte: previousMonthEndDate }, req, 'pcp_model_earnings')
    let totalRefunds = await getModelRefunds({}, req, 'pcp_model_earnings')

    let yesterdaysModelTotalChargeback = await getChargeback({ $gte: yesterday }, req)
    let currentMonthsModelTotalChargeback = await getChargeback({ $gte: startDate, $lte: endDate }, req)
    let previousMonthChargeback = await getChargeback({ $gte: previousMonthStartDate, $lte: previousMonthEndDate }, req)
    let totalModelTotalChargeback = await getChargeback({}, req)

    yesterdaysEarning -= yesterdaysRefunds
    currentMonthEarnings -= currentMonthRefunds
    previousMonthEarnings -= previousMonthRefunds
    totalEarnings -= totalRefunds

    let yesterdaysModelsChargeback = yesterdaysModelTotalChargeback * 0.5
    let currentMonthsModelsChargeback = currentMonthsModelTotalChargeback * 0.5
    let previousMonthsModelsChargeback = previousMonthChargeback * 0.5
    let totalModelsChargeback = totalModelTotalChargeback * 0.5

    yesterdaysEarning -= yesterdaysModelsChargeback
    currentMonthEarnings -= currentMonthsModelsChargeback
    previousMonthEarnings -= previousMonthsModelsChargeback
    totalEarnings -= totalModelsChargeback

    let resData = {
        yesterdaysEarning,
        currentMonthEarnings,
        previousMonthEarnings,
        totalEarnings,
        yestarday_day,
        current_month,
        previous_month
    }

    return res.send(resData)
}))

router.post('/get_all_transactions_details_new', asyncHandler(async (req, res) => {
    let latestTransaction = await TransactionReports.findOne({}, 'pcp_transaction_date').sort({ 'pcp_transaction_date': 'desc' })
    let date = latestTransaction.pcp_transaction_date
    let yesterday = moment(date).format('YYYY-MM-DD 00:00:00')
    let startDate = moment(yesterday).startOf('month').format('YYYY-MM-DD HH:mm:ss')
    let endDate = moment(yesterday).endOf('month').format('YYYY-MM-DD HH:mm:ss')
    yesterday = new Date(yesterday)
    startDate = new Date(startDate)
    endDate = new Date(endDate)

    let yesterdaysModelEarnings = await getModelEarning({ $gte: yesterday }, req, 'pcp_model_earnings')
    let currentMonthModelEarnings = await getModelEarning({ $gte: startDate, $lte: endDate }, req, 'pcp_model_earnings')
    let totalModelEarnings = await getModelEarning({}, req, 'pcp_model_earnings')

    let yesterdaysPlatformEarnings = await getModelEarning({ $gte: yesterday }, req, 'pcp_platform_commission')
    let currentMonthPlatformEarnings = await getModelEarning({ $gte: startDate, $lte: endDate }, req, 'pcp_platform_commission')
    let totalPlatformEarnings = await getModelEarning({}, req, 'pcp_platform_commission')

    let yesterdaysCCBillEarnings = await getModelEarning({ $gte: yesterday }, req, 'pcp_ccbill_charge')
    let currentMonthCBillEarnings = await getModelEarning({ $gte: startDate, $lte: endDate }, req, 'pcp_ccbill_charge')
    let totalCCBillEarnings = await getModelEarning({}, req, 'pcp_ccbill_charge')

    let yesterdaysTotalEarnings = await getModelEarning({ $gte: yesterday }, req, 'accounting_amount')
    let currentMonthTotalEarnings = await getModelEarning({ $gte: startDate, $lte: endDate }, req, 'accounting_amount')
    let totalLifetimeEarnings = await getModelEarning({}, req, 'accounting_amount')

    let yesterdaysModelRefunds = await getModelRefunds({ $gte: yesterday }, req, 'pcp_model_earnings')
    let currentMonthModelRefunds = await getModelRefunds({ $gte: startDate, $lte: endDate }, req, 'pcp_model_earnings')
    let totalModelRefunds = await getModelRefunds({}, req, 'pcp_model_earnings')

    let yesterdaysPlatformRefunds = await getModelRefunds({ $gte: yesterday }, req, 'pcp_platform_commission')
    let currentMonthPlatformRefunds = await getModelRefunds({ $gte: startDate, $lte: endDate }, req, 'pcp_platform_commission')
    let totalPlatformRefunds = await getModelRefunds({}, req, 'pcp_platform_commission')

    let yesterdaysCCBillRefunds = await getModelRefunds({ $gte: yesterday }, req, 'pcp_ccbill_charge')
    let currentMonthCBillRefunds = await getModelRefunds({ $gte: startDate, $lte: endDate }, req, 'pcp_ccbill_charge')
    let totalCCBillRefunds = await getModelRefunds({}, req, 'pcp_ccbill_charge')

    let yesterdaysTotalRefunds = await getModelRefunds({ $gte: yesterday }, req, 'accounting_amount')
    let currentMonthTotalRefunds = await getModelRefunds({ $gte: startDate, $lte: endDate }, req, 'accounting_amount')
    let totalLifetimeRefunds = await getModelRefunds({}, req, 'accounting_amount')

    let yesterdaysModelTotalChargeback = await getChargeback({ $gte: yesterday }, req)
    let currentMonthsModelTotalChargeback = await getChargeback({ $gte: startDate, $lte: endDate }, req)
    let totalModelTotalChargeback = await getChargeback({}, req)

    let yesterdaysTotalChargeback = await getChargeback({ $gte: yesterday }, req)
    let currentMonthsTotalChargeback = await getChargeback({ $gte: startDate, $lte: endDate }, req)
    let totalLifetimeChargeback = await getChargeback({}, req)

    yesterdaysModelEarnings -= yesterdaysModelRefunds
    currentMonthModelEarnings -= currentMonthModelRefunds
    totalModelEarnings -= totalModelRefunds
    yesterdaysPlatformEarnings -= yesterdaysPlatformRefunds
    currentMonthPlatformEarnings -= currentMonthPlatformRefunds
    totalPlatformEarnings -= totalPlatformRefunds
    yesterdaysCCBillEarnings -= yesterdaysCCBillRefunds
    currentMonthCBillEarnings -= currentMonthCBillRefunds
    totalCCBillEarnings -= totalCCBillRefunds
    yesterdaysTotalEarnings -= yesterdaysTotalRefunds
    currentMonthTotalEarnings -= currentMonthTotalRefunds
    totalLifetimeEarnings -= totalLifetimeRefunds

    let yesterdaysChargeback = yesterdaysModelTotalChargeback * 0.5
    let currentMonthsChargeback = currentMonthsModelTotalChargeback * 0.5
    let totalChargeback = totalModelTotalChargeback * 0.5

    yesterdaysModelEarnings -= yesterdaysChargeback
    currentMonthModelEarnings -= currentMonthsChargeback
    totalModelEarnings -= totalChargeback

    yesterdaysPlatformEarnings -= yesterdaysChargeback
    currentMonthPlatformEarnings -= currentMonthsChargeback
    totalPlatformEarnings -= totalChargeback

    yesterdaysTotalEarnings -= yesterdaysTotalChargeback
    currentMonthTotalEarnings -= currentMonthsTotalChargeback
    totalLifetimeEarnings -= totalLifetimeChargeback

    let resData = {
        yesterdaysModelEarnings,
        currentMonthModelEarnings,
        totalModelEarnings,
        yesterdaysPlatformEarnings,
        currentMonthPlatformEarnings,
        totalPlatformEarnings,
        yesterdaysCCBillEarnings,
        currentMonthCBillEarnings,
        totalCCBillEarnings,
        yesterdaysTotalEarnings,
        currentMonthTotalEarnings,
        totalLifetimeEarnings
    }

    return res.send(resData)
}))

router.post('/get_total_transactions_details_new', asyncHandler(async (req, res) => {
    let latestTransaction = await TransactionReports.findOne({}, 'pcp_transaction_date').sort({ 'pcp_transaction_date': 'desc' })
    let date = latestTransaction.pcp_transaction_date
    let yesterday = moment(date).format('YYYY-MM-DD 00:00:00')
    let startDate = moment(yesterday).startOf('month').format('YYYY-MM-DD HH:mm:ss')
    let endDate = moment(yesterday).endOf('month').format('YYYY-MM-DD HH:mm:ss')
    let previousMonthStartDate = moment(yesterday).subtract(1, 'months').startOf('month').format('YYYY-MM-DD HH:mm:ss')
    let previousMonthEndDate = moment(yesterday).subtract(1, 'months').endOf('month').format('YYYY-MM-DD HH:mm:ss')

    yesterday = new Date(yesterday)
    startDate = new Date(startDate)
    endDate = new Date(endDate)
    previousMonthStartDate = new Date(previousMonthStartDate)
    previousMonthEndDate = new Date(previousMonthEndDate)

    let yesterdaysGrossRevenue = await getModelEarning({ $gte: yesterday }, req, 'accounting_amount')
    let currentMonthsGrossRevenue = await getModelEarning({ $gte: startDate, $lte: endDate }, req, 'accounting_amount')
    let previousMonthGrossRevenue = await getModelEarning({ $gte: previousMonthStartDate, $lte: previousMonthEndDate }, req, 'accounting_amount')

    let yesterdaysTotalRefunds = await getModelRefunds({ $gte: yesterday }, req, 'accounting_amount')
    let currentMonthTotalRefunds = await getModelRefunds({ $gte: startDate, $lte: endDate }, req, 'accounting_amount')
    let previousMonthTotalRefunds = await getModelRefunds({ $gte: previousMonthStartDate, $lte: previousMonthEndDate }, req, 'accounting_amount')

    let yesterdaysTotalChargeback = await getChargeback({ $gte: yesterday }, req)
    let currentMonthsTotalChargeback = await getChargeback({ $gte: startDate, $lte: endDate }, req)
    let previousMonthsTotalChargeback = await getChargeback({ $gte: previousMonthStartDate, $lte: previousMonthEndDate }, req)

    yesterdaysGrossRevenue -= yesterdaysTotalRefunds
    currentMonthsGrossRevenue -= currentMonthTotalRefunds
    previousMonthGrossRevenue -= previousMonthTotalRefunds

    yesterdaysGrossRevenue -= yesterdaysTotalChargeback
    currentMonthsGrossRevenue -= currentMonthsTotalChargeback
    previousMonthGrossRevenue -= previousMonthsTotalChargeback

    let resData = {
        yesterdaysGrossRevenue,
        currentMonthsGrossRevenue,
        previousMonthGrossRevenue
    }

    return res.send(resData)
}))

router.post('/get_model_earnings_new', asyncHandler(async (req, res) => {
    let websiteUrl = new URL(req.body.website_url)
    let domain = websiteUrl.hostname
    const payment_gateway = req.body.payment_gateway === 'hybrid' ? { $in: ['ccbill', 'sticky.io', 'forumpay'] } : { $in: [req.body.payment_gateway, 'forumpay'] }
    let latestTransaction = await WebsiteDailyEarningReport.findOne({ payment_gateway }, 'target_date payment_gateway').sort({ 'target_date': 'desc' })


    let date = latestTransaction.target_date
    let yesterday = moment(date).format('YYYY-MM-DD 00:00:00')
    let yesterdayEnd = moment(date).format('YYYY-MM-DD 23:59:59')
    let startDate = moment(yesterday).startOf('month').format('YYYY-MM-DD HH:mm:ss')
    let endDate = moment(yesterday).endOf('month').format('YYYY-MM-DD HH:mm:ss')
    let previousMonthStartDate = moment(yesterday).subtract(1, 'months').startOf('month').format('YYYY-MM-DD HH:mm:ss')
    let previousMonthEndDate = moment(yesterday).subtract(1, 'months').endOf('month').format('YYYY-MM-DD HH:mm:ss')

    yesterday = new Date(yesterday)
    yesterdayEnd = new Date(yesterdayEnd)
    startDate = new Date(startDate)
    endDate = new Date(endDate)
    previousMonthStartDate = new Date(previousMonthStartDate)
    previousMonthEndDate = new Date(previousMonthEndDate)

    let yestarday_day = moment(yesterday).format('MMM D')
    let current_month = moment(startDate).format('MMM YYYY')
    let previous_month = moment(previousMonthStartDate).format('MMM YYYY')

    const dates = { yesterday, yesterdayEnd, startDate, endDate, previousMonthStartDate, previousMonthEndDate, domain }

    const ccbillEarning = await getWebsiteModelEarning(dates, 'model_earning', 'ccbill')
    const stickyIoEarning = await getWebsiteModelEarning(dates, 'model_earning', 'sticky.io')
    const forumPayEarning = await getWebsiteModelEarning(dates, 'model_earning', 'forumpay')

    let yesterdaysEarning = ccbillEarning.yesterdays + stickyIoEarning.yesterdays + forumPayEarning.yesterdays
    let currentMonthEarnings = ccbillEarning.currentMonths + stickyIoEarning.currentMonths + forumPayEarning.currentMonths
    let previousMonthEarnings = ccbillEarning.previousMonths + stickyIoEarning.previousMonths + forumPayEarning.previousMonths
    const totalEarnings = ccbillEarning.totals + stickyIoEarning.totals + forumPayEarning.totals

    const septMonthStart = moment().format('2023-09-01T00:00:00')
    if (domain === 'pandorakaaki.com' && moment(yesterday).isBefore(septMonthStart)) {
        yesterdaysEarning = 0
        currentMonthEarnings = 0
        previousMonthEarnings = 0
    }

    if (domain === 'pandorakaaki.com' && moment(previousMonthStartDate).isBefore(septMonthStart)) {
        previousMonthEarnings = 0
    }

    const resData = {
        yesterdaysEarning,
        currentMonthEarnings,
        previousMonthEarnings,
        totalEarnings,
        yestarday_day,
        current_month,
        previous_month
    }

    return res.send(resData)
}))

/**
 * @description Calculate earning of website
 * @param {object} data date and domain object
 * @param {string} key key name for calculation
 * @param {string} payment_gateway payment Gateway
 * @returns {object} earning calculations
 */
async function getWebsiteModelEarning(data, key, payment_gateway) {
    const { yesterday, yesterdayEnd, startDate, endDate, previousMonthStartDate, previousMonthEndDate, domain } = data
    const yesterdays = await calculateModelEarningByPaymentGateway({ $gte: yesterday, $lte: yesterdayEnd }, domain, key, payment_gateway)
    const currentMonths = await calculateModelEarningByPaymentGateway({ $gte: startDate, $lte: endDate }, domain, key, payment_gateway)
    const previousMonths = await calculateModelEarningByPaymentGateway({ $gte: previousMonthStartDate, $lte: previousMonthEndDate }, domain, key, payment_gateway)
    const totals = await calculateModelEarningByPaymentGateway({}, domain, key, payment_gateway)

    return { yesterdays, currentMonths, previousMonths, totals }
}

router.post('/get_gross_earning_new', asyncHandler(async (req, res) => {
    let websiteUrl = new URL(req.body.website_url)
    let domain = websiteUrl.hostname
    const payment_gateway = req.body.payment_gateway === 'hybrid' ? { $in: ['ccbill', 'sticky.io', 'forumpay'] } : { $in: [req.body.payment_gateway, 'forumpay'] }

    let latestTransaction = await WebsiteDailyEarningReport.findOne({ payment_gateway }, 'target_date payment_gateway').sort({ 'target_date': 'desc' })
    let date = latestTransaction.target_date
    let yesterday = moment(date).format('YYYY-MM-DD 00:00:00')
    let yesterdayEnd = moment(date).format('YYYY-MM-DD 23:59:59')
    let startDate = moment(yesterday).startOf('month').format('YYYY-MM-DD HH:mm:ss')
    let endDate = moment(yesterday).endOf('month').format('YYYY-MM-DD HH:mm:ss')
    let previousMonthStartDate = moment(yesterday).subtract(1, 'months').startOf('month').format('YYYY-MM-DD HH:mm:ss')
    let previousMonthEndDate = moment(yesterday).subtract(1, 'months').endOf('month').format('YYYY-MM-DD HH:mm:ss')

    yesterday = new Date(yesterday)
    yesterdayEnd = new Date(yesterdayEnd)
    startDate = new Date(startDate)
    endDate = new Date(endDate)
    previousMonthStartDate = new Date(previousMonthStartDate)
    previousMonthEndDate = new Date(previousMonthEndDate)

    let yesterdaysGrossRevenue = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, 'net_revenue')
    let currentMonthsGrossRevenue = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, 'net_revenue')
    let previousMonthGrossRevenue = await getModelEarningNew({ $gte: previousMonthStartDate, $lte: previousMonthEndDate }, domain, 'net_revenue')

    let resData = {
        yesterdaysGrossRevenue,
        currentMonthsGrossRevenue,
        previousMonthGrossRevenue
    }

    return res.send(resData)
}))

router.post('/get_gross_earning_after_ccbill_fees', asyncHandler(async (req, res) => {
    let websiteUrl = new URL(req.body.website_url)
    let domain = websiteUrl.hostname
    const payment_gateway = req.body.payment_gateway === 'hybrid' ? { $in: ['ccbill', 'sticky.io', 'forumpay'] } : { $in: [req.body.payment_gateway, 'forumpay'] }

    let latestTransaction = await WebsiteDailyEarningReport.findOne({ payment_gateway }, 'target_date payment_gateway').sort({ 'target_date': 'desc' })
    let date = latestTransaction.target_date
    let yesterday = moment(date).format('YYYY-MM-DD 00:00:00')
    let yesterdayEnd = moment(date).format('YYYY-MM-DD 23:59:59')
    let startDate = moment(yesterday).startOf('month').format('YYYY-MM-DD HH:mm:ss')
    let endDate = moment(yesterday).endOf('month').format('YYYY-MM-DD HH:mm:ss')
    let previousMonthStartDate = moment(yesterday).subtract(1, 'months').startOf('month').format('YYYY-MM-DD HH:mm:ss')
    let previousMonthEndDate = moment(yesterday).subtract(1, 'months').endOf('month').format('YYYY-MM-DD HH:mm:ss')

    yesterday = new Date(yesterday)
    yesterdayEnd = new Date(yesterdayEnd)
    startDate = new Date(startDate)
    endDate = new Date(endDate)
    previousMonthStartDate = new Date(previousMonthStartDate)
    previousMonthEndDate = new Date(previousMonthEndDate)

    const dates = { yesterday, yesterdayEnd, startDate, endDate, previousMonthStartDate, previousMonthEndDate, domain }

    const ccbillGrossRevenueAfterCCBillFees = await getWebsiteModelEarning(dates, 'revenue_collected', 'ccbill')
    const stickyIoGrossRevenueAfterStickyIoFees = await getWebsiteModelEarning(dates, 'revenue_collected_after_fixed_charge', 'sticky.io')
    const forumPayGrossRevenueAfterStickyIoFees = await getWebsiteModelEarning(dates, 'revenue_collected', 'forumpay')

    const yesterdaysGrossRevenueAfterCCBillFees = ccbillGrossRevenueAfterCCBillFees.yesterdays + stickyIoGrossRevenueAfterStickyIoFees.yesterdays + forumPayGrossRevenueAfterStickyIoFees.yesterdays
    const currentMonthsGrossRevenueAfterCCBillFees = ccbillGrossRevenueAfterCCBillFees.currentMonths + stickyIoGrossRevenueAfterStickyIoFees.currentMonths + forumPayGrossRevenueAfterStickyIoFees.currentMonths
    const previousMonthGrossRevenueAfterCCBillFees = ccbillGrossRevenueAfterCCBillFees.previousMonths + stickyIoGrossRevenueAfterStickyIoFees.previousMonths + forumPayGrossRevenueAfterStickyIoFees.previousMonths

    let resData = {
        yesterdaysGrossRevenueAfterCCBillFees,
        currentMonthsGrossRevenueAfterCCBillFees,
        previousMonthGrossRevenueAfterCCBillFees
    }

    return res.send(resData)
}))

router.post('/get_all_earnings_new', asyncHandler(async (req, res) => {
    const payment_gateway = req.body.payment_gateway === 'hybrid' ? { $in: ['ccbill', 'sticky.io', 'forumpay'] } : { $in: [req.body.payment_gateway, 'forumpay'] }
    const latestTransaction = await WebsiteDailyEarningReport.findOne({ payment_gateway }, 'target_date').sort({ 'target_date': 'desc' })
    const date = latestTransaction.target_date
    let yesterday = moment(date).format('YYYY-MM-DD 00:00:00')
    let yesterdayEnd = moment(date).format('YYYY-MM-DD 23:59:59')
    let startDate = moment(yesterday).startOf('month').format('YYYY-MM-DD HH:mm:ss')
    let endDate = moment(yesterday).endOf('month').format('YYYY-MM-DD HH:mm:ss')

    yesterday = new Date(yesterday)
    yesterdayEnd = new Date(yesterdayEnd)
    startDate = new Date(startDate)
    endDate = new Date(endDate)

    const websiteUrl = new URL(req.body.website_url)
    const domain = websiteUrl.hostname

    const yesterdaysModelEarnings = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, 'model_earning')
    const currentMonthModelEarnings = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, 'model_earning')
    const totalModelEarnings = await getModelEarningNew({}, domain, 'model_earning')

    const yesterdaysPlatformEarnings = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, 'platform_earning')
    const currentMonthPlatformEarnings = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, 'platform_earning')
    const totalPlatformEarnings = await getModelEarningNew({}, domain, 'platform_earning')

    const yesterdaysCCBillEarnings = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, 'ccbill_charge')
    const currentMonthCBillEarnings = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, 'ccbill_charge')
    const totalCCBillEarnings = await getModelEarningNew({}, domain, 'ccbill_charge')

    const yesterdaysTotalEarnings = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, 'gross_revenue')
    const currentMonthTotalEarnings = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, 'gross_revenue')
    const totalLifetimeEarnings = await getModelEarningNew({}, domain, 'gross_revenue')

    const yesterdaysVoidEarnings = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, 'void_amount')
    const currentMonthVoidEarnings = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, 'void_amount')
    const totalVoidEarnings = await getModelEarningNew({}, domain, 'void_amount')

    const yesterdaysRefundEarnings = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, 'refund_amount')
    const currentMonthRefundEarnings = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, 'refund_amount')
    const totalRefundEarnings = await getModelEarningNew({}, domain, 'refund_amount')

    const yesterdaysChargebackEarnings = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, 'chargeback_amount')
    const currentMonthChargebackEarnings = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, 'chargeback_amount')
    const totalChargebackEarnings = await getModelEarningNew({}, domain, 'chargeback_amount')

    const yesterdaysChargebackPenaltyEarnings = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, 'chargeback_penalty')
    const currentMonthChargebackPenaltyEarnings = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, 'chargeback_penalty')
    const totalChargebackPenaltyEarnings = await getModelEarningNew({}, domain, 'chargeback_penalty')

    const yesterdaysStickyIoEarnings = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, 'sticky_io_charge')
    const currentMonthStickyIoEarnings = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, 'sticky_io_charge')
    const totalStickyIoEarnings = await getModelEarningNew({}, domain, 'sticky_io_charge')

    const yesterdaysStickyIoFixedEarnings = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, 'fixed_sticky_io_charge')
    const currentMonthStickyIoFixedEarnings = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, 'fixed_sticky_io_charge')
    const totalStickyIoFixedEarnings = await getModelEarningNew({}, domain, 'fixed_sticky_io_charge')

    const yesterdaysModelFixedEarnings = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, 'fixed_model_earning')
    const currentMonthModelFixedEarnings = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, 'fixed_model_earning')
    const totalModelFixedEarnings = await getModelEarningNew({}, domain, 'fixed_model_earning')

    const yesterdaysPlatformFixedEarnings = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, 'fixed_platform_earning')
    const currentMonthPlatformFixedEarnings = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, 'fixed_platform_earning')
    const totalPlatformFixedEarnings = await getModelEarningNew({}, domain, 'fixed_platform_earning')

    const yesterdaysForumPayEarnings = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, 'forumpay_transaction_charge')
    const currentMonthForumPayEarnings = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, 'forumpay_transaction_charge')
    const totalForumPayEarnings = await getModelEarningNew({}, domain, 'forumpay_transaction_charge')

    const resData = {
        yesterdaysModelEarnings,
        currentMonthModelEarnings,
        totalModelEarnings,
        yesterdaysPlatformEarnings,
        currentMonthPlatformEarnings,
        totalPlatformEarnings,
        yesterdaysCCBillEarnings,
        currentMonthCBillEarnings,
        totalCCBillEarnings,
        yesterdaysTotalEarnings,
        currentMonthTotalEarnings,
        totalLifetimeEarnings,
        yesterdaysVoidEarnings,
        currentMonthVoidEarnings,
        totalVoidEarnings,
        yesterdaysRefundEarnings,
        currentMonthRefundEarnings,
        totalRefundEarnings,
        yesterdaysChargebackEarnings,
        currentMonthChargebackEarnings,
        totalChargebackEarnings,
        yesterdaysChargebackPenaltyEarnings,
        currentMonthChargebackPenaltyEarnings,
        totalChargebackPenaltyEarnings,
        yesterdaysStickyIoEarnings,
        currentMonthStickyIoEarnings,
        totalStickyIoEarnings,
        yesterdaysStickyIoFixedEarnings,
        currentMonthStickyIoFixedEarnings,
        totalStickyIoFixedEarnings,
        yesterdaysModelFixedEarnings,
        currentMonthModelFixedEarnings,
        totalModelFixedEarnings,
        yesterdaysPlatformFixedEarnings,
        currentMonthPlatformFixedEarnings,
        totalPlatformFixedEarnings,
        yesterdaysForumPayEarnings,
        currentMonthForumPayEarnings,
        totalForumPayEarnings
    }

    return res.send(resData)
}))

async function getChargeback(query, req) {
    let earning = []
    if (_.isEmpty(query)) {
        earning = await TransactionReports.find({
            'type': 'CHARGEBACK',
            'client_sub_account': {
                $in: [
                    req.body.ccbill_shop_account_code,
                    req.body.ccbill_tips_account_code,
                    req.body.ccbill_subscription_account_code,
                    req.body.ccbill_chat_account_code
                ]
            }
        })
    } else {
        earning = await TransactionReports.find({
            'pcp_transaction_date': query,
            'type': 'CHARGEBACK',
            'client_sub_account': {
                $in: [
                    req.body.ccbill_shop_account_code,
                    req.body.ccbill_tips_account_code,
                    req.body.ccbill_subscription_account_code,
                    req.body.ccbill_chat_account_code
                ]
            }
        })
    }

    return (earning.length == 0) ? 0 : (earning.length * 25)
}

async function getModelEarning(query, req, field) {
    let key = `$${field}`
    let earning = []
    if (_.isEmpty(query)) {
        earning = await TransactionReports.aggregate([{
            $match: {
                $or: [
                    { 'client_sub_account': req.body.ccbill_shop_account_code, 'type': { $in: ['NEW', 'REBILL'] } },
                    { 'client_sub_account': req.body.ccbill_tips_account_code, 'type': { $in: ['NEW', 'REBILL'] } },
                    { 'client_sub_account': req.body.ccbill_subscription_account_code, 'type': { $in: ['NEW', 'REBILL'] } },
                    { 'client_sub_account': req.body.ccbill_chat_account_code, 'type': { $in: ['NEW', 'REBILL'] } }
                ]
            }
        },
        {
            $group: {
                _id: 'sum', sum: { $sum: { '$toDouble': key } }
            }
        }
        ])
    } else {
        earning = await TransactionReports.aggregate([{
            $match: {
                'pcp_transaction_date': query,
                $or: [
                    { 'client_sub_account': req.body.ccbill_shop_account_code, 'type': { $in: ['NEW', 'REBILL'] } },
                    { 'client_sub_account': req.body.ccbill_tips_account_code, 'type': { $in: ['NEW', 'REBILL'] } },
                    { 'client_sub_account': req.body.ccbill_subscription_account_code, 'type': { $in: ['NEW', 'REBILL'] } },
                    { 'client_sub_account': req.body.ccbill_chat_account_code, 'type': { $in: ['NEW', 'REBILL'] } }
                ]
            }
        },
        {
            $group: {
                _id: 'sum', sum: { $sum: { '$toDouble': key } }
            }
        }
        ])
    }

    return (_.isEmpty(earning)) ? 0 : earning[0].sum
}

async function getModelRefunds(query, req, field) {
    let key = `$${field}`
    let earning = []
    if (_.isEmpty(query)) {
        earning = await TransactionReports.aggregate([{
            $match: {
                'type': { $in: ['CHARGEBACK', 'REFUND', 'VOID'] },
                'client_sub_account': {
                    $in: [
                        req.body.ccbill_shop_account_code,
                        req.body.ccbill_tips_account_code,
                        req.body.ccbill_subscription_account_code,
                        req.body.ccbill_chat_account_code
                    ]
                }
            }
        },
        {
            $group: {
                _id: 'sum', sum: { $sum: { '$toDouble': key } }
            }
        }
        ])
    } else {
        earning = await TransactionReports.aggregate([{
            $match: {
                'pcp_transaction_date': query,
                'type': { $in: ['CHARGEBACK', 'REFUND', 'VOID'] },
                'client_sub_account': {
                    $in: [
                        req.body.ccbill_shop_account_code,
                        req.body.ccbill_tips_account_code,
                        req.body.ccbill_subscription_account_code,
                        req.body.ccbill_chat_account_code
                    ]
                }
            }
        },
        {
            $group: {
                _id: 'sum', sum: { $sum: { '$toDouble': key } }
            }
        }
        ])
    }

    return (_.isEmpty(earning)) ? 0 : earning[0].sum
}

/**
 * Get total earning for a website for a particular field
 *
 * @param {object} query Query to execute when fetching earning
 * @param {*} domain Website domain to get earning from
 * @param {*} field Field which should be totalled
 * @returns {number} Total earning of the website with the query and field
 */
async function getModelEarningNew(query, domain, field) {
    let key = `$${field}`
    let earning = []

    if (_.isEmpty(query)) {
        earning = await WebsiteDailyEarningReport.aggregate([{
            $match: {
                'domain': domain
            }
        },
        {
            $group: {
                _id: 'sum', sum: { $sum: { '$toDouble': key } }
            }
        }
        ])
    } else {
        earning = await WebsiteDailyEarningReport.aggregate([{
            $match: {
                'target_date': query,
                'domain': domain
            }
        },
        {
            $group: {
                _id: 'sum', sum: { $sum: { '$toDouble': key } }
            }
        }
        ])
    }

    return new Promise((resolve) => {
        let totalEarning = (_.isEmpty(earning)) ? 0 : earning[0].sum
        resolve(totalEarning)
    })
}

/**
 * @description Calculate Model Earning By Payment Gateway
 * @param {object} query search query
 * @param {string} domain Domain name
 * @param {string} field Field Name
 * @param {string} payment_gateway Payment Gateway
 * @returns {number} amount Amount
 */
async function calculateModelEarningByPaymentGateway(query, domain, field, payment_gateway) {
    const filter = { domain, payment_gateway }
    if (!_.isEmpty(query)) {
        filter.target_date = query
    }

    if (domain === 'pandorakaaki.com' && _.isEmpty(query)) {
        const septMonthStart = moment().format('2023-09-01T00:00:00')
        filter.target_date = {
            $gte: new Date(septMonthStart)
        }
    }

    const earning = await WebsiteDailyEarningReport.aggregate([
        { $match: filter },
        {
            $group: {
                _id: 'sum',
                sum: { $sum: { '$toDouble': `$${field}` } }
            }
        }
    ])

    const amount = (_.isEmpty(earning)) ? 0 : earning[0].sum
    return amount
}

/**
 * @description Calculate earning of website
 * @param {object} data date and domain object
 * @param {string} key key name for calculation
 * @returns {object} earning calculations
 */
async function getWebsiteAmountCalculation(data, key) {
    const { yesterday, yesterdayEnd, startDate, endDate, domain } = data
    const yesterdays = await getModelEarningNew({ $gte: yesterday, $lte: yesterdayEnd }, domain, key)
    const currentMonths = await getModelEarningNew({ $gte: startDate, $lte: endDate }, domain, key)
    const lifetime = await getModelEarningNew({}, domain, key)

    return { yesterdays, currentMonths, lifetime }
}

/**
 * @description Get Websites earning
 */
router.post('/get-website-earning', asyncHandler(async (req, res) => {
    const payment_gateway = req.body.payment_gateway === 'hybrid' ? { $in: ['ccbill', 'sticky.io', 'forumpay'] } : { $in: [req.body.payment_gateway, 'forumpay'] }
    const latestTransaction = await WebsiteDailyEarningReport.findOne({ payment_gateway }, 'target_date').sort({ target_date: -1 })
    const date = latestTransaction.target_date
    let yesterday = moment(date).format('YYYY-MM-DD 00:00:00')
    let yesterdayEnd = moment(date).format('YYYY-MM-DD 23:59:59')
    let startDate = moment(yesterday).startOf('month').format('YYYY-MM-DD HH:mm:ss')
    let endDate = moment(yesterday).endOf('month').format('YYYY-MM-DD HH:mm:ss')

    yesterday = new Date(yesterday)
    yesterdayEnd = new Date(yesterdayEnd)
    startDate = new Date(startDate)
    endDate = new Date(endDate)

    const websiteUrl = new URL(req.body.website_url)
    const domain = websiteUrl.hostname

    const dates = { yesterday, yesterdayEnd, startDate, endDate, domain }
    const voidAmounts = await getWebsiteAmountCalculation(dates, 'void_amount')
    const refundAmounts = await getWebsiteAmountCalculation(dates, 'refund_amount')
    const grossAmounts = await getWebsiteAmountCalculation(dates, 'gross_revenue')
    const chargebackAmounts = await getWebsiteAmountCalculation(dates, 'chargeback_amount')
    const chargebackPenalty = await getWebsiteAmountCalculation(dates, 'chargeback_penalty')
    const modelEarning = await getWebsiteAmountCalculation(dates, 'model_earning')
    const platformEarning = await getWebsiteAmountCalculation(dates, 'platform_earning')
    const ccbillCharge = await getWebsiteAmountCalculation(dates, 'ccbill_charge')
    const stickyIoCharge = await getWebsiteAmountCalculation(dates, 'sticky_io_charge')
    const forumpayTransactionCharge = await getWebsiteAmountCalculation(dates, 'forumpay_transaction_charge')

    const paymentGatewayCharge = {
        yesterdays: ccbillCharge.yesterdays + stickyIoCharge.yesterdays + forumpayTransactionCharge.yesterdays,
        currentMonths: ccbillCharge.currentMonths + stickyIoCharge.currentMonths + forumpayTransactionCharge.currentMonths,
        lifetime: ccbillCharge.lifetime + stickyIoCharge.lifetime + forumpayTransactionCharge.lifetime
    }

    const realEarning = {
        model: modelEarning,
        platform: platformEarning,
        payment_gateway: paymentGatewayCharge,
        void: voidAmounts,
        refund: refundAmounts,
        chargeback_amount: chargebackAmounts,
        chargeback_penalty: chargebackPenalty,
        gross: grossAmounts
    }

    return res.send({ realEarning })
}))

module.exports = router
