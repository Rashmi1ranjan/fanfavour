const moment = require('moment')
const Website = require('./models/Website')
const WebsiteEarningReports = require('./models/WebsiteDailyEarningReport')
const WebsiteReferralEarningReports = require('./models/WebsiteReferralDailyEarningReport')
const TransactionReports = require('./models/CCBillTransactionReports')
const WebsiteCommission = require('./models/WebsiteCommission')
const WebsiteReferralHistory = require('./models/WebsiteReferralHistory')
const { NEW, REBILL, VOID, REFUND, CHARGEBACK } = require('./constants')
const { generateStickyIoDailyEarningReportByDomainAndDate, getStickyIoCommissionForDomainForDate, generateStickyIoDailyEarningReportByDomainAndDateForReferral } = require('./utils/stickyIoTransactions')
const { generateForumPayDailyEarningReportByDomainAndDate, generateForumPayDailyEarningReportByDomainAndDateForReferral } = require('./utils/ForumPayTransaction')
const { addCronStatusLog } = require('./utils/addCronStatus')
const _ = require('lodash')
const mongoose = require('mongoose')
const Server = require('./models/Server')
const Database = require('./models/Database')

/**
 * generate daily earning report of domain with range
 *
 * @param {string} startDate start date YYYY-MM-DDT00:00:00.000Z
 * @param {string} endDate end date YYYY-MM-DDT00:00:00.000Z
 * @param {string} domain for generate particular domain data
 * @returns {boolean} success and failure
 */
async function generateDailyEarningReportOfDomainWithRange(startDate, endDate, domain) {
    const startMoment = moment(startDate)
    const endMoment = moment(endDate).add(1, 'days')
    while (startMoment.isBefore(endMoment, 'day')) {
        let targetDate = startMoment.format('YYYY-MM-DDT00:00:00.000Z')
        await generateDailyEarningReportOfDomainByDate(domain, targetDate)
        startMoment.add(1, 'days')
    }
    console.log('Data updated successfully')
    return true
}

/**
 * generate daily earning report of domain for provided date
 *
 * @param {string} domain for delete particular domain data
 * @param {string} date date format should be YYYY-MM-DDT00:00:00.000Z
 * @returns {boolean} success or failure status
 */
async function generateDailyEarningReportOfDomainByDate(domain, date) {
    // delete daily report before generating for particular domain, we pass subscription sub account because we save sub account in daily earning report

    await deleteDailyEarningReportOfDomainByDate(domain, date)
    const website = await Website.findOne({ website_url: domain }, 'website_url payment_gateway is_crypto_payment_enabled')

    if (website.payment_gateway === 'ccbill') {
        await generateDailyEarningReportForDomainByDate(domain, date)
    } else if (website.payment_gateway === 'sticky.io') {
        await generateStickyIoDailyEarningReportByDomainAndDate(domain, date)
    } else if (website.payment_gateway === 'hybrid') {
        await generateDailyEarningReportForDomainByDate(domain, date)
        await generateStickyIoDailyEarningReportByDomainAndDate(domain, date)
    }

    if (website.is_crypto_payment_enabled === true) {
        await generateForumPayDailyEarningReportByDomainAndDate(domain, date)
    }

    return new Promise((resolve, reject) => {
        resolve(true)
    })
}

/**
 * delete daily earning report of domain by date
 *
 * @param {string} domain domain
 * @param {string} date YYYY-MM-DDT00:00:00.000Z
 * @returns {object} count of deleted record by date
 */
async function deleteDailyEarningReportOfDomainByDate(domain, date) {
    let transactionStartDate = moment(date).format('YYYY-MM-DDT00:00:00')
    let transactionEndDate = moment(date).format('YYYY-MM-DDT23:59:59')

    const deletedRecord = await WebsiteEarningReports.deleteMany({
        domain: domain,
        target_date: {
            $gte: transactionStartDate,
            $lte: transactionEndDate
        }
    })
    console.log('Records Deleted:', deletedRecord)

    return
}

/**
 * generate daily earning report with range
 *
 * @param {string} startDate start date YYYY-MM-DDT00:00:00.000Z
 * @param {string} endDate end date YYYY-MM-DDT00:00:00.000Z
 * @returns {boolean} success and failure
 */
async function generateDailyEarningReportWithRange(startDate, endDate) {
    const startMoment = moment(startDate)
    const endMoment = moment(endDate).add(1, 'days')
    while (startMoment.isBefore(endMoment, 'day')) {
        let targetDate = startMoment.format('YYYY-MM-DDT00:00:00.000Z')
        await generateDailyEarningReportByDate(targetDate)
        startMoment.add(1, 'days')
    }
    return true
}

/**
 * Calculating monthly earning revenue
 *
 * @param {Date} target_date date
 */
async function calculateMonthlyRevenue(target_date) {
    const currentDate = moment(target_date)
    console.time('Start Calculating monthly earning revenue')
    const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DDT00:00:00.000+00:00')
    const endOfMonth = moment(currentDate).endOf('month').format('YYYY-MM-DDT00:00:00.000+00:00')
    let websites = await Website.find({}, { monthly_earning: 1, website_url: 1 })
    for (let index = 0; index < websites.length; index++) {
        let websiteUrl = websites[index].website_url
        const pipeline = [
            {
                $match: {
                    target_date: { $gte: new Date(startOfMonth), $lte: new Date(endOfMonth) },
                    domain: { $eq: websiteUrl }
                }
            },
            {
                $group: {
                    _id: '$domain',
                    TotalAmount: { $sum: '$net_revenue' }
                }
            }
        ]
        const results = await WebsiteEarningReports.aggregate(pipeline)
        if (!_.isEmpty(results)) {
            websites[index].monthly_earning = results[0].TotalAmount
            await websites[index].save()
        }
    }
    console.timeEnd('Start Calculating monthly earning revenue')
    await calculatingMonthlyEarningRevenueByDatabase()
    await calculatingMonthlyEarningRevenueByServer()
}

/**
 * generate daily earning report for provided date
 *
 * @param {string} date date format should be YYYY-MM-DDT00:00:00.000Z
 * @returns {boolean} success or failure status
 */
async function generateDailyEarningReportByDateForReferral(date) {

    console.time('generateDailyEarningReportByDateForReferral')
    let target_date = moment().format('YYYY-MM-DDT00:00:00.000+00:00')
    target_date = new Date(target_date)

    // delete daily report before generating
    let deletedRecord = await deleteDailyEarningReportByDateForReferral(date)
    console.log('Records Deleted:', deletedRecord)

    let rows = await Website.find({}, 'website_url payment_gateway is_crypto_payment_enabled')

    let totalRecordsAdded = 0
    let totalCCBillRecordsAdded = 0
    let totalStickyIoRecordsAdded = 0
    let totalForumPayRecordsAdded = 0
    for (let index = 0; index < rows.length; index++) {
        let website = rows[index]
        if (website.payment_gateway === 'ccbill') {
            const ccbillEarning = await generateDailyEarningReportForDomainByDateForReferral(website.website_url, date)
            if (ccbillEarning) {
                totalRecordsAdded++
                totalCCBillRecordsAdded++
            }
        } else if (website.payment_gateway === 'sticky.io') {
            const stickyIoEarning = await generateStickyIoDailyEarningReportByDomainAndDateForReferral(website.website_url, date)
            if (stickyIoEarning) {
                totalRecordsAdded++
                totalStickyIoRecordsAdded++
            }
        } else if (website.payment_gateway === 'hybrid') {
            const ccbillEarning = await generateDailyEarningReportForDomainByDateForReferral(website.website_url, date)
            if (ccbillEarning) {
                totalRecordsAdded++
                totalCCBillRecordsAdded++
            }
            const stickyIoEarning = await generateStickyIoDailyEarningReportByDomainAndDateForReferral(website.website_url, date)
            if (stickyIoEarning) {
                totalRecordsAdded++
                totalStickyIoRecordsAdded++
            }
        }

        if (website.is_crypto_payment_enabled === true) {
            const forumPayEarning = await generateForumPayDailyEarningReportByDomainAndDateForReferral(website.website_url, date)
            if (forumPayEarning) {
                totalRecordsAdded++
                totalForumPayRecordsAdded++
            }
        }
        const cronStatusData = {
            domain: website.website_url,
            command_name: 'Generate Daily Earning Report',
            cron_status: 'success',
            target_date: target_date,
            message: ''
        }
        await addCronStatusLog(cronStatusData)
    }
    console.log('total records added:', totalRecordsAdded)
    console.log('total CCBill records added:', totalCCBillRecordsAdded)
    console.log('total Sticky.io records added:', totalStickyIoRecordsAdded)
    console.log('total ForumPay records added:', totalForumPayRecordsAdded)
    console.timeEnd('generateDailyEarningReportByDateForReferral')
    await calculateMonthlyRevenue(target_date)
    return new Promise((resolve, reject) => {
        resolve(true)
    })
}

/**
 * generate daily earning report for provided date
 *
 * @param {string} date date format should be YYYY-MM-DDT00:00:00.000Z
 * @returns {boolean} success or failure status
 */
async function generateDailyEarningReportByDate(date) {

    console.time('generateDailyEarningReportByDate')
    let target_date = moment().format('YYYY-MM-DDT00:00:00.000+00:00')
    target_date = new Date(target_date)

    // delete daily report before generating
    let deletedRecord = await deleteDailyEarningReportByDate(date)
    console.log('Records Deleted:', deletedRecord)

    let rows = await Website.find({}, 'website_url payment_gateway is_crypto_payment_enabled')

    let totalRecordsAdded = 0
    let totalCCBillRecordsAdded = 0
    let totalStickyIoRecordsAdded = 0
    let totalForumPayRecordsAdded = 0
    for (let index = 0; index < rows.length; index++) {
        let website = rows[index]
        if (website.payment_gateway === 'ccbill') {
            const ccbillEarning = await generateDailyEarningReportForDomainByDate(website.website_url, date)
            if (ccbillEarning) {
                totalRecordsAdded++
                totalCCBillRecordsAdded++
            }
        } else if (website.payment_gateway === 'sticky.io') {
            const stickyIoEarning = await generateStickyIoDailyEarningReportByDomainAndDate(website.website_url, date)
            if (stickyIoEarning) {
                totalRecordsAdded++
                totalStickyIoRecordsAdded++
            }
        } else if (website.payment_gateway === 'hybrid') {
            const ccbillEarning = await generateDailyEarningReportForDomainByDate(website.website_url, date)
            if (ccbillEarning) {
                totalRecordsAdded++
                totalCCBillRecordsAdded++
            }
            const stickyIoEarning = await generateStickyIoDailyEarningReportByDomainAndDate(website.website_url, date)
            if (stickyIoEarning) {
                totalRecordsAdded++
                totalStickyIoRecordsAdded++
            }
        }

        if (website.is_crypto_payment_enabled === true) {
            const forumPayEarning = await generateForumPayDailyEarningReportByDomainAndDate(website.website_url, date)
            if (forumPayEarning) {
                totalRecordsAdded++
                totalForumPayRecordsAdded++
            }
        }
        const cronStatusData = {
            domain: website.website_url,
            command_name: 'Generate Daily Earning Report',
            cron_status: 'success',
            target_date: target_date,
            message: ''
        }
        await addCronStatusLog(cronStatusData)
    }
    console.log('total records added:', totalRecordsAdded)
    console.log('total CCBill records added:', totalCCBillRecordsAdded)
    console.log('total Sticky.io records added:', totalStickyIoRecordsAdded)
    console.log('total ForumPay records added:', totalForumPayRecordsAdded)
    console.timeEnd('generateDailyEarningReportByDate')
    await calculateMonthlyRevenue(target_date)
    return new Promise((resolve, reject) => {
        resolve(true)
    })
}

/**
 * delete daily earning report by date
 *
 * @param {string} date YYYY-MM-DDT00:00:00.000Z
 * @returns {object} count of deleted record by date
 */
async function deleteDailyEarningReportByDate(date) {
    let transactionStartDate = moment(date).format('YYYY-MM-DDT00:00:00')
    let transactionEndDate = moment(date).format('YYYY-MM-DDT23:59:59')
    return await WebsiteEarningReports.deleteMany({
        payment_gateway: 'ccbill',
        target_date: {
            $gte: transactionStartDate,
            $lte: transactionEndDate
        }
    })
}

/**
 * delete daily earning report by date
 *
 * @param {string} date YYYY-MM-DDT00:00:00.000Z
 * @returns {object} count of deleted record by date
 */
async function deleteDailyEarningReportByDateForReferral(date) {
    let transactionStartDate = moment(date).format('YYYY-MM-DDT00:00:00')
    let transactionEndDate = moment(date).format('YYYY-MM-DDT23:59:59')
    return await WebsiteReferralEarningReports.deleteMany({
        payment_gateway: 'ccbill',
        target_date: {
            $gte: transactionStartDate,
            $lte: transactionEndDate
        }
    })
}

/**
 * generate daily earning report for domain of specified date
 *
 * @param {string} domain domain
 * @param {string} date date
 * @returns {boolean} success or failure
 */
async function generateDailyEarningReportForDomainByDate(domain, date) {
    try {

        let earningReport
        let referralEarningReport
        if (moment(date) > moment('2022-02-28T23:59:59.000Z')) {
            earningReport = await generateDateWiseEarningForDomainWithFixedCharge(domain, date)
            // referralEarningReport = generateDateWiseEarningForDomainWithFixedChargeWithReferral(domain, date)
        } else {
            earningReport = await generateDateWiseEarningForDomain(domain, date)
        }

        if (earningReport) {
            const data = new WebsiteEarningReports(earningReport)
            await data.save()
        }

        // Save referral earning report (only if exists)
        if (referralEarningReport) {
            const refData = new WebsiteReferralEarningReports(referralEarningReport)
            await refData.save()
        }
        return true
    } catch (error) {
        console.log('err', error)
    }
    return new Promise((resolve, reject) => {
        resolve(false)
    })
}

/**
 * generate daily earning report for domain of specified date
 *
 * @param {string} domain domain
 * @param {string} date date
 * @returns {boolean} success or failure
 */
async function generateDailyEarningReportForDomainByDateForReferral(domain, date) {
    try {

        let earningReport
        let referralEarningReport
        if (moment(date) > moment('2022-02-28T23:59:59.000Z')) {
            // earningReport = await generateDateWiseEarningForDomainWithFixedCharge(domain, date)
            referralEarningReport = generateDateWiseEarningForDomainWithFixedChargeWithReferral(domain, date)
        } else {
            earningReport = await generateDateWiseEarningForDomain(domain, date)
        }

        if (earningReport) {
            const data = new WebsiteEarningReports(earningReport)
            await data.save()
        }

        // Save referral earning report (only if exists)
        if (referralEarningReport) {
            const refData = new WebsiteReferralEarningReports(referralEarningReport)
            await refData.save()
        }
        return true
    } catch (error) {
        console.log('err', error)
    }
    return new Promise((resolve, reject) => {
        resolve(false)
    })
}

/**
 * @typedef earningReport
 * @type {object}
 * @property {string} domain - an domain
 * @property {string} target_date - an target Date
 * @property {string} subscription_sub_account- an subscription_sub_account
 * @property {string} shop_sub_account- an shop_sub_account
 * @property {string} tip_sub_account- an tip_sub_account
 * @property {number} platform_commission- an platform_commission
 * @property {number} ccbill_commission- an ccbill_commission
 * @property {number} subscription_amount- an subscription_amount
 * @property {number} subscription_refund_amount- an subscription_refund_amount
 * @property {number} subscription_chargeback_amount- an subscription_chargeback_amount
 * @property {number} subscription_chargeback_count- an subscription_chargeback_count
 * @property {number} subscription_void_amount- an subscription_void_amount
 * @property {number} shop_amount- an shop_amount
 * @property {number} shop_refund_amount- an shop_refund_amount
 * @property {number} shop_chargeback_amount- an shop_chargeback_amount
 * @property {number} shop_chargeback_count- an shop_chargeback_count
 * @property {number} shop_void_amount- an shop_void_amount
 * @property {number} tip_amount- an tip_amount
 * @property {number} tip_refund_amount- an tip_refund_amount
 * @property {number} tip_chargeback_amount- an tip_chargeback_amount
 * @property {number} tip_chargeback_count- an tip_chargeback_count
 * @property {number} tip_void_amount- an tip_void_amount
 * @property {number} gross_revenue- an gross_revenue
 * @property {number} gross_refund- an gross_refund
 * @property {number} chargeback_amount- an chargeback_amount
 * @property {number} chargeback_count- an chargeback_count
 * @property {number} chargeback_penalty- an chargeback_penalty
 * @property {number} refund_amount- an refund_amount
 * @property {number} void_amount- an void_amount
 * @property {number} net_revenue- an net_revenue
 * @property {number} ccbill_charge- an ccbill_charge
 * @property {number} revenue_collected- an revenue_collected
 * @property {number} platform_earning- an platform_earning
 * @property {number} model_earning- an model_earning
 */

/**
 * calculate and generate earning report
 *
 * @param {string} domain domain
 * @param {string} date date
 * @returns {earningReport | boolean} Earning Report
 */
async function generateDateWiseEarningForDomain(domain, date) {
    let commission = await getCommissionForDomainForDate(domain, date)

    if (commission === false) {
        console.log('commission not found for domain:', domain, 'for date:', date)
        return false
    }

    let websiteData = await Website.findOne({
        website_url: domain
    }, 'subscription_sub_account shop_sub_account tip_sub_account platform_commission ccbill_charge')

    const subscriptionSubAccount = websiteData.subscription_sub_account
    const shopSubAccount = websiteData.shop_sub_account
    const tipSubAccount = websiteData.tip_sub_account

    let subscriptionAmount = await getSumWithTypeAndSubAccountOfDate(subscriptionSubAccount, [NEW, REBILL], date, date)
    let subscriptionRefundAmount = await getSumWithTypeAndSubAccountOfDate(subscriptionSubAccount, [REFUND], date, date)
    let subscriptionChargebackAmount = await getSumWithTypeAndSubAccountOfDate(subscriptionSubAccount, [CHARGEBACK], date, date)
    let subscriptionVoidAmount = await getSumWithTypeAndSubAccountOfDate(subscriptionSubAccount, [VOID], date, date)

    let shopAmount = await getSumWithTypeAndSubAccountOfDate(shopSubAccount, [NEW, REBILL], date, date)
    let shopRefundAmount = await getSumWithTypeAndSubAccountOfDate(shopSubAccount, [REFUND], date, date)
    let shopChargebackAmount = await getSumWithTypeAndSubAccountOfDate(shopSubAccount, [CHARGEBACK], date, date)
    let shopVoidAmount = await getSumWithTypeAndSubAccountOfDate(shopSubAccount, [VOID], date, date)

    let tipAmount = await getSumWithTypeAndSubAccountOfDate(tipSubAccount, [NEW, REBILL], date, date)
    let tipRefundAmount = await getSumWithTypeAndSubAccountOfDate(tipSubAccount, [REFUND], date, date)
    let tipChargebackAmount = await getSumWithTypeAndSubAccountOfDate(tipSubAccount, [CHARGEBACK], date, date)
    let tipVoidAmount = await getSumWithTypeAndSubAccountOfDate(tipSubAccount, [VOID], date, date)

    let grossRevenue = subscriptionAmount.accounting_amount + shopAmount.accounting_amount + tipAmount.accounting_amount
    let grossRefundAmount = subscriptionRefundAmount.accounting_amount + shopRefundAmount.accounting_amount + tipRefundAmount.accounting_amount
    let grossChargebackAmount = subscriptionChargebackAmount.accounting_amount + shopChargebackAmount.accounting_amount + tipChargebackAmount.accounting_amount
    let grossVoidAmount = subscriptionVoidAmount.accounting_amount + shopVoidAmount.accounting_amount + tipVoidAmount.accounting_amount

    let grossChargebackCount = subscriptionChargebackAmount.count + shopChargebackAmount.count + tipChargebackAmount.count

    if (grossRevenue === 0 && grossRefundAmount === 0 && grossChargebackAmount === 0 && grossVoidAmount === 0) {
        return false
    }

    let grossDeduction = grossRefundAmount + grossChargebackAmount + grossVoidAmount

    let chargebackPenalty = grossChargebackCount * 25

    let netRevenue = grossRevenue - grossDeduction - chargebackPenalty

    let ccbillFeesPercentage = commission.ccbill_fees
    let ccbillFees = (((grossRevenue - grossVoidAmount) * ccbillFeesPercentage) / 100)

    let revenueCollected = netRevenue - ccbillFees

    let platformCommissionPercentage = commission.platform_commission

    let platformCommissionAmount = (platformCommissionPercentage / 100) * revenueCollected
    let model_earning = (100 - platformCommissionPercentage) * revenueCollected / 100
    let referralData = await getWebsiteDomainReferralForDate(domain, date)

    let referralAmount = 0
    let referralAmount1 = 0
    let referralAmount2 = 0
    if (referralData !== null && referralData !== false) {
        if (referralData.total_referral > 0) {
            referralAmount = calculateReferralAmount(referralData.referral_commission, revenueCollected)
            if (referralData.total_referral > 1) {
                referralAmount1 = calculateReferralAmount(referralData.referral_commission1, revenueCollected)
                if (referralData.total_referral > 2) {
                    referralAmount2 = calculateReferralAmount(referralData.referral_commission2, revenueCollected)
                }
            }
        }
    }

    const data = {
        domain: domain,
        target_date: date,
        subscription_sub_account: subscriptionSubAccount,
        shop_sub_account: shopSubAccount,
        tip_sub_account: tipSubAccount,
        platform_commission: platformCommissionPercentage,
        ccbill_commission: ccbillFeesPercentage,
        subscription_amount: subscriptionAmount.accounting_amount,
        subscription_refund_amount: subscriptionRefundAmount.accounting_amount,
        subscription_chargeback_amount: subscriptionChargebackAmount.accounting_amount,
        subscription_chargeback_count: subscriptionChargebackAmount.count,
        subscription_void_amount: subscriptionVoidAmount.accounting_amount,
        shop_amount: shopAmount.accounting_amount,
        shop_refund_amount: shopRefundAmount.accounting_amount,
        shop_chargeback_amount: shopChargebackAmount.accounting_amount,
        shop_chargeback_count: shopChargebackAmount.count,
        shop_void_amount: shopVoidAmount.accounting_amount,
        tip_amount: tipAmount.accounting_amount,
        tip_refund_amount: tipRefundAmount.accounting_amount,
        tip_chargeback_amount: tipChargebackAmount.accounting_amount,
        tip_chargeback_count: tipChargebackAmount.count,
        tip_void_amount: tipVoidAmount.accounting_amount,
        gross_revenue: grossRevenue,
        gross_refund: grossDeduction,
        chargeback_amount: grossChargebackAmount,
        chargeback_count: grossChargebackCount,
        chargeback_penalty: chargebackPenalty,
        refund_amount: grossRefundAmount,
        void_amount: grossVoidAmount,
        net_revenue: netRevenue,
        ccbill_charge: ccbillFees,
        revenue_collected: revenueCollected,
        platform_earning: platformCommissionAmount,
        model_earning: model_earning,
        created_at: new Date(),
        updated_at: new Date(),
        referral_history_id: (referralData !== null) ? referralData._id : null,
        referral_amount: referralAmount,
        referral_amount1: referralAmount1,
        referral_amount2: referralAmount2,
        payment_gateway: 'ccbill'
    }

    return new Promise((resolve, reject) => {
        resolve(data)
    })
}

/**
 *
 * @param {number} referralCommission referralCommission
 * @param {number} revenueCollected revenueCollected
 * @returns {number} referral_amount
 */
function calculateReferralAmount(referralCommission, revenueCollected) {
    let referral_commission = (referralCommission) ? referralCommission : 0
    let revenue_collected = revenueCollected
    let referral_amount = (Number(revenue_collected) * referral_commission) / 100
    return referral_amount
}

/**
 * @typedef TotalAmount
 * @type {object}
 * @property {number} accounting_amount - an accounting amount sum
 * @property {number} count - an total count
 */

/**
 * To get sum of accounting of sub account with transaction type of specified date
 *
 * @param {string} subAccount sub account
 * @param {Array<string>} transactionTypes -NEW,REBILL,CHARGEBACK,VOID
 * @param {string} startDate start date
 * @param {string} endDate end date
 * @returns {Promise<TotalAmount>} TotalAmounts
 */
async function getSumWithTypeAndSubAccountOfDate(subAccount, transactionTypes, startDate, endDate) {
    return new Promise((resolve, reject) => {
        let transactionStartDate = moment(startDate).format('YYYY-MM-DDT00:00:00')
        let transactionEndDate = moment(endDate).format('YYYY-MM-DDT23:59:59')

        TransactionReports.aggregate([{
            $match: {
                'pcp_transaction_date': { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
                'type': { $in: transactionTypes },
                'client_sub_account': subAccount
            }
        }, {
            $group: {
                _id: null,
                'accounting_amount': { '$sum': '$accounting_amount' },
                count: {
                    $sum: 1
                }
            }
        }
        ]).then((rows) => {
            let accounting_amount = 0
            let count = 0
            if (rows.length > 0) {
                const accountingAmount = rows[0]
                accounting_amount = accountingAmount.accounting_amount
                count = accountingAmount.count
            }
            return resolve({
                accounting_amount: accounting_amount,
                count: count
            })
        }).catch((error) => {
            return reject(error)
        })
    })
}

/**
 * @typedef TotalAmount
 * @type {object}
 * @property {number} accounting_amount - an accounting amount sum
 * @property {number} count - an total count
 */

/**
 * To get sum of accounting of sub account with transaction type of specified date
 *
 * @param {string} subAccount sub account
 * @param {Array<string>} transactionTypes -NEW,REBILL,CHARGEBACK,VOID
 * @param {string} startDate start date
 * @param {string} endDate end date
 * @returns {Promise<TotalAmount>} TotalAmounts
 */
async function getSumWithTypeAndSubAccountOfDateWithoutReferral(subAccount, transactionTypes, startDate, endDate) {
    return new Promise((resolve, reject) => {
        let transactionStartDate = moment(startDate).format('YYYY-MM-DDT00:00:00')
        let transactionEndDate = moment(endDate).format('YYYY-MM-DDT23:59:59')

        TransactionReports.aggregate([{
            $match: {
                'pcp_transaction_date': { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
                'type': { $in: transactionTypes },
                'client_sub_account': subAccount,
                'tracking_link': { $exists: false, $eq: '' }
            }
        }, {
            $group: {
                _id: null,
                'accounting_amount': { '$sum': '$accounting_amount' },
                count: {
                    $sum: 1
                }
            }
        }
        ]).then((rows) => {
            let accounting_amount = 0
            let count = 0
            if (rows.length > 0) {
                const accountingAmount = rows[0]
                accounting_amount = accountingAmount.accounting_amount
                count = accountingAmount.count
            }
            return resolve({
                accounting_amount: accounting_amount,
                count: count
            })
        }).catch((error) => {
            return reject(error)
        })
    })
}

/**
 * To get sum of accounting of sub account with transaction type of specified date
 *
 * @param {string} subAccount sub account
 * @param {Array<string>} transactionTypes -NEW,REBILL,CHARGEBACK,VOID
 * @param {string} startDate start date
 * @param {string} endDate end date
 * @param {string} type type -SUBSCRIPTION, SHOP, TIP
 * @param {object} commission ccbill commission
 * @param {string} domain domain
 * @returns {Promise<TotalAmount>} TotalAmounts
 */
async function getSumWithTypeAndSubAccountOfDateForReferral(subAccount, transactionTypes, startDate, endDate, type, commission, domain) {
    let transactionStartDate = moment(startDate).format('YYYY-MM-DDT00:00:00')
    let transactionEndDate = moment(endDate).format('YYYY-MM-DDT23:59:59')

    const query = {
        'pcp_transaction_date': { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
        'type': { $in: transactionTypes },
        'client_sub_account': subAccount,
        'tracking_link': { $exists: true, $ne: '' }
    }
    const ccbillTransactions = await TransactionReports.find(query)

    let grossRevenue = 0
    let totalSubscriptionChargebackCount = 0
    let totalShopChargebackCount = 0
    let totalTipChargebackCount = 0
    let totalRevenueCollected = 0
    let totalPlatformCommissionAmount = 0
    let totalNetRevenue = 0
    let totalModelEarning = 0
    let totalCCBillTotalFeesIncludingMG = 0
    let referralEarning = 0
    let referralEarning1 = 0
    let referralEarning2 = 0
    let totalGrossRefundAmount = 0
    let totalChargebackPenalty = 0
    let totalFixedMGFees = 0
    let referralData = null
    let totalGrossDeduction = 0
    let totalGrossVoidAmount = 0
    let totalGrossChargebackAmount = 0
    let totalRefundCount = 0
    let totalChargebackCount = 0
    let totalVoidCount = 0
    let totalTransactionCount = 0

    for (const transaction of ccbillTransactions) {
        const amount = transaction.accounting_amount | 0
        grossRevenue += amount

        let grossRefundAmount = 0
        let grossChargebackAmount = 0
        let grossVoidAmount = 0
        let subscriptionChargebackCount = 0
        let shopChargebackCount = 0
        let tipChargebackCount = 0
        let subscriptionCount = 0
        let shopCount = 0
        let tipCount = 0
        let subscriptionVoidCount = 0
        let shopVoidCount = 0
        let tipVoidCount = 0
        let referralAmount = 0
        let referralAmount1 = 0
        let referralAmount2 = 0

        if ([NEW, REBILL].includes(transactionTypes)) {
            totalTransactionCount += 1
        } else if (transactionTypes === REFUND) {
            grossRefundAmount += (amount || 0)
            totalGrossRefundAmount += (amount || 0)
            totalRefundCount += 1
        } else if (transactionTypes === VOID) {
            grossVoidAmount += (amount || 0)
            totalGrossVoidAmount += (amount || 0)
            totalVoidCount += 1
        } else if (transactionTypes === CHARGEBACK) {
            grossChargebackAmount += (amount || 0)
            totalGrossChargebackAmount += (amount || 0)
            totalChargebackCount += 1
        }

        const grossChargebackCount = subscriptionChargebackCount + shopChargebackCount + tipChargebackCount
        const grossDeduction = grossRefundAmount + grossChargebackAmount + grossVoidAmount
        totalGrossDeduction += grossDeduction

        const chargebackPenalty = grossChargebackCount * 25
        totalChargebackPenalty += chargebackPenalty
        const netRevenue = amount - grossDeduction - chargebackPenalty
        totalNetRevenue += netRevenue

        const totalNewTransactions = subscriptionCount + shopCount + tipCount
        const totalVoidTransactions = subscriptionVoidCount + shopVoidCount + tipVoidCount

        const ccbillFeesPercentage = commission.ccbill_fees
        const ccbillFixedCharge = parseFloat(commission.ccbill_transaction_charge)

        let ccbillFees = (((amount - grossVoidAmount) * ccbillFeesPercentage) / 100)
        let ccbillFixedFees = ((totalNewTransactions - totalVoidTransactions) * ccbillFixedCharge)
        if (transactionTypes === VOID) {
            ccbillFees = 0
            ccbillFixedFees = 0
        }
        const ccbillTotalFees = ccbillFees + ccbillFixedFees

        const revenueCollected = netRevenue - ccbillTotalFees
        totalRevenueCollected += revenueCollected

        // Added as of 8th February. This is the fixed percentage for MG on overall amount.
        const fixedMGFees = revenueCollected * 0.006
        totalFixedMGFees += fixedMGFees
        const ccbillTotalFeesIncludingMG = ccbillTotalFees + fixedMGFees
        totalCCBillTotalFeesIncludingMG += ccbillTotalFeesIncludingMG

        const updatedRevenueCollected = revenueCollected - fixedMGFees

        const platformCommissionPercentage = commission.platform_commission

        const platformCommissionAmount = (platformCommissionPercentage / 100) * updatedRevenueCollected
        totalPlatformCommissionAmount += platformCommissionAmount
        const model_earning = (100 - platformCommissionPercentage) * updatedRevenueCollected / 100
        totalModelEarning += model_earning

        referralData = await getWebsiteReferralHistoryForReferral(domain, startDate, transaction.referral)

        if (referralData !== null) {
            if (referralData.total_referral > 0) {
                const percent = referralData.referral_commission || 0
                referralAmount = (updatedRevenueCollected * percent) / 100
                if (referralData.total_referral > 1) {
                    const percent = referralData.referral_commission1 || 0
                    referralAmount1 = (updatedRevenueCollected * percent) / 100
                    if (referralData.total_referral > 2) {
                        const percent = referralData.referral_commission2 || 0
                        referralAmount2 = (updatedRevenueCollected * percent) / 100
                    }
                }
            }
        }
        referralEarning += referralAmount
        referralEarning1 += referralAmount1
        referralEarning2 += referralAmount2
    }

    return {
        grossRevenue: grossRevenue,
        netRevenue: totalNetRevenue,
        model_earning: totalModelEarning,
        platformCommissionAmount: totalPlatformCommissionAmount,
        totalSubscriptionChargebackCount: totalSubscriptionChargebackCount,
        totalShopChargebackCount: totalShopChargebackCount,
        totalTipChargebackCount: totalTipChargebackCount,
        revenueCollected: totalRevenueCollected,
        ccbillTotalFeesIncludingMG: totalCCBillTotalFeesIncludingMG,
        referralEaring: referralEarning,
        referralEaring1: referralEarning1,
        referralEaring2: referralEarning2,
        grossRefundAmount: totalGrossRefundAmount,
        chargebackPenalty: totalChargebackPenalty,
        fixedMGFees: totalFixedMGFees,
        referralData: referralData,
        transaction_count: ccbillTransactions.length,
        totalGrossDeduction: totalGrossDeduction,
        totalRefundCount: totalRefundCount,
        totalChargebackCount: totalChargebackCount,
        totalVoidCount: totalVoidCount,
        totalGrossRefundAmount: totalGrossRefundAmount,
        totalGrossChargebackAmount: totalGrossChargebackAmount,
        totalGrossVoidAmount: totalGrossVoidAmount,
        totalTransactionCount: totalTransactionCount
    }
}

async function getVeryRecentCommissionForDomain(domain) {
    return new Promise((resolve, reject) => {
        const fields = 'domain platform_commission ccbill_fees target_date sticky_io_charges sticky_io_transaction_charge forumpay_transaction_charge'

        WebsiteCommission.find({
            domain: domain
        }, fields)
            .sort({ target_date: -1 })
            .limit(1)
            .then((result) => {
                if (result.length > 0) {
                    return resolve(result[0])
                }
                return resolve(false)
            })
            .catch((error) => {
                return reject(error)
            })
    })
}

/**
 * @typedef domainCommission
 * @type {object}
 * @property {string} domain - an domain
 * @property {number} platform_commission - an platform_commission.
 * @property {number} ccbill_fees - an ccbill_fees.
 * @property {string} target_date - an target_date
 * @property {string} sticky_io_fees - a sticky.io fees
 */

/**
 * @param {string} domain domain
 * @param {string} date date
 * @returns {Promise<domainCommission | boolean>} commission
 */
async function getCommissionForDomainForDate(domain, date) {
    return new Promise((resolve, reject) => {
        const targetDate = moment(date).format('YYYY-MM-DD 00:00:00')
        const fields = 'domain platform_commission ccbill_fees target_date sticky_io_charges sticky_io_transaction_charge ccbill_transaction_charge forumpay_transaction_charge'

        WebsiteCommission.find({
            domain: domain,
            target_date: { $lte: targetDate }
        }, fields)
            .sort({ target_date: -1 })
            .limit(1)
            .then((result) => {
                if (result.length > 0) {
                    return resolve(result[0])
                }
                getVeryRecentCommissionForDomain(domain).then((recentCommission) => {
                    return resolve(recentCommission)
                })
            })
            .catch((error) => {
                return reject(error)
            })
    })
}

/**
 * @param {string} domain domain
 * @param {string} date date
 * @returns {Promise<domainCommission | boolean>} commission
 */
async function getWebsiteDomainReferralForDate(domain, date) {
    return new Promise((resolve, reject) => {
        const targetDate = moment(date).format('YYYY-MM-DD 00:00:00')
        const fields = 'domain total_referral referral_type referral_type1 referral_type2 referral_name referral_name1 referral_name2 referral_commission referral_commission1 referral_commission2 target_date'

        WebsiteReferralHistory.find({
            domain: domain,
            target_date: { $lte: targetDate }
        }, fields)
            .sort({ target_date: -1 })
            .limit(1)
            .then((result) => {
                if (result.length > 0) {
                    return resolve(result[0])
                }
                getVeryRecentWebsiteReferralForDomain(domain).then((recentCommission) => {
                    return resolve(recentCommission)
                })
            })
            .catch((error) => {
                return reject(error)
            })
    })
}

/**
 *
 * @param {string} domain domain
 * @param {string} date date
 * @param {string} referral_name referral name
 * @returns {object} referral website history data
 */
async function getWebsiteReferralHistoryForReferral(domain, date, referral_name) {
    const targetDate = moment(date).format('YYYY-MM-DD 00:00:00')
    const fields =
        'domain total_referral referral_type referral_type1 referral_type2 referral_name referral_name1 referral_name2 referral_commission referral_commission1 referral_commission2 target_date'

    // Find latest record <= targetDate
    const result = await WebsiteReferralHistory.findOne(
        {
            domain: { $in: [domain, 'all'] },
            target_date: { $lte: targetDate },
            referral_type: 'link-tracking',
            $or: [
                { referral_name: referral_name },
                { referral_name1: referral_name },
                { referral_name2: referral_name }
            ]
        },
        fields
    )
        .sort({ target_date: -1 })
        .limit(1)

    if (result !== null) {
        return result
    }

    // If no record found, load the most recent commission
    const recentCommission = await getVeryRecentWebsiteReferralForDomainForReferral(domain, referral_name)
    return recentCommission
}


/**
 *
 * @param {string} domain domain
 * @returns {Promise<domainCommission | boolean>} commission
 */
async function getVeryRecentWebsiteReferralForDomain(domain) {
    return new Promise((resolve, reject) => {
        const fields = 'domain total_referral referral_type referral_type1 referral_type2 referral_name referral_name1 referral_name2 referral_commission referral_commission1 referral_commission2 target_date'

        WebsiteReferralHistory.find({
            domain: domain
        }, fields)
            .sort({ target_date: -1 })
            .limit(1)
            .then((result) => {
                if (result.length > 0) {
                    return resolve(result[0])
                }
                return resolve(false)
            })
            .catch((error) => {
                return reject(error)
            })
    })
}

/**
 *
 * @param {string} domain domain
 * @param {string} referral_name referral name
 * @returns {Promise<domainCommission | boolean>} commission
 */
async function getVeryRecentWebsiteReferralForDomainForReferral(domain, referral_name) {
    const fields =
        'domain total_referral referral_type referral_type1 referral_type2 referral_name referral_name1 referral_name2 referral_commission referral_commission1 referral_commission2 target_date'

    const result = await WebsiteReferralHistory.findOne(
        {
            domain: { $in: [domain, 'all'] },
            referral_type: 'link-tracking',
            $or: [
                { referral_name: referral_name },
                { referral_name1: referral_name },
                { referral_name2: referral_name }
            ]
        },
        fields
    )
        .sort({ target_date: -1 })
        .limit(1)

    if (result !== null) {
        return result
    }
    return null
}

/**
 * calculate and generate earning report
 *
 * @param {string} domain domain
 * @param {string} date date
 * @returns {earningReport | boolean} Earning Report
 */
async function generateDateWiseEarningForDomainWithFixedCharge(domain, date) {
    const commission = await getCommissionForDomainForDate(domain, date)
    if (commission === false) {
        console.log('commission not found for domain:', domain, 'for date:', date)
        return false
    }

    const websiteData = await Website.findOne({
        website_url: domain
    }, 'subscription_sub_account shop_sub_account tip_sub_account platform_commission ccbill_charge')

    const subscriptionSubAccount = websiteData.subscription_sub_account
    const shopSubAccount = websiteData.shop_sub_account
    const tipSubAccount = websiteData.tip_sub_account

    const subscriptionAmount = await getSumWithTypeAndSubAccountOfDate(subscriptionSubAccount, [NEW, REBILL], date, date)
    const subscriptionRefundAmount = await getSumWithTypeAndSubAccountOfDate(subscriptionSubAccount, [REFUND], date, date)
    const subscriptionChargebackAmount = await getSumWithTypeAndSubAccountOfDate(subscriptionSubAccount, [CHARGEBACK], date, date)
    const subscriptionVoidAmount = await getSumWithTypeAndSubAccountOfDate(subscriptionSubAccount, [VOID], date, date)

    const shopAmount = await getSumWithTypeAndSubAccountOfDate(shopSubAccount, [NEW, REBILL], date, date)
    const shopRefundAmount = await getSumWithTypeAndSubAccountOfDate(shopSubAccount, [REFUND], date, date)
    const shopChargebackAmount = await getSumWithTypeAndSubAccountOfDate(shopSubAccount, [CHARGEBACK], date, date)
    const shopVoidAmount = await getSumWithTypeAndSubAccountOfDate(shopSubAccount, [VOID], date, date)

    const tipAmount = await getSumWithTypeAndSubAccountOfDate(tipSubAccount, [NEW, REBILL], date, date)
    const tipRefundAmount = await getSumWithTypeAndSubAccountOfDate(tipSubAccount, [REFUND], date, date)
    const tipChargebackAmount = await getSumWithTypeAndSubAccountOfDate(tipSubAccount, [CHARGEBACK], date, date)
    const tipVoidAmount = await getSumWithTypeAndSubAccountOfDate(tipSubAccount, [VOID], date, date)

    const grossRevenue = subscriptionAmount.accounting_amount + shopAmount.accounting_amount + tipAmount.accounting_amount
    const grossRefundAmount = subscriptionRefundAmount.accounting_amount + shopRefundAmount.accounting_amount + tipRefundAmount.accounting_amount
    const grossChargebackAmount = subscriptionChargebackAmount.accounting_amount + shopChargebackAmount.accounting_amount + tipChargebackAmount.accounting_amount
    const grossVoidAmount = subscriptionVoidAmount.accounting_amount + shopVoidAmount.accounting_amount + tipVoidAmount.accounting_amount

    const grossChargebackCount = subscriptionChargebackAmount.count + shopChargebackAmount.count + tipChargebackAmount.count

    if (grossRevenue === 0 && grossRefundAmount === 0 && grossChargebackAmount === 0 && grossVoidAmount === 0) {
        return false
    }

    const grossDeduction = grossRefundAmount + grossChargebackAmount + grossVoidAmount
    const chargebackPenalty = grossChargebackCount * 25

    const netRevenue = grossRevenue - grossDeduction - chargebackPenalty
    const totalNewTransactions = subscriptionAmount.count + shopAmount.count + tipAmount.count
    const totalVoidTransactions = subscriptionVoidAmount.count + shopVoidAmount.count + tipVoidAmount.count

    const ccbillFeesPercentage = commission.ccbill_fees
    const ccbillFixedCharge = parseFloat(commission.ccbill_transaction_charge)

    const ccbillFees = (((grossRevenue - grossVoidAmount) * ccbillFeesPercentage) / 100)
    const ccbillFixedFees = ((totalNewTransactions - totalVoidTransactions) * ccbillFixedCharge)
    const ccbillTotalFees = ccbillFees + ccbillFixedFees

    const revenueCollected = netRevenue - ccbillTotalFees

    // Added as of 8th February. This is the fixed percentage for MG on overall amount.
    const fixedMGFees = revenueCollected * 0.006
    const ccbillTotalFeesIncludingMG = ccbillTotalFees + fixedMGFees

    const updatedRevenueCollected = revenueCollected - fixedMGFees

    const platformCommissionPercentage = commission.platform_commission

    const platformCommissionAmount = (platformCommissionPercentage / 100) * updatedRevenueCollected
    const model_earning = (100 - platformCommissionPercentage) * updatedRevenueCollected / 100
    const referralData = await getWebsiteDomainReferralForDate(domain, date)

    let referralAmount = 0
    let referralAmount1 = 0
    let referralAmount2 = 0
    if (referralData !== null && referralData !== false) {
        if (referralData.total_referral > 0) {
            referralAmount = calculateReferralAmount(referralData.referral_commission, updatedRevenueCollected)
            if (referralData.total_referral > 1) {
                referralAmount1 = calculateReferralAmount(referralData.referral_commission1, updatedRevenueCollected)
                if (referralData.total_referral > 2) {
                    referralAmount2 = calculateReferralAmount(referralData.referral_commission2, updatedRevenueCollected)
                }
            }
        }
    }

    const data = {
        domain: domain,
        target_date: date,
        subscription_sub_account: subscriptionSubAccount,
        shop_sub_account: shopSubAccount,
        tip_sub_account: tipSubAccount,
        platform_commission: platformCommissionPercentage,
        ccbill_commission: ccbillFeesPercentage,
        subscription_amount: subscriptionAmount.accounting_amount,
        subscription_refund_amount: subscriptionRefundAmount.accounting_amount,
        subscription_chargeback_amount: subscriptionChargebackAmount.accounting_amount,
        subscription_chargeback_count: subscriptionChargebackAmount.count,
        subscription_void_amount: subscriptionVoidAmount.accounting_amount,
        shop_amount: shopAmount.accounting_amount,
        shop_refund_amount: shopRefundAmount.accounting_amount,
        shop_chargeback_amount: shopChargebackAmount.accounting_amount,
        shop_chargeback_count: shopChargebackAmount.count,
        shop_void_amount: shopVoidAmount.accounting_amount,
        tip_amount: tipAmount.accounting_amount,
        tip_refund_amount: tipRefundAmount.accounting_amount,
        tip_chargeback_amount: tipChargebackAmount.accounting_amount,
        tip_chargeback_count: tipChargebackAmount.count,
        tip_void_amount: tipVoidAmount.accounting_amount,
        gross_revenue: grossRevenue,
        gross_refund: grossDeduction,
        chargeback_amount: grossChargebackAmount,
        chargeback_count: grossChargebackCount,
        chargeback_penalty: chargebackPenalty,
        refund_amount: grossRefundAmount,
        void_amount: grossVoidAmount,
        net_revenue: netRevenue,
        ccbill_charge: ccbillTotalFeesIncludingMG,
        fixed_mg_fees: fixedMGFees,
        revenue_collected: updatedRevenueCollected,
        platform_earning: platformCommissionAmount,
        model_earning: model_earning,
        created_at: new Date(),
        updated_at: new Date(),
        referral_history_id: (referralData !== null) ? referralData._id : null,
        referral_amount: referralAmount,
        referral_amount1: referralAmount1,
        referral_amount2: referralAmount2,
        payment_gateway: 'ccbill',
        subscription_count: subscriptionAmount.count,
        subscription_refund_count: subscriptionRefundAmount.count,
        subscription_void_count: subscriptionVoidAmount.count,
        shop_count: shopAmount.count,
        shop_refund_count: shopRefundAmount.count,
        shop_void_count: shopVoidAmount.count,
        tip_count: tipAmount.count,
        tip_refund_count: tipRefundAmount.count,
        tip_void_count: tipVoidAmount.count
    }

    return new Promise((resolve, reject) => {
        resolve(data)
    })
}

/**
 * calculate and generate earning report
 *
 * @param {string} domain domain
 * @param {string} date date
 * @returns {earningReport | boolean} Earning Report
 */
async function generateDateWiseEarningForDomainWithFixedChargeWithReferral(domain, date) {
    const commission = await getCommissionForDomainForDate(domain, date)
    if (commission === false) {
        console.log('commission not found for domain:', domain, 'for date:', date)
        return false
    }

    const websiteData = await Website.findOne({
        website_url: domain
    }, 'subscription_sub_account shop_sub_account tip_sub_account platform_commission ccbill_charge')

    const subscriptionSubAccount = websiteData.subscription_sub_account
    const shopSubAccount = websiteData.shop_sub_account
    const tipSubAccount = websiteData.tip_sub_account

    const referralUserCCBillTransactions = await generateDateWiseEarningForDomainWithFixedChargeForReferralUser(subscriptionSubAccount, shopSubAccount, tipSubAccount, domain, date)

    const subscriptionAmount = await getSumWithTypeAndSubAccountOfDateWithoutReferral(subscriptionSubAccount, [NEW, REBILL], date, date)
    const subscriptionRefundAmount = await getSumWithTypeAndSubAccountOfDateWithoutReferral(subscriptionSubAccount, [REFUND], date, date)
    const subscriptionChargebackAmount = await getSumWithTypeAndSubAccountOfDateWithoutReferral(subscriptionSubAccount, [CHARGEBACK], date, date)
    const subscriptionVoidAmount = await getSumWithTypeAndSubAccountOfDateWithoutReferral(subscriptionSubAccount, [VOID], date, date)

    const shopAmount = await getSumWithTypeAndSubAccountOfDateWithoutReferral(shopSubAccount, [NEW, REBILL], date, date)
    const shopRefundAmount = await getSumWithTypeAndSubAccountOfDateWithoutReferral(shopSubAccount, [REFUND], date, date)
    const shopChargebackAmount = await getSumWithTypeAndSubAccountOfDateWithoutReferral(shopSubAccount, [CHARGEBACK], date, date)
    const shopVoidAmount = await getSumWithTypeAndSubAccountOfDateWithoutReferral(shopSubAccount, [VOID], date, date)

    const tipAmount = await getSumWithTypeAndSubAccountOfDateWithoutReferral(tipSubAccount, [NEW, REBILL], date, date)
    const tipRefundAmount = await getSumWithTypeAndSubAccountOfDateWithoutReferral(tipSubAccount, [REFUND], date, date)
    const tipChargebackAmount = await getSumWithTypeAndSubAccountOfDateWithoutReferral(tipSubAccount, [CHARGEBACK], date, date)
    const tipVoidAmount = await getSumWithTypeAndSubAccountOfDateWithoutReferral(tipSubAccount, [VOID], date, date)

    const grossRevenue = subscriptionAmount.accounting_amount + shopAmount.accounting_amount + tipAmount.accounting_amount
    const grossRefundAmount = subscriptionRefundAmount.accounting_amount + shopRefundAmount.accounting_amount + tipRefundAmount.accounting_amount
    const grossChargebackAmount = subscriptionChargebackAmount.accounting_amount + shopChargebackAmount.accounting_amount + tipChargebackAmount.accounting_amount
    const grossVoidAmount = subscriptionVoidAmount.accounting_amount + shopVoidAmount.accounting_amount + tipVoidAmount.accounting_amount

    const grossChargebackCount = subscriptionChargebackAmount.count + shopChargebackAmount.count + tipChargebackAmount.count

    if (grossRevenue === 0 && grossRefundAmount === 0 && grossChargebackAmount === 0 && grossVoidAmount === 0) {
        return false
    }

    const grossDeduction = grossRefundAmount + grossChargebackAmount + grossVoidAmount
    const chargebackPenalty = grossChargebackCount * 25

    const netRevenue = grossRevenue - grossDeduction - chargebackPenalty
    const totalNewTransactions = subscriptionAmount.count + shopAmount.count + tipAmount.count
    const totalVoidTransactions = subscriptionVoidAmount.count + shopVoidAmount.count + tipVoidAmount.count

    const ccbillFeesPercentage = commission.ccbill_fees
    const ccbillFixedCharge = parseFloat(commission.ccbill_transaction_charge)

    const ccbillFees = (((grossRevenue - grossVoidAmount) * ccbillFeesPercentage) / 100)
    const ccbillFixedFees = ((totalNewTransactions - totalVoidTransactions) * ccbillFixedCharge)
    const ccbillTotalFees = ccbillFees + ccbillFixedFees

    const revenueCollected = netRevenue - ccbillTotalFees

    // Added as of 8th February. This is the fixed percentage for MG on overall amount.
    const fixedMGFees = revenueCollected * 0.006
    const ccbillTotalFeesIncludingMG = ccbillTotalFees + fixedMGFees

    const updatedRevenueCollected = revenueCollected - fixedMGFees

    const platformCommissionPercentage = commission.platform_commission

    const platformCommissionAmount = (platformCommissionPercentage / 100) * updatedRevenueCollected
    const model_earning = (100 - platformCommissionPercentage) * updatedRevenueCollected / 100
    const referralData = await getWebsiteDomainReferralForDate(domain, date)

    let referralAmount = 0
    let referralAmount1 = 0
    let referralAmount2 = 0
    if (referralData !== null && referralData !== false) {
        if (referralData.total_referral > 0) {
            referralAmount = calculateReferralAmount(referralData.referral_commission, updatedRevenueCollected)
            if (referralData.total_referral > 1) {
                referralAmount1 = calculateReferralAmount(referralData.referral_commission1, updatedRevenueCollected)
                if (referralData.total_referral > 2) {
                    referralAmount2 = calculateReferralAmount(referralData.referral_commission2, updatedRevenueCollected)
                }
            }
        }
    }

    const data = {
        domain: domain,
        target_date: date,
        subscription_sub_account: subscriptionSubAccount,
        shop_sub_account: shopSubAccount,
        tip_sub_account: tipSubAccount,
        platform_commission: platformCommissionPercentage,
        ccbill_commission: ccbillFeesPercentage,
        subscription_amount: subscriptionAmount.accounting_amount + referralUserCCBillTransactions.subscriptionAmount,
        subscription_refund_amount: subscriptionRefundAmount.accounting_amount + referralUserCCBillTransactions.subscriptionRefundAmount,
        subscription_chargeback_amount: subscriptionChargebackAmount.accounting_amount + referralUserCCBillTransactions.subscriptionChargebackAmount,
        subscription_chargeback_count: subscriptionChargebackAmount.count + referralUserCCBillTransactions.subscriptionChargebackCount,
        subscription_void_amount: subscriptionVoidAmount.accounting_amount + referralUserCCBillTransactions.subscriptionVoidAmount,
        shop_amount: shopAmount.accounting_amount + referralUserCCBillTransactions.shopAmount,
        shop_refund_amount: shopRefundAmount.accounting_amount + referralUserCCBillTransactions.shopRefundAmount,
        shop_chargeback_amount: shopChargebackAmount.accounting_amount + referralUserCCBillTransactions.shopChargebackAmount,
        shop_chargeback_count: shopChargebackAmount.count + referralUserCCBillTransactions.shopChargebackCount,
        shop_void_amount: shopVoidAmount.accounting_amount + referralUserCCBillTransactions.shopVoidAmount,
        tip_amount: tipAmount.accounting_amount + referralUserCCBillTransactions.tipAmount,
        tip_refund_amount: tipRefundAmount.accounting_amount + referralUserCCBillTransactions.tipRefundAmount,
        tip_chargeback_amount: tipChargebackAmount.accounting_amount + referralUserCCBillTransactions.tipChargebackAmount,
        tip_chargeback_count: tipChargebackAmount.count + referralUserCCBillTransactions.tipChargebackCount,
        tip_void_amount: tipVoidAmount.accounting_amount + referralUserCCBillTransactions.tipVoidAmount,
        gross_revenue: grossRevenue + referralUserCCBillTransactions.grossRevenue,
        gross_refund: grossDeduction + referralUserCCBillTransactions.grossDeduction,
        chargeback_amount: grossChargebackAmount + referralUserCCBillTransactions.grossChargebackAmount,
        chargeback_count: grossChargebackCount + referralUserCCBillTransactions.grossChargebackCount,
        chargeback_penalty: chargebackPenalty + referralUserCCBillTransactions.chargebackPenalty,
        refund_amount: grossRefundAmount + referralUserCCBillTransactions.grossRefundAmount,
        void_amount: grossVoidAmount + referralUserCCBillTransactions.grossVoidAmount,
        net_revenue: netRevenue + referralUserCCBillTransactions.netRevenue,
        ccbill_charge: ccbillTotalFeesIncludingMG + referralUserCCBillTransactions.ccbillTotalFeesIncludingMG,
        fixed_mg_fees: fixedMGFees + referralUserCCBillTransactions.fixedMGFees,
        revenue_collected: updatedRevenueCollected + referralUserCCBillTransactions.updatedRevenueCollected,
        platform_earning: platformCommissionAmount + referralUserCCBillTransactions.platformCommissionAmount,
        model_earning: model_earning + referralUserCCBillTransactions.model_earning,
        created_at: new Date(),
        updated_at: new Date(),
        referral_history_id: (referralData !== null) ? referralData._id : null,
        referral_amount: referralAmount + referralUserCCBillTransactions.referralAmount,
        referral_amount1: referralAmount1 + referralUserCCBillTransactions.referralAmount1,
        referral_amount2: referralAmount2 + referralUserCCBillTransactions.referralAmount2,
        payment_gateway: 'ccbill',
        subscription_count: subscriptionAmount.count + referralUserCCBillTransactions.subscriptionCount,
        subscription_refund_count: subscriptionRefundAmount.count + referralUserCCBillTransactions.subscriptionRefundCount,
        subscription_void_count: subscriptionVoidAmount.count + referralUserCCBillTransactions.subscriptionVoidCount,
        shop_count: shopAmount.count + referralUserCCBillTransactions.shopCount,
        shop_refund_count: shopRefundAmount.count + referralUserCCBillTransactions.shopRefundCount,
        shop_void_count: shopVoidAmount.count + referralUserCCBillTransactions.shopVoidCount,
        tip_count: tipAmount.count + referralUserCCBillTransactions.tipCount,
        tip_refund_count: tipRefundAmount.count + referralUserCCBillTransactions.tipRefundCount,
        tip_void_count: tipVoidAmount.count + referralUserCCBillTransactions.tipVoidCount,
        link_tracking_referral_history_id: (referralUserCCBillTransactions.referralData !== null) ? referralUserCCBillTransactions.referralData._id : null
    }

    return new Promise((resolve, reject) => {
        resolve(data)
    })
}

/**
 *
 * @param {string} subscriptionSubAccount subscription sub account number
 * @param {string} shopSubAccount shop sub account number
 * @param {string} tipSubAccount tip sub account number
 * @param {string} domain domain
 * @param {string} date date
 * @param {object} commission commission
 * @returns {object} referral earning data
 */
async function generateDateWiseEarningForDomainWithFixedChargeForReferralUser(subscriptionSubAccount, shopSubAccount, tipSubAccount, domain, date, commission) {
    const subscriptionAmount = await getSumWithTypeAndSubAccountOfDateForReferral(subscriptionSubAccount, [NEW, REBILL, REFUND, CHARGEBACK, VOID], date, date, 'subscription', commission, domain)

    const shopAmount = await getSumWithTypeAndSubAccountOfDateForReferral(shopSubAccount, [NEW, REBILL, REFUND, CHARGEBACK, VOID], date, date, 'shop', commission, domain)

    const tipAmount = await getSumWithTypeAndSubAccountOfDateForReferral(tipSubAccount, [NEW, REBILL, REFUND, CHARGEBACK, VOID], date, date, 'tip', commission, domain)

    const grossRevenue = subscriptionAmount.grossRevenue + shopAmount.grossRevenue + tipAmount.grossRevenue
    const grossRefundAmount = subscriptionAmount.grossRefundAmount + shopAmount.grossRefundAmount + tipAmount.grossRefundAmount
    const grossChargebackAmount = subscriptionAmount.grossChargebackAmount + shopAmount.grossChargebackAmount + tipAmount.grossChargebackAmount
    const grossVoidAmount = subscriptionAmount.grossVoidAmount + shopAmount.grossVoidAmount + tipAmount.grossVoidAmount

    const netRevenue = subscriptionAmount.netRevenue + shopAmount.netRevenue + tipAmount.netRevenue
    const updatedRevenueCollected = subscriptionAmount.updatedRevenueCollected + shopAmount.updatedRevenueCollected + tipAmount.updatedRevenueCollected
    const platformCommissionAmount = subscriptionAmount.platformCommissionAmount + shopAmount.platformCommissionAmount + tipAmount.platformCommissionAmount
    const model_earning = subscriptionAmount.model_earning + shopAmount.model_earning + tipAmount.model_earning

    const grossDeduction = grossRefundAmount + grossChargebackAmount + grossVoidAmount

    const referralEarning = subscriptionAmount.referralEarning + shopAmount.referralEarning + tipAmount.referralEarning
    const referralEarning1 = subscriptionAmount.referralEarning1 + shopAmount.referralEarning1 + tipAmount.referralEarning1
    const referralEarning2 = subscriptionAmount.referralEarning2 + shopAmount.referralEarning2 + tipAmount.referralEarning2

    const chargebackPenalty = subscriptionAmount.totalChargebackPenalty + shopAmount.totalChargebackPenalty + tipAmount.totalChargebackPenalty
    const ccbillTotalFeesIncludingMG = subscriptionAmount.ccbillTotalFeesIncludingMG + shopAmount.ccbillTotalFeesIncludingMG + tipAmount.ccbillTotalFeesIncludingMG
    const fixedMGFees = subscriptionAmount.fixedMGFees + shopAmount.fixedMGFees + tipAmount.fixedMGFees

    return {
        grossRevenue: grossRevenue,
        grossRefundAmount: grossRefundAmount,
        grossChargebackAmount: grossChargebackAmount,
        grossVoidAmount: grossVoidAmount,
        subscriptionAmount: subscriptionAmount.grossRevenue,
        subscriptionRefundAmount: subscriptionAmount.grossRefundAmount,
        subscriptionChargebackAmount: subscriptionAmount.grossChargebackAmount,
        subscriptionChargebackCount: subscriptionAmount.totalChargebackCount,
        subscriptionVoidAmount: subscriptionAmount.grossVoidAmount,
        shopAmount: shopAmount.grossRevenue,
        shopRefundAmount: shopAmount.grossRefundAmount,
        shopChargebackAmount: shopAmount.grossChargebackAmount,
        shopChargebackCount: shopAmount.totalChargebackCount,
        shopVoidAmount: shopAmount.grossVoidAmount,
        tipAmount: tipAmount.grossRevenue,
        tipRefundAmount: tipAmount.grossRefundAmount,
        tipChargebackAmount: tipAmount.grossChargebackAmount,
        tipChargebackCount: tipAmount.totalChargebackCount,
        tipVoidAmount: tipAmount.grossVoidAmount,
        netRevenue: netRevenue,
        updatedRevenueCollected: updatedRevenueCollected,
        platformCommissionAmount: platformCommissionAmount,
        model_earning: model_earning,
        referralEarning: referralEarning,
        referralEarning1: referralEarning1,
        referralEarning2: referralEarning2,
        subscriptionCount: subscriptionAmount.totalTransactionCount,
        subscriptionRefundCount: subscriptionAmount.totalRefundCount,
        subscriptionVoidCount: subscriptionAmount.totalVoidCount,
        shopCount: shopAmount.totalTransactionCount,
        shopRefundCount: shopAmount.totalRefundCount,
        shopVoidCount: shopAmount.totalVoidCount,
        tipCount: tipAmount.totalTransactionCount,
        tipRefundCount: tipAmount.totalRefundCount,
        tipVoidCount: tipAmount.totalVoidCount,
        chargebackPenalty: chargebackPenalty,
        grossDeduction: grossDeduction,
        ccbillTotalFeesIncludingMG: ccbillTotalFeesIncludingMG,
        referralData: subscriptionAmount.referralData,
        fixedMGFees: fixedMGFees
    }
}

/**
 * Add monthly earning in websites
 *
 */
async function addMonthlyEarningInWebsites() {
    try {
        const lastEarning = await WebsiteEarningReports.findOne({}, 'target_date').sort({ target_date: -1 })
        const target_date = new Date(lastEarning.target_date)
        await calculateMonthlyRevenue(target_date)
    } catch (error) {
        console.error(error)
    }
}

/**
 * Calculate Monthly Earning Revenue of Database
 */
async function calculatingMonthlyEarningRevenueByDatabase() {
    try {
        console.log('Start calculating monthly earning revenue by database')
        console.time('Calculate monthly earning revenue by database')
        const database = await Database.find({}, 'monthly_earning')
        for (let index = 0; index < database.length; index++) {
            const databaseID = database[index]._id
            const data = await Website.aggregate([
                {
                    '$match': {
                        'database_id': new mongoose.Types.ObjectId(databaseID)
                    }
                }, {
                    '$group': {
                        '_id': '$database_id',
                        'monthly_earning': {
                            '$sum': '$monthly_earning'
                        }
                    }
                }
            ])

            if (!_.isEmpty(data)) {
                const monthly_earning = _.get(data[0], 'monthly_earning', 0)
                database[index].monthly_earning = monthly_earning
                await database[index].save()
            }
        }
        console.timeEnd('Calculate monthly earning revenue by database')
    } catch (error) {
        console.error(error)
        console.timeEnd('Calculate monthly earning revenue by database')
    }
}

/**
 * Calculate Monthly Earning Revenue of Server
 */
async function calculatingMonthlyEarningRevenueByServer() {
    try {
        console.log('Start calculating monthly earning revenue by server')
        console.time('Calculate monthly earning revenue by server')
        const servers = await Server.find({}, 'name monthly_earning')
        for (let index = 0; index < servers.length; index++) {
            const serverID = servers[index]._id
            const data = await Website.aggregate([
                {
                    '$match': {
                        'server_id': new mongoose.Types.ObjectId(serverID)
                    }
                }, {
                    '$group': {
                        '_id': '$server_id',
                        'monthly_earning': {
                            '$sum': '$monthly_earning'
                        }
                    }
                }
            ])
            if (!_.isEmpty(data)) {
                const monthly_earning = _.get(data[0], 'monthly_earning', 0)
                servers[index].monthly_earning = monthly_earning
                await servers[index].save()
            }
        }
        console.timeEnd('Calculate monthly earning revenue by server')
    } catch (error) {
        console.error(error)
        console.timeEnd('Calculate monthly earning revenue by server')
    }
}

/**
 * Try and fetch the website commission for current date
 *
 * @param {Date} startDate Current date
 * @param {boolean} dryRun Save updated commissions or not
 *
 * @returns {*} void
 */
async function getWebsiteCommission(startDate, dryRun = true) {
    try {
        const startMoment = moment(startDate)
        const targetDate = startMoment.format('YYYY-MM-DDT00:00:00.000Z')
        const target_date = moment(targetDate).format('YYYY-MM-DD 00:00:00')
        const rows = await Website.find({}, 'website_url')

        for (let index = 0; index < rows.length; index++) {
            const website = rows[index]
            const domain = website.website_url
            const commission = await getStickyIoCommissionForDomainForDate(domain, target_date)

            if (commission === null || commission.sticky_io_charges.length === 0) {
                console.log('commission not found for domain:', domain, 'for date:', target_date)

                if (dryRun === 'false') {
                    let website_commission = await WebsiteCommission.findOne({
                        domain: domain,
                        target_date: { $lte: target_date }
                    }).sort({ target_date: -1 })

                    if (website_commission !== null) {
                        website_commission.sticky_io_charges = [
                            {
                                'payment_gateway': 'ecsuite',
                                'model_per_transaction_fixed_charge': '0',
                                'model_per_transaction_percentage_charge': '6.95',
                                'new_per_transaction_fixed_charge': '0.36',
                                'new_per_transaction_percentage_charge': '4.35',
                                'void_per_transaction_fixed_charge': '0.06',
                                'void_per_transaction_percentage_charge': '0',
                                'refund_per_transaction_fixed_charge': '0.06',
                                'refund_per_transaction_percentage_charge': '0',
                                'declined_per_transaction_fixed_charge': '0',
                                'declined_per_transaction_percentage_charge': '0',
                                'chargeback_penalty': '25',
                                'notes': ''
                            },
                            {
                                'payment_gateway': 'spoton',
                                'model_per_transaction_fixed_charge': '0',
                                'model_per_transaction_percentage_charge': '6.95',
                                'new_per_transaction_fixed_charge': '0.20',
                                'new_per_transaction_percentage_charge': '6.15',
                                'void_per_transaction_fixed_charge': '0',
                                'void_per_transaction_percentage_charge': '-6.15',
                                'refund_per_transaction_fixed_charge': '0',
                                'refund_per_transaction_percentage_charge': '0',
                                'declined_per_transaction_fixed_charge': '0',
                                'declined_per_transaction_percentage_charge': '0',
                                'chargeback_penalty': '20',
                                'notes': 'New Transaction Charge: Authorize.net $0.05 + SpotOn: 0.15 = 0.20'
                            }
                        ]

                        await website_commission.save()
                        console.log('Added missing sticky.io website commission')
                    } else {
                        console.log('-----COMMISSION DOES NOT EXIST:', domain, '-----')
                    }
                }
            }
        }

        return
    } catch (error) {
        console.log('Error')
        console.log(error)
    }
}

module.exports = {
    generateDailyEarningReportByDate,
    generateDailyEarningReportWithRange,
    getCommissionForDomainForDate,
    generateDailyEarningReportOfDomainWithRange,
    addMonthlyEarningInWebsites,
    getWebsiteCommission,
    generateDailyEarningReportByDateForReferral
}
