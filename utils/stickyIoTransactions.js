const moment = require('moment')
const _ = require('lodash')
const { NEW, REBILL, VOID, REFUND, CHARGEBACK, SUBSCRIPTION, CONTENT_PURCHASE, SHOP_PURCHASE, DECLINED, SUBSCRIPTION_WITH_ADD_CARD } = require('./../constants')
const Website = require('./../models/Website')
const StickyIoTransactions = require('./../models/StickyIoTransactions')
const StickyIoTransactionsReport = require('./../models/StickyIoTransactionReport')
const WebsiteEarningReports = require('./../models/WebsiteDailyEarningReport')
const WebsiteReferralEarningReports = require('./../models/WebsiteReferralDailyEarningReport')
const WebsiteCommission = require('./../models/WebsiteCommission')
const WebsiteReferralHistory = require('./../models/WebsiteReferralHistory')
const StickyIoTransactionReport = require('../models/StickyIoTransactionReport')
const { getReferralDataFromWebsite } = require('./linkTrackingReferral')
const axios = require('axios')
const { getWebsiteDomain } = require('./getWebsiteDomain')

/**
 * @description Daily CSV Imported Transaction analysis
 * @param {string} targetDate target Date (Date format: YYYY-MM-DD)
 */
async function stickyIoDailyTransactionAnalysis(targetDate) {
    const transactionStartDate = moment(targetDate).format('YYYY-MM-DD 00:00:00+00:00')
    const transactionEndDate = moment(targetDate).format('YYYY-MM-DD 23:59:59+00:00')

    const where = {
        order_date_time: {
            $gte: new Date(transactionStartDate),
            $lte: new Date(transactionEndDate)
        }
    }

    const transactions = await StickyIoTransactions.find(where)
    if (transactions.length > 0) {
        await stickyIoTransactionAnalysis(transactions)
    }
}

/**
 * @description Delete transaction before insert if exist
 * @param {string} transaction_type Delete transaction type
 * @param {object} transaction_data Transaction Data
 */
async function deleteStickyIoTransactionsReport(transaction_type, transaction_data) {
    const filter = {
        transaction_type: transaction_type,
        campaign_id: transaction_data.campaign_id,
        product_id: transaction_data.product_id,
        order_id: transaction_data.order_id
    }
    await StickyIoTransactionsReport.deleteMany(filter)
}

/**
 * @description Analysis of given row transaction array for daily earning calculation
 * @param {Array} transactions Transactions
 */
async function stickyIoTransactionAnalysis(transactions) {
    for (const transaction of transactions) {
        const websiteInfo = await Website.findOne({ sticky_io_campaign_id: transaction.campaign_id }, 'website_url')
        if (transaction.order_status === NEW) {
            await addNewAndRebillTransaction(transaction, websiteInfo)
        } else if (transaction.order_status === 'VOID/REFUNDED') {
            await addVoidRefundTransaction(transaction, websiteInfo)
        } else if (transaction.order_status === 'DECLINED') {
            await addDeclinedTransaction(transaction, websiteInfo)
        }
    }
}

/**
 * @description Add New and Rebill transaction
 * @param {object} transaction Transaction Details
 * @param {object} websiteInfo Website Info
 */
async function addNewAndRebillTransaction(transaction, websiteInfo) {
    const website_url = websiteInfo !== null ? websiteInfo.website_url : ''
    const transaction_type = transaction.ancestor_order_id === '0' ? NEW : REBILL
    const pcp_transaction_type = transaction_type === NEW ? transaction.pcp_transaction_type : 'subscription'

    await deleteStickyIoTransactionsReport(transaction_type, transaction)
    const transaction_date = transaction.order_date_time
    await saveTransaction(transaction_type, pcp_transaction_type, transaction.order_total, website_url, transaction_date, transaction)

    // Insert Chargeback transaction
    if (transaction.is_chargeback === 'YES') {
        await deleteStickyIoTransactionsReport(CHARGEBACK, transaction)
        const transaction_date = moment(transaction.chargeback_date, 'MM/DD/YYYY').format('YYYY-MM-DD 00:00:00+00:00')
        const pcp_transaction_type = CHARGEBACK
        await saveTransaction(CHARGEBACK, pcp_transaction_type, transaction.order_total, website_url, transaction_date, transaction)
    }
}

/**
 * @description Add Void/Refund Transaction
 * @param {object} transaction Transaction Details
 * @param {object} websiteInfo Website Info
 */
async function addVoidRefundTransaction(transaction, websiteInfo) {
    const website_url = websiteInfo !== null ? websiteInfo.website_url : ''

    // Insert New Transaction
    await deleteStickyIoTransactionsReport(NEW, transaction)
    await saveTransaction(NEW, transaction.pcp_transaction_type, transaction.order_total, website_url, transaction.order_date_time, transaction)

    // Insert refund/void transaction
    const transaction_type = transaction.is_void === 'YES' ? VOID : REFUND
    const transaction_date = transaction_type === VOID ? transaction.void_date : transaction.refund_date
    const transactionAmount = transaction_type === VOID ? transaction.void_amount : transaction.refund_amount
    let void_refund_transaction_date = moment(transaction_date, 'MM/DD/YYYY').format('YYYY-MM-DD 00:00:00+00:00')

    // Bug: In the sticky.io earning report the refund and void transactions are missing, so refund and void are not considered in the website's daily earning report.
    // Fix: Considered Refund transactions before 24-12-2022 will be considered on the same day of the refund transaction but in Jan-2023. (i.e. if the refund transaction date is 10-11-2022 then it will consider 10-01-2023 in our system.)
    if (moment(void_refund_transaction_date) < moment('2022-12-24 23:59:59+00:00')) {
        void_refund_transaction_date = moment(transaction_date, 'MM/DD/YYYY').format('2023-01-DD 00:00:00+00:00')
    }

    await deleteStickyIoTransactionsReport(transaction_type, transaction)
    await saveTransaction(transaction_type, transaction.pcp_transaction_type, transactionAmount, website_url, void_refund_transaction_date, transaction)
}

/**
 * @description Add Void/Refund Transaction
 * @param {object} transaction Transaction Details
 * @param {object} websiteInfo Website Info
 */
async function addDeclinedTransaction(transaction, websiteInfo) {
    const website_url = websiteInfo !== null ? websiteInfo.website_url : ''

    await deleteStickyIoTransactionsReport(DECLINED, transaction)
    await saveTransaction(DECLINED, transaction.pcp_transaction_type, transaction.order_total, website_url, transaction.order_date_time, transaction)
}

/**
 * @description Save transaction
 * @param {string} transaction_type Transaction Type
 * @param {string} pcp_transaction_type PCP transaction Type
 * @param {string} amount Transaction Amount
 * @param {string} website_url Website Url
 * @param {string} transaction_date Transaction Date
 * @param {object} transaction Transaction details
 */
async function saveTransaction(transaction_type, pcp_transaction_type, amount, website_url, transaction_date, transaction) {
    const transactionData = {
        transaction_type: transaction_type,
        amount: amount,
        transaction_date: transaction_date,
        website_url: website_url,
        pcp_transaction_type: pcp_transaction_type,
        pcp_user_id: transaction.pcp_user_id,
        campaign_id: transaction.campaign_id,
        product_id: transaction.product_id,
        order_id: transaction.order_id,
        first_name: transaction.bill_first_name,
        last_name: transaction.bill_last_name,
        email: transaction.bill_email,
        card_type: transaction.payment,
        is_recurring: transaction.is_recurring,
        pcp_transaction_id: transaction.pcp_transaction_id,
        transaction_number: transaction.transaction_number,
        auth_number: transaction.auth_number,
        transaction_payment_gateway: transaction.payment_gateway,
        is_cascaded: transaction.is_cascaded,
        original_gateway_id: transaction.original_gateway_id,
        original_decline_reason: transaction.original_decline_reason,
        gateway_id: transaction.gateway_id
    }
    const responseData = await getReferralDataFromWebsite(transaction.order_id, website_url, 'sticky.io')

    if (!_.isEmpty(responseData) && responseData.success === 1 && !_.isEmpty(responseData.data) && !_.isEmpty(responseData.data.referral)) {
        transactionData.tracking_link = responseData.data.referral
    }
    const transactionDataReport = new StickyIoTransactionsReport(transactionData)
    await transactionDataReport.save()
}

/**
 * @description Delete all sticky.io earning reports
 * @param {string} domain Domain name
 * @param {string} date date (Date format: YYYY-MM-DD)
 * @param {string} payment_gateway Payment Gateway
 * @param {string} sticky_io_payment_gateway Sticky io Payment Gateway
 * @returns {number} Total deleted record count
 */
async function deleteStickyIoDailyEarningReportByDomainAndDateAndPaymentGateway(domain, date, payment_gateway, sticky_io_payment_gateway) {
    const transactionStartDate = moment(date).format('YYYY-MM-DD 00:00:00+00:00')
    const transactionEndDate = moment(date).format('YYYY-MM-DD 00:00:00+00:00')
    const deleteTransaction = await WebsiteEarningReports.deleteMany({
        domain: domain,
        payment_gateway: payment_gateway,
        sticky_io_payment_gateway: sticky_io_payment_gateway,
        target_date: {
            $gte: new Date(transactionStartDate),
            $lte: new Date(transactionEndDate)
        }
    })

    return deleteTransaction.deletedCount
}

/**
 * @description Generate Daily Earning report for sticky.io transactions
 * @param {string} date Date (Date format: YYYY-MM-DD)
 */
async function generateStickyIoDailyEarningReportByDate(date) {
    console.time('generateStickyIoDailyEarningReportByDate')
    try {
        const websites = await Website.find({ payment_gateway: { $in: ['sticky.io', 'hybrid'] } }, 'website_url')
        let totalReportGenerated = 0
        for (const website of websites) {
            const isReportGenerated = await generateDailyEarningReportForDomainByDate(website.website_url, date)
            if (isReportGenerated === true) {
                console.log('report Generated for ', website.website_url)
                totalReportGenerated++
            }
        }
        console.log('total Report Generated:', totalReportGenerated)
    } catch (error) {
        console.log('Error in earning Report generate:', error)
    }
    console.timeEnd('generateStickyIoDailyEarningReportByDate')
}

/**
 * @description Generate Daily Earning report for sticky.io transactions
 * @param {string} domain Domain name
 * @param {string} date Date (Date format: YYYY-MM-DD)
 */
async function generateStickyIoDailyEarningReportByDomainAndDateForReferral(domain, date) {
    console.time('generateStickyIoDailyEarningReportByDomainAndDateForReferral')

    const website = await Website.findOne({ payment_gateway: { $in: ['sticky.io', 'hybrid'] }, website_url: domain }, 'website_url')
    if (website === null) {
        console.log(`Website not found for domain: ${domain}`)
    } else {
        const isReportGenerated = await generateDailyEarningReportForDomainByDateForReferral(website.website_url, date)
        if (isReportGenerated === true) {
            console.log(`Earning Report generated for domain: ${domain}`)
        } else {
            console.log(`Error in Earning Report generate for domain: ${domain}`)
        }
    }
    console.timeEnd('generateStickyIoDailyEarningReportByDomainAndDateForReferral')
}

/**
 * @description Generate Daily Earning report for sticky.io transactions
 * @param {string} domain Domain name
 * @param {string} date Date (Date format: YYYY-MM-DD)
 */
async function generateStickyIoDailyEarningReportByDomainAndDate(domain, date) {
    console.time('generateStickyIoDailyEarningReportByDate')

    const website = await Website.findOne({ payment_gateway: { $in: ['sticky.io', 'hybrid'] }, website_url: domain }, 'website_url')
    if (website === null) {
        console.log(`Website not found for domain: ${domain}`)
    } else {
        const isReportGenerated = await generateDailyEarningReportForDomainByDate(website.website_url, date)
        if (isReportGenerated === true) {
            console.log(`Earning Report generated for domain: ${domain}`)
        } else {
            console.log(`Error in Earning Report generate for domain: ${domain}`)
        }
    }
    console.timeEnd('generateStickyIoDailyEarningReportByDate')
}

/**
 * @description calculate and generate earning report form Domain and date
 * @param {string} domain domain
 * @param {string} date date (Date format: YYYY-MM-DD)
 * @returns {boolean} Earning Report
 */
async function generateDailyEarningReportForDomainByDate(domain, date) {
    const commission = await getStickyIoCommissionForDomainForDate(domain, date)

    if (commission === null || commission.sticky_io_charges.length === 0) {
        console.log('commission not found for domain:', domain, 'for date:', date)
        return false
    }

    const platformCommissionPercentage = parseFloat(commission.platform_commission) || 20
    const stickyIoTransactionCharge = parseFloat(commission.sticky_io_transaction_charge) || 0.25

    const websiteWhere = {
        website_url: domain,
        payment_gateway: { $in: ['sticky.io', 'hybrid'] }
    }
    const websiteFields = { sticky_io_campaign_id: 1 }
    const websiteData = await Website.findOne(websiteWhere, websiteFields)
    const campaign_id = websiteData.sticky_io_campaign_id

    for (const paymentCommissions of commission.sticky_io_charges) {
        // delete daily report before generating
        const payment_gateway = { $in: ['sticky.io', 'hybrid'] }
        const sticky_io_payment_gateway = paymentCommissions.payment_gateway
        const deletedRecord = await deleteStickyIoDailyEarningReportByDomainAndDateAndPaymentGateway(domain, date, payment_gateway, sticky_io_payment_gateway)
        console.log('Records Deleted:', deletedRecord)

        if (moment(date) > moment('2022-02-28T23:59:59.000Z')) {
            // daily earning report with without referral
            await generateDailyEarningByDomainAndPaymentGatewayRealCharge(paymentCommissions, campaign_id, date, domain, platformCommissionPercentage, stickyIoTransactionCharge)
            // daily earning report with referral
            // await generateDailyEarningByDomainAndPaymentGatewayRealChargeWithReferral(paymentCommissions, campaign_id, date, domain, platformCommissionPercentage, stickyIoTransactionCharge)
        } else {
            await generateDailyEarningByDomainAndPaymentGateway(paymentCommissions, campaign_id, date, domain, platformCommissionPercentage, stickyIoTransactionCharge)
        }
    }
    return true
}

/**
 * @description calculate and generate earning report form Domain and date
 * @param {string} domain domain
 * @param {string} date date (Date format: YYYY-MM-DD)
 * @returns {boolean} Earning Report
 */
async function generateDailyEarningReportForDomainByDateForReferral(domain, date) {
    const commission = await getStickyIoCommissionForDomainForDate(domain, date)

    if (commission === null || commission.sticky_io_charges.length === 0) {
        console.log('commission not found for domain:', domain, 'for date:', date)
        return false
    }

    const platformCommissionPercentage = parseFloat(commission.platform_commission) || 20
    const stickyIoTransactionCharge = parseFloat(commission.sticky_io_transaction_charge) || 0.25

    const websiteWhere = {
        website_url: domain,
        payment_gateway: { $in: ['sticky.io', 'hybrid'] }
    }
    const websiteFields = { sticky_io_campaign_id: 1 }
    const websiteData = await Website.findOne(websiteWhere, websiteFields)
    const campaign_id = websiteData.sticky_io_campaign_id

    for (const paymentCommissions of commission.sticky_io_charges) {
        // delete daily report before generating
        const payment_gateway = { $in: ['sticky.io', 'hybrid'] }
        const sticky_io_payment_gateway = paymentCommissions.payment_gateway
        const deletedRecord = await deleteStickyIoDailyEarningReportByDomainAndDateAndPaymentGateway(domain, date, payment_gateway, sticky_io_payment_gateway)
        console.log('Records Deleted:', deletedRecord)

        if (moment(date) > moment('2022-02-28T23:59:59.000Z')) {
            // daily earning report with without referral
            // await generateDailyEarningByDomainAndPaymentGatewayRealCharge(paymentCommissions, campaign_id, date, domain, platformCommissionPercentage, stickyIoTransactionCharge)
            // daily earning report with referral
            await generateDailyEarningByDomainAndPaymentGatewayRealChargeWithReferral(paymentCommissions, campaign_id, date, domain, platformCommissionPercentage, stickyIoTransactionCharge)
        } else {
            await generateDailyEarningByDomainAndPaymentGateway(paymentCommissions, campaign_id, date, domain, platformCommissionPercentage, stickyIoTransactionCharge)
        }
    }
    return true
}

/**
 * @description Generate Daily Earning Report for Website by payment Gateway
 * @param {object} paymentCommissions Payment Gateway Commissions
 * @param {string} campaignId Sticky Io Campaign Id
 * @param {string} date Today Date
 * @param {string} domain Domain name
 * @param {number} platformCommissionPercentage Platform Commission Percentage
 * @param {number} stickyIoTransactionCharge Sticky io transaction fixed charge
 * @returns {boolean} status
 */
async function generateDailyEarningByDomainAndPaymentGateway(paymentCommissions, campaignId, date, domain, platformCommissionPercentage, stickyIoTransactionCharge) {
    const paymentGatewayName = paymentCommissions.payment_gateway
    console.log('started earning report for: domain: ', domain, paymentGatewayName, date)

    // Note: Fixed bug of add_new_card transaction is not consider in earning
    const subscriptionTransaction = (moment(date) > moment('2022-10-18T23:59:59.000Z')) ? SUBSCRIPTION_WITH_ADD_CARD : SUBSCRIPTION
    const subscriptionAmount = await getSumWithTypeAndDate(subscriptionTransaction, [NEW, REBILL], date, date, campaignId, paymentGatewayName)
    const subscriptionRefundAmount = await getSumWithTypeAndDate(subscriptionTransaction, [REFUND], date, date, campaignId, paymentGatewayName)
    const subscriptionChargebackAmount = await getSumWithTypeAndDate(subscriptionTransaction, [CHARGEBACK], date, date, campaignId, paymentGatewayName)
    const subscriptionVoidAmount = await getSumWithTypeAndDate(subscriptionTransaction, [VOID], date, date, campaignId, paymentGatewayName)

    // TODO: Need to change shop amount calculation in phase 2
    const shopAmount = await getSumWithTypeAndDate(SHOP_PURCHASE, [NEW], date, date, campaignId, paymentGatewayName)
    const shopRefundAmount = await getSumWithTypeAndDate(SHOP_PURCHASE, [REFUND], date, date, campaignId, paymentGatewayName)
    const shopChargebackAmount = await getSumWithTypeAndDate(SHOP_PURCHASE, [CHARGEBACK], date, date, campaignId, paymentGatewayName)
    const shopVoidAmount = await getSumWithTypeAndDate(SHOP_PURCHASE, [VOID], date, date, campaignId, paymentGatewayName)

    const tipAmount = await getSumWithTypeAndDate(CONTENT_PURCHASE, [NEW], date, date, campaignId, paymentGatewayName)
    const tipRefundAmount = await getSumWithTypeAndDate(CONTENT_PURCHASE, [REFUND], date, date, campaignId, paymentGatewayName)
    const tipChargebackAmount = await getSumWithTypeAndDate(CONTENT_PURCHASE, [CHARGEBACK], date, date, campaignId, paymentGatewayName)
    const tipVoidAmount = await getSumWithTypeAndDate(CONTENT_PURCHASE, [VOID], date, date, campaignId, paymentGatewayName)

    const declinedTransactions = await getDeclinedTransactionsByCampaignId(date, date, campaignId, paymentGatewayName)

    const grossRevenue = subscriptionAmount.accounting_amount + shopAmount.accounting_amount + tipAmount.accounting_amount
    const grossRefundAmount = subscriptionRefundAmount.accounting_amount + shopRefundAmount.accounting_amount + tipRefundAmount.accounting_amount
    const grossChargebackAmount = subscriptionChargebackAmount.accounting_amount + shopChargebackAmount.accounting_amount + tipChargebackAmount.accounting_amount
    const grossVoidAmount = subscriptionVoidAmount.accounting_amount + shopVoidAmount.accounting_amount + tipVoidAmount.accounting_amount

    const grossChargebackCount = subscriptionChargebackAmount.count + shopChargebackAmount.count + tipChargebackAmount.count
    const newTransactionCount = subscriptionAmount.count + shopAmount.count + tipAmount.count
    const refundTransactionCount = subscriptionRefundAmount.count + shopRefundAmount.count + tipRefundAmount.count
    const voidTransactionCount = subscriptionVoidAmount.count + shopVoidAmount.count + tipVoidAmount.count

    // Payment Gateway Charges on Transactions
    const newTransactionCharge = calculateTotalTransactionCharge(newTransactionCount, grossRevenue, stickyIoTransactionCharge, paymentCommissions.new_per_transaction_fixed_charge, paymentCommissions.new_per_transaction_percentage_charge)

    const voidTransactionCharge = calculateTotalTransactionCharge(voidTransactionCount, grossVoidAmount, stickyIoTransactionCharge, paymentCommissions.void_per_transaction_fixed_charge, paymentCommissions.void_per_transaction_percentage_charge)

    const refundTransactionCharge = calculateTotalTransactionCharge(refundTransactionCount, grossRefundAmount, stickyIoTransactionCharge, paymentCommissions.refund_per_transaction_fixed_charge, paymentCommissions.refund_per_transaction_percentage_charge)

    const declineTransactionCharge = calculateTotalTransactionCharge(declinedTransactions.count, declinedTransactions.accounting_amount, stickyIoTransactionCharge, paymentCommissions.declined_per_transaction_fixed_charge, paymentCommissions.declined_per_transaction_percentage_charge)

    const totalTransactionCount = newTransactionCount + voidTransactionCount + refundTransactionCount + declinedTransactions.count

    const chargebackPenalty = grossChargebackCount * parseFloat(paymentCommissions.chargeback_penalty)

    const totalPaymentGatewayCharge = newTransactionCharge + voidTransactionCharge + refundTransactionCharge + declineTransactionCharge

    const grossDeduction = grossRefundAmount + grossVoidAmount + grossChargebackAmount

    const netRevenue = grossRevenue - (grossDeduction + chargebackPenalty)
    const revenueCollected = grossRevenue - (grossDeduction + chargebackPenalty + totalPaymentGatewayCharge)

    const platformCommissionAmount = (platformCommissionPercentage / 100) * revenueCollected
    const modelEarning = (100 - platformCommissionPercentage) * revenueCollected / 100

    // Note: Fixed bug of only declined transaction not consider in earning report
    let isNoRecordFound = false
    if (moment(date) > moment('2022-10-18T23:59:59.000Z')) {
        isNoRecordFound = (grossRevenue === 0 && grossRefundAmount === 0 && grossChargebackAmount === 0 && grossVoidAmount === 0 && totalPaymentGatewayCharge === 0)
    } else {
        isNoRecordFound = (grossRevenue === 0 && grossRefundAmount === 0 && grossChargebackAmount === 0 && grossVoidAmount === 0)
    }

    if (isNoRecordFound === true) {
        console.log('No records found earning report for: domain: ', domain, paymentGatewayName, date)
        return false
    }

    const referralData = await getWebsiteDomainReferralForDate(domain, date)
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

    // Payment Gateway Model Charge Calculation (from fixed charge)
    const paymentGatewayModelCharge = (((grossRevenue - grossVoidAmount) * parseFloat(paymentCommissions.model_per_transaction_percentage_charge)) / 100) + ((newTransactionCount - voidTransactionCount) * parseFloat(paymentCommissions.model_per_transaction_fixed_charge))
    const revenueCollectedForModel = grossRevenue - (grossDeduction + chargebackPenalty + paymentGatewayModelCharge)
    const platformCommissionAmountForModelFixedCharge = (platformCommissionPercentage / 100) * revenueCollectedForModel
    const modelEarningForFixedCharge = (100 - platformCommissionPercentage) * revenueCollectedForModel / 100

    let referralAmountForFixedCharge = 0
    let referralAmount1ForFixedCharge = 0
    let referralAmount2ForFixedCharge = 0

    if (referralData !== null && referralData !== false) {
        if (referralData.total_referral > 0) {
            referralAmountForFixedCharge = calculateReferralAmount(referralData.referral_commission, revenueCollectedForModel)
            if (referralData.total_referral > 1) {
                referralAmount1ForFixedCharge = calculateReferralAmount(referralData.referral_commission1, revenueCollectedForModel)
                if (referralData.total_referral > 2) {
                    referralAmount2ForFixedCharge = calculateReferralAmount(referralData.referral_commission2, revenueCollectedForModel)
                }
            }
        }
    }

    const charge = {
        domain: domain,
        target_date: date,
        payment_gateway: 'sticky.io',
        sticky_io_payment_gateway: paymentCommissions.payment_gateway,
        platform_commission: platformCommissionPercentage,
        sticky_io_transaction_charge: stickyIoTransactionCharge,
        sticky_io_commission: paymentCommissions.actual_percentage,
        fixed_sticky_io_commission: paymentCommissions.fixed_percentage,
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
        gross_revenue: Number(grossRevenue.toFixed(2)),
        gross_refund: Number(grossDeduction.toFixed(2)),
        chargeback_amount: Number(grossChargebackAmount.toFixed(2)),
        chargeback_count: Number(grossChargebackCount.toFixed(2)),
        chargeback_penalty: Number(chargebackPenalty.toFixed(2)),
        declined_count: Number(declinedTransactions.count.toFixed(2)),
        declined_charges: Number(declineTransactionCharge.toFixed(2)),
        refund_amount: Number(grossRefundAmount.toFixed(2)),
        void_amount: Number(grossVoidAmount.toFixed(2)),
        net_revenue: Number(netRevenue.toFixed(2)),
        revenue_collected: Number(revenueCollected.toFixed(2)),
        platform_earning: Number(platformCommissionAmount.toFixed(2)),
        model_earning: Number(modelEarning.toFixed(2)),
        sticky_io_charge: Number(totalPaymentGatewayCharge.toFixed(2)),
        fixed_sticky_io_charge: Number(paymentGatewayModelCharge.toFixed(2)),
        fixed_model_earning: Number(modelEarningForFixedCharge.toFixed(2)),
        fixed_platform_earning: Number(platformCommissionAmountForModelFixedCharge.toFixed(2)),
        revenue_collected_after_fixed_charge: Number(revenueCollectedForModel.toFixed(2)),
        created_at: new Date(),
        updated_at: new Date(),
        referral_history_id: (referralData !== null) ? referralData._id : null,
        referral_amount: referralAmount,
        referral_amount1: referralAmount1,
        referral_amount2: referralAmount2,
        sticky_io_campaign_id: campaignId,
        referral_amount_for_fixed_charge: referralAmountForFixedCharge,
        referral_amount1_for_fixed_charge: referralAmount1ForFixedCharge,
        referral_amount2_for_fixed_charge: referralAmount2ForFixedCharge,
        gateway_charges: paymentCommissions,
        total_transaction_count: totalTransactionCount,
        sticky_io_transaction_cost: Number((totalTransactionCount * stickyIoTransactionCharge).toFixed(2))
    }
    console.log('report generated for domain:', domain, date, `sticky.io (${paymentCommissions.payment_gateway})`)
    const data = new WebsiteEarningReports(charge)
    await data.save()
}

/**
 * @description Calculate total Transaction charge
 * @param {number} transaction_counts Number of transactions
 * @param {number} transaction_amounts Sum of Transaction amounts
 * @param {string} sticky_io_transaction_charge Sticky.io transaction charge
 * @param {string} fixed_commission payment gateway fixed commission
 * @param {string} percentage_commission payment gateway percentage commission
 * @returns {number} total Charge of transaction
 */
function calculateTotalTransactionCharge(transaction_counts, transaction_amounts, sticky_io_transaction_charge, fixed_commission, percentage_commission) {
    const fixed_sticky_io_charge = transaction_counts * parseFloat(sticky_io_transaction_charge)
    const fixed_payment_gateway_charge = transaction_counts * parseFloat(fixed_commission)
    const percentage_payment_gateway_charge = ((transaction_amounts) * parseFloat(percentage_commission)) / 100
    const total_charge = fixed_sticky_io_charge + fixed_payment_gateway_charge + percentage_payment_gateway_charge

    return total_charge
}

/**
 * @typedef TotalAmount
 * @type {object}
 * @property {number} accounting_amount - an accounting amount sum
 * @property {number} count - an total count
 */
/**
 * To get sum of accounting of product id with transaction type of specified date
 *
 * @param {Array<string>} pcpTransactionType PCP transaction type
 * @param {Array<string>} transactionTypes - NEW,REBILL,CHARGEBACK,VOID
 * @param {string} startDate start date
 * @param {string} endDate end date
 * @param {string} campaignId Sticky.io Campaign Id
 * @param {string} paymentGateway Transaction Payment Gateway
 * @returns {Promise<TotalAmount>} TotalAmounts
 */
async function getSumWithTypeAndDate(pcpTransactionType, transactionTypes, startDate, endDate, campaignId, paymentGateway) {
    const transactionStartDate = moment(startDate).format('YYYY-MM-DD 00:00:00+00:00')
    const transactionEndDate = moment(endDate).format('YYYY-MM-DD 23:59:59+00:00')

    const transactions = await StickyIoTransactionsReport.aggregate([
        {
            $match: {
                transaction_date: { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
                transaction_type: { $in: transactionTypes },
                pcp_transaction_type: { $in: pcpTransactionType },
                campaign_id: campaignId,
                transaction_payment_gateway: paymentGateway
            }
        }, {
            $group: {
                _id: null,
                amount: { $sum: { $toDouble: '$amount' } },
                count: { $sum: 1 }
            }
        }
    ])

    let accounting_amount = 0
    let count = 0
    if (transactions.length > 0) {
        const accountingAmount = transactions[0]
        accounting_amount = accountingAmount.amount
        count = accountingAmount.count
    }
    return {
        accounting_amount: accounting_amount,
        count: count
    }
}

/**
 * @typedef TotalAmount
 * @type {object}
 * @property {number} accounting_amount - an accounting amount sum
 * @property {number} count - an total count
 */
/**
 * To get sum of accounting of product id with transaction type of specified date
 *
 * @param {Array<string>} pcpTransactionType PCP transaction type
 * @param {Array<string>} transactionTypes - NEW,REBILL,CHARGEBACK,VOID
 * @param {string} startDate start date
 * @param {string} endDate end date
 * @param {string} campaignId Sticky.io Campaign Id
 * @param {string} paymentGateway Transaction Payment Gateway
 * @returns {Promise<TotalAmount>} TotalAmounts
 */
async function getSumWithTypeAndDateWithoutReferral(pcpTransactionType, transactionTypes, startDate, endDate, campaignId, paymentGateway) {
    const transactionStartDate = moment(startDate).format('YYYY-MM-DD 00:00:00+00:00')
    const transactionEndDate = moment(endDate).format('YYYY-MM-DD 23:59:59+00:00')

    const transactions = await StickyIoTransactionsReport.aggregate([
        {
            $match: {
                transaction_date: { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
                transaction_type: { $in: transactionTypes },
                pcp_transaction_type: { $in: pcpTransactionType },
                campaign_id: campaignId,
                transaction_payment_gateway: paymentGateway,
                tracking_link: { $exists: false, $eq: '' }
            }
        }, {
            $group: {
                _id: null,
                amount: { $sum: { $toDouble: '$amount' } },
                count: { $sum: 1 }
            }
        }
    ])

    let accounting_amount = 0
    let count = 0
    if (transactions.length > 0) {
        const accountingAmount = transactions[0]
        accounting_amount = accountingAmount.amount
        count = accountingAmount.count
    }
    return {
        accounting_amount: accounting_amount,
        count: count
    }
}

/**
 * To get sum of accounting of product id with transaction type of specified date for referral user
 *
 * @param {Array<string>} pcpTransactionType PCP transaction type
 * @param {Array<string>} transactionTypes - NEW,REBILL,CHARGEBACK,VOID
 * @param {string} startDate start date
 * @param {string} endDate end date
 * @param {string} campaignId Sticky.io Campaign Id
 * @param {string} paymentGateway Transaction Payment Gateway
 * @param {string} domain Domain name
 * @param {number} stickyIoTransactionCharge Sticky io transaction fixed charge
 * @param {object} paymentCommissions Payment Gateway Commissions
 * @param {number} platformCommissionPercentage Platform Commission Percentage
 * @returns {Promise<TotalAmount>} TotalAmounts
 */
async function getSumWithTypeAndDateForReferralUser(pcpTransactionType, transactionTypes, startDate, endDate, campaignId, paymentGateway, domain, stickyIoTransactionCharge, paymentCommissions, platformCommissionPercentage) {
    const transactionStartDate = moment(startDate).format('YYYY-MM-DD 00:00:00+00:00')
    const transactionEndDate = moment(endDate).format('YYYY-MM-DD 23:59:59+00:00')

    const query = {
        transaction_date: { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
        transaction_type: { $in: transactionTypes },
        pcp_transaction_type: { $in: pcpTransactionType },
        campaign_id: campaignId,
        transaction_payment_gateway: paymentGateway,
        tracking_link: { $exists: true, $ne: '' }
    }
    const transactions = await StickyIoTransactionsReport.find(query)

    let referralEaring = 0
    let referralEaring1 = 0
    let referralEaring2 = 0
    let grossRevenue = 0
    let totalNewTransactionCharge = 0
    let totalVoidTransactionCharge = 0
    let totalRefundTransactionCharge = 0
    let totalPaymentGatewayCharge = 0
    let totalGrossDeduction = 0
    let totalNetRevenue = 0
    let totalRevenueCollected = 0
    let totalModalEarning = 0
    let totalPlatformCommissionAmount = 0
    let grossRefundAmount = 0
    let grossChargebackAmount = 0
    let grossVoidAmount = 0
    let newTransactionCount = 0
    let refundTransactionCount = 0
    let voidTransactionCount = 0
    let chargeBackTransactionCount = 0
    let declinedTransactionCount = 0
    let declinedTransactionsCharges = 0
    let totalChargebackPenalty = 0
    let referralData = null

    for (const transaction of transactions) {
        const amount = transaction.amount | 0
        grossRevenue += amount

        let referralAmount = 0
        let referralAmount1 = 0
        let referralAmount2 = 0

        if (_.isEmpty(transaction.referral) === false) {
            let newTransactionCharge = 0
            let voidTransactionCharge = 0
            let refundTransactionCharge = 0
            let grossDeduction = 0
            let declinedTransactionCharge = 0
            let chargebackPenalty = 0
            if (transaction.transaction_type === NEW) {
                newTransactionCharge = calculateTotalTransactionCharge(1, transaction.amount, stickyIoTransactionCharge, paymentCommissions.new_per_transaction_fixed_charge, paymentCommissions.new_per_transaction_percentage_charge)
                totalNewTransactionCharge += newTransactionCharge
                newTransactionCount += 1
            } else if (transaction.transaction_type === VOID) {
                voidTransactionCharge = calculateTotalTransactionCharge(1, transaction.amount, stickyIoTransactionCharge, paymentCommissions.void_per_transaction_fixed_charge, paymentCommissions.void_per_transaction_percentage_charge)
                totalVoidTransactionCharge += voidTransactionCharge
                voidTransactionCount += 1
                grossDeduction += amount
                grossVoidAmount += amount
            } else if (transaction.transaction_type === REFUND) {
                refundTransactionCharge = calculateTotalTransactionCharge(1, transaction.amount, stickyIoTransactionCharge, paymentCommissions.refund_per_transaction_fixed_charge, paymentCommissions.refund_per_transaction_percentage_charge)
                totalRefundTransactionCharge += refundTransactionCharge
                grossDeduction += amount
                grossRefundAmount += amount
                refundTransactionCount += 1
            } else if (transaction.transaction_type === DECLINED) {
                declinedTransactionCharge = calculateTotalTransactionCharge(1, transaction.amount, stickyIoTransactionCharge, paymentCommissions.declined_per_transaction_fixed_charge, paymentCommissions.declined_per_transaction_percentage_charge)
                declinedTransactionCount += 1
                declinedTransactionsCharges += declinedTransactionCharge
            } else if (transaction.transaction_type === CHARGEBACK) {
                grossDeduction += amount
                grossChargebackAmount += amount
                chargeBackTransactionCount += 1
                chargebackPenalty = parseFloat(paymentCommissions.chargeback_penalty)
            }

            totalGrossDeduction += (grossDeduction || 0)

            let paymentGatewayCharge = 0
            if (newTransactionCharge > 0 || voidTransactionCharge > 0 || refundTransactionCharge > 0) {
                paymentGatewayCharge = (newTransactionCharge || 0) + (voidTransactionCharge || 0) + (refundTransactionCharge || 0) + (declinedTransactionCharge || 0)
                totalPaymentGatewayCharge += paymentGatewayCharge
            }
            totalChargebackPenalty += chargebackPenalty

            let netRevenue = amount - (grossDeduction + chargebackPenalty)
            let revenueCollected = amount - (grossDeduction + chargebackPenalty + paymentGatewayCharge)
            if ([VOID, REFUND, CHARGEBACK, DECLINED].includes(transaction.transaction_type)) {
                netRevenue = (grossDeduction + chargebackPenalty)
                revenueCollected = (grossDeduction + chargebackPenalty + paymentGatewayCharge)
            }

            totalNetRevenue += netRevenue
            totalRevenueCollected += revenueCollected

            const platformCommissionAmount = (platformCommissionPercentage / 100) * revenueCollected
            totalPlatformCommissionAmount += platformCommissionAmount
            const modelEarning = (100 - platformCommissionPercentage) * revenueCollected / 100
            totalModalEarning += modelEarning

            referralData = await getWebsiteDomainReferralForDateForReferral(domain, startDate, transaction.referral)
            if (referralData !== null) {
                if (referralData.total_referral > 0) {
                    const percent = referralData.referral_commission || 0
                    referralAmount = (revenueCollected * percent) / 100
                    if (referralData.total_referral > 1) {
                        const percent = referralData.referral_commission1 || 0
                        referralAmount1 = (revenueCollected * percent) / 100
                        if (referralData.total_referral > 2) {
                            const percent = referralData.referral_commission2 || 0
                            referralAmount2 = (revenueCollected * percent) / 100
                        }
                    }
                }
            }

        }
        referralEaring += referralAmount
        referralEaring1 += referralAmount1
        referralEaring2 += referralAmount2
    }

    return {
        referralEaring: referralEaring,
        referralEaring1: referralEaring1,
        referralEaring2: referralEaring2,
        grossRevenue: grossRevenue,
        newTransactionCharge: totalNewTransactionCharge,
        voidTransactionCharge: totalVoidTransactionCharge,
        refundTransactionCharge: totalRefundTransactionCharge,
        totalPaymentGatewayCharge: totalPaymentGatewayCharge,
        netRevenue: totalNetRevenue,
        revenueCollected: totalRevenueCollected,
        platformEarning: totalPlatformCommissionAmount,
        modalEarning: totalModalEarning,
        grossDeduction: totalGrossDeduction,
        grossRefundAmount: grossRefundAmount,
        grossChargebackAmount: grossChargebackAmount,
        grossVoidAmount: grossVoidAmount,
        newTransactionCount: newTransactionCount,
        refundTransactionCount: refundTransactionCount,
        voidTransactionCount: voidTransactionCount,
        chargeBackTransactionCount: chargeBackTransactionCount,
        declinedTransactionCount: declinedTransactionCount,
        declinedTransactionsCharges: declinedTransactionsCharges,
        chargebackPenalty: totalChargebackPenalty,
        referralData: referralData,
        transaction_count: transactions.length
    }
}


/**
 * @description Count Declined Transactions by Campaign Id
 * @param {string} startDate start date
 * @param {string} endDate end date
 * @param {string} campaignId Sticky.io Campaign Id
 * @param {string} paymentGateway Transaction Payment Gateway
 * @returns {number} counts
 */
async function getDeclinedTransactionsByCampaignId(startDate, endDate, campaignId, paymentGateway) {
    const transactionStartDate = moment(startDate).format('YYYY-MM-DD 00:00:00+00:00')
    const transactionEndDate = moment(endDate).format('YYYY-MM-DD 23:59:59+00:00')

    const transactions = await StickyIoTransactionsReport.aggregate([
        {
            $match: {
                transaction_date: { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
                transaction_type: DECLINED,
                campaign_id: campaignId,
                transaction_payment_gateway: paymentGateway
            }
        }, {
            $group: {
                _id: null,
                amount: { $sum: { $toDouble: '$amount' } },
                count: { $sum: 1 }
            }
        }
    ])

    return {
        accounting_amount: transactions.length > 0 ? transactions[0].amount : 0,
        count: transactions.length > 0 ? transactions[0].count : 0
    }
}

/**
 * @description Count Declined Transactions by Campaign Id
 * @param {string} startDate start date
 * @param {string} endDate end date
 * @param {string} campaignId Sticky.io Campaign Id
 * @param {string} paymentGateway Transaction Payment Gateway
 * @returns {number} counts
 */
async function getDeclinedTransactionsByCampaignIdForReferral(startDate, endDate, campaignId, paymentGateway) {
    const transactionStartDate = moment(startDate).format('YYYY-MM-DD 00:00:00+00:00')
    const transactionEndDate = moment(endDate).format('YYYY-MM-DD 23:59:59+00:00')

    const transactions = await StickyIoTransactionsReport.aggregate([
        {
            $match: {
                transaction_date: { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
                transaction_type: DECLINED,
                campaign_id: campaignId,
                transaction_payment_gateway: paymentGateway,
                referral: { $exists: true, $ne: '' }
            }
        }, {
            $group: {
                _id: null,
                amount: { $sum: { $toDouble: '$amount' } },
                count: { $sum: 1 }
            }
        }
    ])

    return {
        accounting_amount: transactions.length > 0 ? transactions[0].amount : 0,
        count: transactions.length > 0 ? transactions[0].count : 0
    }
}

/**
 * @description Get website commission for date
 * @param {string} domain domain
 * @param {string} date date (Date format: YYYY-MM-DD)
 * @returns {object} commission
 */
async function getStickyIoCommissionForDomainForDate(domain, date) {
    const targetDate = moment(date).format('YYYY-MM-DD 00:00:00')
    const fields = 'domain platform_commission sticky_io_charges target_date sticky_io_transaction_charge'

    const where = {
        domain: domain,
        target_date: { $lte: targetDate }
    }
    const commission = await WebsiteCommission.findOne(where, fields).sort({ target_date: -1 })
    if (commission === null) {
        const commission = await getStickyIoVeryRecentCommissionForDomain(domain)
        return commission
    }
    return commission
}

/**
 * @description Get recent website commission
 * @param {string} domain domain
 * @returns {object} commission
 */
async function getStickyIoVeryRecentCommissionForDomain(domain) {
    const fields = 'domain platform_commission sticky_io_charges target_date sticky_io_transaction_charge'
    const commission = await WebsiteCommission.findOne({ domain: domain }, fields).sort({ target_date: -1 })
    return commission
}

/**
 * @description Calculate referral amount
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
 * @description Get Domain referral for date
 * @param {string} domain domain
 * @param {string} date date
 * @returns {object} websiteReferralHistory
 */
async function getWebsiteDomainReferralForDate(domain, date) {
    const targetDate = moment(date).format('YYYY-MM-DD 00:00:00')
    const fields = 'domain total_referral referral_type referral_type1 referral_type2 referral_name referral_name1 referral_name2 referral_commission referral_commission1 referral_commission2 target_date'
    const where = {
        domain: domain,
        target_date: { $lte: targetDate }
    }
    const websiteReferralHistory = await WebsiteReferralHistory.findOne(where, fields).sort({ target_date: -1 })
    if (websiteReferralHistory === null) {
        const websiteReferralHistory = await getVeryRecentWebsiteReferralForDomain(domain)
        return websiteReferralHistory
    }
    return websiteReferralHistory
}

/**
 * @description Get Domain referral for date
 * @param {string} domain domain
 * @param {string} date date
 * @param {string} referral_name referral_name
 * @returns {object} websiteReferralHistory
 */
async function getWebsiteDomainReferralForDateForReferral(domain, date, referral_name) {
    const targetDate = moment(date).format('YYYY-MM-DD 00:00:00')
    const fields = 'domain total_referral referral_type referral_type1 referral_type2 referral_name referral_name1 referral_name2 referral_commission referral_commission1 referral_commission2 target_date'
    const where = {
        domain: { $in: [domain, 'all'] },
        target_date: { $lte: targetDate },
        referral_type: 'link-tracking',
        $or: [
            { referral_name: referral_name },
            { referral_name1: referral_name },
            { referral_name2: referral_name }
        ]
    }

    const websiteReferralHistory = await WebsiteReferralHistory.findOne(where, fields).sort({ target_date: -1 })
    if (websiteReferralHistory === null) {
        const websiteReferralHistory = await getVeryRecentWebsiteReferralForDomainForReferral(domain, referral_name)
        return websiteReferralHistory
    }
    return websiteReferralHistory
}

/**
 * @description Get recent Domain referral
 * @param {string} domain domain
 * @returns {object} websiteReferralHistory
 */
async function getVeryRecentWebsiteReferralForDomain(domain) {
    const fields = 'domain total_referral referral_type referral_type1 referral_type2 referral_name referral_name1 referral_name2 referral_commission referral_commission1 referral_commission2 target_date'
    const where = { domain: domain }

    const websiteReferralHistory = await WebsiteReferralHistory.findOne(where, fields).sort({ target_date: -1 })
    return websiteReferralHistory
}

/**
 * @description Get recent Domain referral
 * @param {string} domain domain
 * @param {string} referral_name referral_name
 * @returns {object} websiteReferralHistory
 */
async function getVeryRecentWebsiteReferralForDomainForReferral(domain, referral_name) {
    const fields = 'domain total_referral referral_type referral_type1 referral_type2 referral_name referral_name1 referral_name2 referral_commission referral_commission1 referral_commission2 target_date'
    const where = {
        domain: { $in: [domain, 'all'] },
        referral_type: 'link-tracking',
        $or: [{ referral_name: referral_name, referral_name1: referral_name, referral_name2: referral_name }]
    }

    const websiteReferralHistory = await WebsiteReferralHistory.findOne(where, fields).sort({ target_date: -1 })
    return websiteReferralHistory
}

/**
 * @description Sticky io get daily earning report by daterange and domain
 * @param {string} startDate date
 * @param {string} endDate date
 * @param {string} domain domain
 * @returns {boolean} true or False
 */
async function generateStickyIoDailyEarningReportOfDomainWithRange(startDate, endDate, domain) {
    const startMoment = moment(startDate)
    const endMoment = moment(endDate).add(1, 'days')
    while (startMoment.isBefore(endMoment, 'day')) {
        let targetDate = startMoment.format('YYYY-MM-DDT00:00:00.000Z')
        await generateStickyIoDailyEarningReportByDomainAndDate(domain, targetDate)
        startMoment.add(1, 'days')
    }
    console.log('Data updated successfully')
    return true
}

/**
 * @description Generate Daily Earning Report for Website by payment Gateway
 * @param {object} paymentCommissions Payment Gateway Commissions
 * @param {string} campaignId Sticky Io Campaign Id
 * @param {string} date Today Date
 * @param {string} domain Domain name
 * @param {number} platformCommissionPercentage Platform Commission Percentage
 * @param {number} stickyIoTransactionCharge Sticky io transaction fixed charge
 * @returns {boolean} status
 */
async function generateDailyEarningByDomainAndPaymentGatewayRealCharge(paymentCommissions, campaignId, date, domain, platformCommissionPercentage, stickyIoTransactionCharge) {
    const paymentGatewayName = paymentCommissions.payment_gateway
    console.log('started earning report for: domain: ', domain, paymentGatewayName, date)

    // Note: Fixed bug of add_new_card transaction is not consider in earning
    const subscriptionTransaction = (moment(date) > moment('2022-10-18T23:59:59.000Z')) ? SUBSCRIPTION_WITH_ADD_CARD : SUBSCRIPTION
    const subscriptionAmount = await getSumWithTypeAndDate(subscriptionTransaction, [NEW, REBILL], date, date, campaignId, paymentGatewayName)
    const subscriptionRefundAmount = await getSumWithTypeAndDate(subscriptionTransaction, [REFUND], date, date, campaignId, paymentGatewayName)
    const subscriptionChargebackAmount = await getSumWithTypeAndDate(subscriptionTransaction, [CHARGEBACK], date, date, campaignId, paymentGatewayName)
    const subscriptionVoidAmount = await getSumWithTypeAndDate(subscriptionTransaction, [VOID], date, date, campaignId, paymentGatewayName)

    // TODO: Need to change shop amount calculation in phase 2
    const shopAmount = await getSumWithTypeAndDate(SHOP_PURCHASE, [NEW], date, date, campaignId, paymentGatewayName)
    const shopRefundAmount = await getSumWithTypeAndDate(SHOP_PURCHASE, [REFUND], date, date, campaignId, paymentGatewayName)
    const shopChargebackAmount = await getSumWithTypeAndDate(SHOP_PURCHASE, [CHARGEBACK], date, date, campaignId, paymentGatewayName)
    const shopVoidAmount = await getSumWithTypeAndDate(SHOP_PURCHASE, [VOID], date, date, campaignId, paymentGatewayName)

    const tipAmount = await getSumWithTypeAndDate(CONTENT_PURCHASE, [NEW], date, date, campaignId, paymentGatewayName)
    const tipRefundAmount = await getSumWithTypeAndDate(CONTENT_PURCHASE, [REFUND], date, date, campaignId, paymentGatewayName)
    const tipChargebackAmount = await getSumWithTypeAndDate(CONTENT_PURCHASE, [CHARGEBACK], date, date, campaignId, paymentGatewayName)
    const tipVoidAmount = await getSumWithTypeAndDate(CONTENT_PURCHASE, [VOID], date, date, campaignId, paymentGatewayName)

    const declinedTransactions = await getDeclinedTransactionsByCampaignId(date, date, campaignId, paymentGatewayName)

    const grossRevenue = subscriptionAmount.accounting_amount + shopAmount.accounting_amount + tipAmount.accounting_amount
    const grossRefundAmount = subscriptionRefundAmount.accounting_amount + shopRefundAmount.accounting_amount + tipRefundAmount.accounting_amount
    const grossChargebackAmount = subscriptionChargebackAmount.accounting_amount + shopChargebackAmount.accounting_amount + tipChargebackAmount.accounting_amount
    const grossVoidAmount = subscriptionVoidAmount.accounting_amount + shopVoidAmount.accounting_amount + tipVoidAmount.accounting_amount

    const grossChargebackCount = subscriptionChargebackAmount.count + shopChargebackAmount.count + tipChargebackAmount.count
    const newTransactionCount = subscriptionAmount.count + shopAmount.count + tipAmount.count
    const refundTransactionCount = subscriptionRefundAmount.count + shopRefundAmount.count + tipRefundAmount.count
    const voidTransactionCount = subscriptionVoidAmount.count + shopVoidAmount.count + tipVoidAmount.count

    // Payment Gateway Charges on Transactions
    const newTransactionCharge = calculateTotalTransactionCharge(newTransactionCount, grossRevenue, stickyIoTransactionCharge, paymentCommissions.new_per_transaction_fixed_charge, paymentCommissions.new_per_transaction_percentage_charge)

    const voidTransactionCharge = calculateTotalTransactionCharge(voidTransactionCount, grossVoidAmount, stickyIoTransactionCharge, paymentCommissions.void_per_transaction_fixed_charge, paymentCommissions.void_per_transaction_percentage_charge)

    const refundTransactionCharge = calculateTotalTransactionCharge(refundTransactionCount, grossRefundAmount, stickyIoTransactionCharge, paymentCommissions.refund_per_transaction_fixed_charge, paymentCommissions.refund_per_transaction_percentage_charge)

    const declineTransactionCharge = calculateTotalTransactionCharge(declinedTransactions.count, declinedTransactions.accounting_amount, stickyIoTransactionCharge, paymentCommissions.declined_per_transaction_fixed_charge, paymentCommissions.declined_per_transaction_percentage_charge)

    const totalTransactionCount = newTransactionCount + voidTransactionCount + refundTransactionCount + declinedTransactions.count

    const chargebackPenalty = grossChargebackCount * parseFloat(paymentCommissions.chargeback_penalty)

    const totalPaymentGatewayCharge = newTransactionCharge + voidTransactionCharge + refundTransactionCharge + declineTransactionCharge

    const grossDeduction = grossRefundAmount + grossVoidAmount + grossChargebackAmount

    const netRevenue = grossRevenue - (grossDeduction + chargebackPenalty)
    const revenueCollected = grossRevenue - (grossDeduction + chargebackPenalty + totalPaymentGatewayCharge)

    const platformCommissionAmount = (platformCommissionPercentage / 100) * revenueCollected
    const modelEarning = (100 - platformCommissionPercentage) * revenueCollected / 100

    // Note: Fixed bug of only declined transaction not consider in earning report
    let isNoRecordFound = false
    if (moment(date) > moment('2022-10-18T23:59:59.000Z')) {
        isNoRecordFound = (grossRevenue === 0 && grossRefundAmount === 0 && grossChargebackAmount === 0 && grossVoidAmount === 0 && totalPaymentGatewayCharge === 0)
    } else {
        isNoRecordFound = (grossRevenue === 0 && grossRefundAmount === 0 && grossChargebackAmount === 0 && grossVoidAmount === 0)
    }

    if (isNoRecordFound === true) {
        console.log('No records found earning report for: domain: ', domain, paymentGatewayName, date)
        return false
    }

    const referralData = await getWebsiteDomainReferralForDate(domain, date)
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

    const charge = {
        domain: domain,
        target_date: date,
        payment_gateway: 'sticky.io',
        sticky_io_payment_gateway: paymentCommissions.payment_gateway,
        platform_commission: platformCommissionPercentage,
        sticky_io_transaction_charge: stickyIoTransactionCharge,
        sticky_io_commission: paymentCommissions.actual_percentage,
        fixed_sticky_io_commission: paymentCommissions.fixed_percentage,
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
        gross_revenue: Number(grossRevenue.toFixed(2)),
        gross_refund: Number(grossDeduction.toFixed(2)),
        chargeback_amount: Number(grossChargebackAmount.toFixed(2)),
        chargeback_count: Number(grossChargebackCount.toFixed(2)),
        chargeback_penalty: Number(chargebackPenalty.toFixed(2)),
        declined_count: Number(declinedTransactions.count.toFixed(2)),
        declined_charges: Number(declineTransactionCharge.toFixed(2)),
        refund_amount: Number(grossRefundAmount.toFixed(2)),
        void_amount: Number(grossVoidAmount.toFixed(2)),
        net_revenue: Number(netRevenue.toFixed(2)),
        revenue_collected: Number(revenueCollected.toFixed(2)),
        platform_earning: Number(platformCommissionAmount.toFixed(2)),
        model_earning: Number(modelEarning.toFixed(2)),
        sticky_io_charge: Number(totalPaymentGatewayCharge.toFixed(2)),
        created_at: new Date(),
        updated_at: new Date(),
        referral_history_id: (referralData !== null) ? referralData._id : null,
        referral_amount: referralAmount,
        referral_amount1: referralAmount1,
        referral_amount2: referralAmount2,
        sticky_io_campaign_id: campaignId,
        gateway_charges: paymentCommissions,
        total_transaction_count: totalTransactionCount,
        sticky_io_transaction_cost: Number((totalTransactionCount * stickyIoTransactionCharge).toFixed(2)),
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
    console.log('report generated for domain:', domain, date, `sticky.io (${paymentCommissions.payment_gateway})`)
    const data = new WebsiteEarningReports(charge)
    await data.save()
}

/**
 * @description Generate Daily Earning Report for Website by payment Gateway
 * @param {object} paymentCommissions Payment Gateway Commissions
 * @param {string} campaignId Sticky Io Campaign Id
 * @param {string} date Today Date
 * @param {string} domain Domain name
 * @param {number} platformCommissionPercentage Platform Commission Percentage
 * @param {number} stickyIoTransactionCharge Sticky io transaction fixed charge
 * @returns {boolean} status
 */
async function generateDailyEarningByDomainAndPaymentGatewayRealChargeWithReferral(paymentCommissions, campaignId, date, domain, platformCommissionPercentage, stickyIoTransactionCharge) {
    const paymentGatewayName = paymentCommissions.payment_gateway
    console.log('started earning report for: domain: ', domain, paymentGatewayName, date)

    // count referral user earning
    const referralUserTransactions = await generateDailyEarningByDomainAndPaymentGatewayRealChargeForReferral(paymentCommissions, campaignId, date, domain, platformCommissionPercentage, stickyIoTransactionCharge)

    // Note: Fixed bug of add_new_card transaction is not consider in earning
    const subscriptionTransaction = (moment(date) > moment('2022-10-18T23:59:59.000Z')) ? SUBSCRIPTION_WITH_ADD_CARD : SUBSCRIPTION
    const subscriptionAmount = await getSumWithTypeAndDateWithoutReferral(subscriptionTransaction, [NEW, REBILL], date, date, campaignId, paymentGatewayName)
    const subscriptionRefundAmount = await getSumWithTypeAndDateWithoutReferral(subscriptionTransaction, [REFUND], date, date, campaignId, paymentGatewayName)
    const subscriptionChargebackAmount = await getSumWithTypeAndDateWithoutReferral(subscriptionTransaction, [CHARGEBACK], date, date, campaignId, paymentGatewayName)
    const subscriptionVoidAmount = await getSumWithTypeAndDateWithoutReferral(subscriptionTransaction, [VOID], date, date, campaignId, paymentGatewayName)

    // TODO: Need to change shop amount calculation in phase 2
    const shopAmount = await getSumWithTypeAndDateWithoutReferral(SHOP_PURCHASE, [NEW], date, date, campaignId, paymentGatewayName)
    const shopRefundAmount = await getSumWithTypeAndDateWithoutReferral(SHOP_PURCHASE, [REFUND], date, date, campaignId, paymentGatewayName)
    const shopChargebackAmount = await getSumWithTypeAndDateWithoutReferral(SHOP_PURCHASE, [CHARGEBACK], date, date, campaignId, paymentGatewayName)
    const shopVoidAmount = await getSumWithTypeAndDateWithoutReferral(SHOP_PURCHASE, [VOID], date, date, campaignId, paymentGatewayName)

    const tipAmount = await getSumWithTypeAndDateWithoutReferral(CONTENT_PURCHASE, [NEW], date, date, campaignId, paymentGatewayName)
    const tipRefundAmount = await getSumWithTypeAndDateWithoutReferral(CONTENT_PURCHASE, [REFUND], date, date, campaignId, paymentGatewayName)
    const tipChargebackAmount = await getSumWithTypeAndDateWithoutReferral(CONTENT_PURCHASE, [CHARGEBACK], date, date, campaignId, paymentGatewayName)
    const tipVoidAmount = await getSumWithTypeAndDateWithoutReferral(CONTENT_PURCHASE, [VOID], date, date, campaignId, paymentGatewayName)

    const declinedTransactions = await getDeclinedTransactionsByCampaignId(date, date, campaignId, paymentGatewayName)

    const grossRevenue = subscriptionAmount.accounting_amount + shopAmount.accounting_amount + tipAmount.accounting_amount
    const grossRefundAmount = subscriptionRefundAmount.accounting_amount + shopRefundAmount.accounting_amount + tipRefundAmount.accounting_amount
    const grossChargebackAmount = subscriptionChargebackAmount.accounting_amount + shopChargebackAmount.accounting_amount + tipChargebackAmount.accounting_amount
    const grossVoidAmount = subscriptionVoidAmount.accounting_amount + shopVoidAmount.accounting_amount + tipVoidAmount.accounting_amount

    const grossChargebackCount = subscriptionChargebackAmount.count + shopChargebackAmount.count + tipChargebackAmount.count
    const newTransactionCount = subscriptionAmount.count + shopAmount.count + tipAmount.count
    const refundTransactionCount = subscriptionRefundAmount.count + shopRefundAmount.count + tipRefundAmount.count
    const voidTransactionCount = subscriptionVoidAmount.count + shopVoidAmount.count + tipVoidAmount.count

    // Payment Gateway Charges on Transactions
    const newTransactionCharge = calculateTotalTransactionCharge(newTransactionCount, grossRevenue, stickyIoTransactionCharge, paymentCommissions.new_per_transaction_fixed_charge, paymentCommissions.new_per_transaction_percentage_charge)

    const voidTransactionCharge = calculateTotalTransactionCharge(voidTransactionCount, grossVoidAmount, stickyIoTransactionCharge, paymentCommissions.void_per_transaction_fixed_charge, paymentCommissions.void_per_transaction_percentage_charge)

    const refundTransactionCharge = calculateTotalTransactionCharge(refundTransactionCount, grossRefundAmount, stickyIoTransactionCharge, paymentCommissions.refund_per_transaction_fixed_charge, paymentCommissions.refund_per_transaction_percentage_charge)

    const declineTransactionCharge = calculateTotalTransactionCharge(declinedTransactions.count, declinedTransactions.accounting_amount, stickyIoTransactionCharge, paymentCommissions.declined_per_transaction_fixed_charge, paymentCommissions.declined_per_transaction_percentage_charge)

    const totalTransactionCount = newTransactionCount + voidTransactionCount + refundTransactionCount + declinedTransactions.count

    const chargebackPenalty = grossChargebackCount * parseFloat(paymentCommissions.chargeback_penalty)

    const totalPaymentGatewayCharge = newTransactionCharge + voidTransactionCharge + refundTransactionCharge + declineTransactionCharge

    const grossDeduction = grossRefundAmount + grossVoidAmount + grossChargebackAmount

    const netRevenue = grossRevenue - (grossDeduction + chargebackPenalty)
    const revenueCollected = grossRevenue - (grossDeduction + chargebackPenalty + totalPaymentGatewayCharge)

    const platformCommissionAmount = (platformCommissionPercentage / 100) * revenueCollected
    const modelEarning = (100 - platformCommissionPercentage) * revenueCollected / 100

    // Note: Fixed bug of only declined transaction not consider in earning report
    let isNoRecordFound = false
    if (moment(date) > moment('2022-10-18T23:59:59.000Z')) {
        isNoRecordFound = (grossRevenue === 0 && grossRefundAmount === 0 && grossChargebackAmount === 0 && grossVoidAmount === 0 && totalPaymentGatewayCharge === 0)
    } else {
        isNoRecordFound = (grossRevenue === 0 && grossRefundAmount === 0 && grossChargebackAmount === 0 && grossVoidAmount === 0)
    }

    if (isNoRecordFound === true) {
        console.log('No records found earning report for: domain: ', domain, paymentGatewayName, date)
        return false
    }

    const referralData = await getWebsiteDomainReferralForDate(domain, date)
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

    const charge = {
        domain: domain,
        target_date: date,
        payment_gateway: 'sticky.io',
        sticky_io_payment_gateway: paymentCommissions.payment_gateway,
        platform_commission: platformCommissionPercentage,
        sticky_io_transaction_charge: stickyIoTransactionCharge,
        sticky_io_commission: paymentCommissions.actual_percentage,
        fixed_sticky_io_commission: paymentCommissions.fixed_percentage,
        subscription_amount: subscriptionAmount.accounting_amount + referralUserTransactions.subscriptionAmount,
        subscription_refund_amount: subscriptionRefundAmount.accounting_amount + referralUserTransactions.subscriptionRefundAmount,
        subscription_chargeback_amount: subscriptionChargebackAmount.accounting_amount + referralUserTransactions.subscriptionChargebackAmount,
        subscription_chargeback_count: subscriptionChargebackAmount.count + referralUserTransactions.subscriptionChargebackCount,
        subscription_void_amount: subscriptionVoidAmount.accounting_amount + referralUserTransactions.subscriptionVoidAmount,
        shop_amount: shopAmount.accounting_amount + referralUserTransactions.shopAmount,
        shop_refund_amount: shopRefundAmount.accounting_amount + referralUserTransactions.shopRefundAmount,
        shop_chargeback_amount: shopChargebackAmount.accounting_amount + referralUserTransactions.shopChargebackAmount,
        shop_chargeback_count: shopChargebackAmount.count + referralUserTransactions.shopChargebackCount,
        shop_void_amount: shopVoidAmount.accounting_amount + referralUserTransactions.shopVoidAmount,
        tip_amount: tipAmount.accounting_amount + referralUserTransactions.tipAmount,
        tip_refund_amount: tipRefundAmount.accounting_amount + referralUserTransactions.tipRefundAmount,
        tip_chargeback_amount: tipChargebackAmount.accounting_amount + referralUserTransactions.tipChargebackAmount,
        tip_chargeback_count: tipChargebackAmount.count + referralUserTransactions.tipChargebackCount,
        tip_void_amount: tipVoidAmount.accounting_amount + referralUserTransactions.tipVoidAmount,
        gross_revenue: Number(grossRevenue.toFixed(2) + referralUserTransactions.grossRevenue.toFixed(2)),
        gross_refund: Number(grossDeduction.toFixed(2) + referralUserTransactions.grossDeduction.toFixed(2)),
        chargeback_amount: Number(grossChargebackAmount.toFixed(2) + referralUserTransactions.grossChargebackAmount.toFixed(2)),
        chargeback_count: Number(grossChargebackCount.toFixed(2) + referralUserTransactions.grossChargebackCount.toFixed(2)),
        chargeback_penalty: Number(chargebackPenalty.toFixed(2) + referralUserTransactions.chargebackPenalty.toFixed(2)),
        declined_count: Number(declinedTransactions.count.toFixed(2) + referralUserTransactions.declinedTransactionCount.toFixed(2)),
        declined_charges: Number(declineTransactionCharge.toFixed(2) + referralUserTransactions.declinedTransactionCharges.toFixed(2)),
        refund_amount: Number(grossRefundAmount.toFixed(2) + referralUserTransactions.grossRefundAmount.toFixed(2)),
        void_amount: Number(grossVoidAmount.toFixed(2) + referralUserTransactions.grossVoidAmount.toFixed(2)),
        net_revenue: Number(netRevenue.toFixed(2) + referralUserTransactions.netRevenue.toFixed(2)),
        revenue_collected: Number(revenueCollected.toFixed(2) + referralUserTransactions.revenueCollected.toFixed(2)),
        platform_earning: Number(platformCommissionAmount.toFixed(2) + referralUserTransactions.platformCommissionAmount.toFixed(2)),
        model_earning: Number(modelEarning.toFixed(2) + referralUserTransactions.modalEarning.toFixed(2)),
        sticky_io_charge: Number(totalPaymentGatewayCharge.toFixed(2) + referralUserTransactions.totalPaymentGatewayCharge.toFixed(2)),
        created_at: new Date(),
        updated_at: new Date(),
        referral_history_id: (referralData !== null) ? referralData._id : null,
        referral_amount: referralAmount + referralUserTransactions.referralEaring,
        referral_amount1: referralAmount1 + referralUserTransactions.referralEaring1,
        referral_amount2: referralAmount2 + referralUserTransactions.referralEaring2,
        sticky_io_campaign_id: campaignId,
        gateway_charges: paymentCommissions,
        total_transaction_count: totalTransactionCount + referralUserTransactions.totalTransactionCount,
        sticky_io_transaction_cost: Number(((totalTransactionCount + referralUserTransactions.totalTransactionCount) * stickyIoTransactionCharge).toFixed(2)),
        subscription_count: subscriptionAmount.count + referralUserTransactions.subscriptionTransactionCount,
        subscription_refund_count: subscriptionRefundAmount.count + referralUserTransactions.subscriptionRefundTransactionCount,
        subscription_void_count: subscriptionVoidAmount.count + referralUserTransactions.subscriptionVoidTransactionCount,
        shop_count: shopAmount.count + referralUserTransactions.shopTransactionCount,
        shop_refund_count: shopRefundAmount.count + referralUserTransactions.shopRefundTransactionCount,
        shop_void_count: shopVoidAmount.count + referralUserTransactions.shopVoidTransactionCount,
        tip_count: tipAmount.count + referralUserTransactions.tipTransactionCount,
        tip_refund_count: tipRefundAmount.count + referralUserTransactions.tipRefundTransactionCount,
        tip_void_count: tipVoidAmount.count + referralUserTransactions.tipVoidTransactionCount,
        link_tracking_referral_history_id: referralUserTransactions.referralData !== null ? referralUserTransactions.referralData._id : null
    }
    console.log('report generated for domain:', domain, date, `sticky.io (${paymentCommissions.payment_gateway})`)
    const data = new WebsiteReferralEarningReports(charge)
    await data.save()
}

/**
 * @description Generate Daily Earning Report for Website by payment Gateway for referral user
 * @param {*} paymentCommissions paymentCommissions
 * @param {*} campaignId campaignId
 * @param {*} date date
 * @param {*} domain domain
 * @param {*} platformCommissionPercentage platformCommissionPercentage
 * @param {*} stickyIoTransactionCharge stickyIoTransactionCharge
 * @returns {object} sticky earning report for referral user
 */
async function generateDailyEarningByDomainAndPaymentGatewayRealChargeForReferral(paymentCommissions, campaignId, date, domain, platformCommissionPercentage, stickyIoTransactionCharge) {
    const paymentGatewayName = paymentCommissions.payment_gateway
    console.log('started earning report for referral user: domain: ', domain, paymentGatewayName, date)

    // Note: Fixed bug of add_new_card transaction is not consider in earning
    const subscriptionTransaction = (moment(date) > moment('2022-10-18T23:59:59.000Z')) ? SUBSCRIPTION_WITH_ADD_CARD : SUBSCRIPTION
    const subscriptionAmount = await getSumWithTypeAndDateForReferralUser(subscriptionTransaction, [NEW, REBILL], date, date, campaignId, paymentGatewayName, domain, stickyIoTransactionCharge, paymentCommissions, platformCommissionPercentage)
    const subscriptionRefundAmount = await getSumWithTypeAndDateForReferralUser(subscriptionTransaction, [REFUND], date, date, campaignId, paymentGatewayName, domain)
    const subscriptionChargebackAmount = await getSumWithTypeAndDateForReferralUser(subscriptionTransaction, [CHARGEBACK], date, date, campaignId, paymentGatewayName, domain)
    const subscriptionVoidAmount = await getSumWithTypeAndDateForReferralUser(subscriptionTransaction, [VOID], date, date, campaignId, paymentGatewayName, domain)
    const subscriptionDeclinedAmount = await getSumWithTypeAndDateForReferralUser(subscriptionTransaction, [DECLINED], date, date, campaignId, paymentGatewayName, domain)

    // TODO: Need to change shop amount calculation in phase 2
    const shopAmount = await getSumWithTypeAndDateForReferralUser(SHOP_PURCHASE, [NEW], date, date, campaignId, paymentGatewayName)
    const shopRefundAmount = await getSumWithTypeAndDateForReferralUser(SHOP_PURCHASE, [REFUND], date, date, campaignId, paymentGatewayName)
    const shopChargebackAmount = await getSumWithTypeAndDateForReferralUser(SHOP_PURCHASE, [CHARGEBACK], date, date, campaignId, paymentGatewayName)
    const shopVoidAmount = await getSumWithTypeAndDateForReferralUser(SHOP_PURCHASE, [VOID], date, date, campaignId, paymentGatewayName)
    const shopDeclinedAmount = await getSumWithTypeAndDateForReferralUser(SHOP_PURCHASE, [DECLINED], date, date, campaignId, paymentGatewayName)

    const tipAmount = await getSumWithTypeAndDateForReferralUser(CONTENT_PURCHASE, [NEW], date, date, campaignId, paymentGatewayName)
    const tipRefundAmount = await getSumWithTypeAndDateForReferralUser(CONTENT_PURCHASE, [REFUND], date, date, campaignId, paymentGatewayName)
    const tipChargebackAmount = await getSumWithTypeAndDateForReferralUser(CONTENT_PURCHASE, [CHARGEBACK], date, date, campaignId, paymentGatewayName)
    const tipVoidAmount = await getSumWithTypeAndDateForReferralUser(CONTENT_PURCHASE, [VOID], date, date, campaignId, paymentGatewayName)
    const tipDeclinedAmount = await getSumWithTypeAndDateForReferralUser(CONTENT_PURCHASE, [DECLINED], date, date, campaignId, paymentGatewayName)

    const grossRevenue = subscriptionAmount.grossRevenue + shopAmount.grossRevenue + tipAmount.grossRevenue
    const grossRefundAmount = subscriptionRefundAmount.grossRevenue + shopRefundAmount.grossRevenue + tipRefundAmount.grossRevenue
    const grossChargebackAmount = subscriptionChargebackAmount.grossRevenue + shopChargebackAmount.grossRevenue + tipChargebackAmount.grossRevenue
    const grossVoidAmount = subscriptionVoidAmount.grossRevenue + shopVoidAmount.grossRevenue + tipVoidAmount.grossRevenue

    const declinedTransactions = await getDeclinedTransactionsByCampaignIdForReferral(date, date, campaignId, paymentGatewayName)

    const newTransactionCount = subscriptionAmount.transaction_count + shopAmount.transaction_count + tipAmount.transaction_count
    const refundTransactionCount = subscriptionRefundAmount.transaction_count + shopRefundAmount.transaction_count + tipRefundAmount.transaction_count
    const voidTransactionCount = subscriptionVoidAmount.transaction_count + shopVoidAmount.transaction_count + tipVoidAmount.transaction_count

    const grossChargebackCount = subscriptionChargebackAmount.transaction_count + shopChargebackAmount.transaction_count + tipChargebackAmount.transaction_count
    const totalTransactionCount = newTransactionCount + voidTransactionCount + refundTransactionCount + declinedTransactions.count

    const grossDeduction = grossRefundAmount + grossVoidAmount + grossChargebackAmount

    // net revenue collection
    const totalNetRevenue = subscriptionAmount.netRevenue + shopAmount.netRevenue + tipAmount.netRevenue
    const refundNetRevenue = subscriptionRefundAmount.netRevenue + shopRefundAmount.netRevenue + tipRefundAmount.netRevenue
    const voidNetRevenue = subscriptionVoidAmount.netRevenue + shopVoidAmount.netRevenue + tipVoidAmount.netRevenue
    const chargeBackNetRevenue = subscriptionChargebackAmount.netRevenue + shopChargebackAmount.netRevenue + tipChargebackAmount.netRevenue
    const declinedNetRevenue = subscriptionDeclinedAmount.netRevenue + shopDeclinedAmount.netRevenue + tipDeclinedAmount.netRevenue
    const netRevenue = totalNetRevenue - (refundNetRevenue + voidNetRevenue + chargeBackNetRevenue + declinedNetRevenue)

    // revenue collected
    const totalRevenueCollected = subscriptionAmount.revenueCollected + shopAmount.revenueCollected + tipAmount.revenueCollected
    const refundRevenueCollected = subscriptionRefundAmount.revenueCollected + shopRefundAmount.revenueCollected + tipRefundAmount.revenueCollected
    const voidRevenueCollected = subscriptionVoidAmount.revenueCollected + shopVoidAmount.revenueCollected + tipVoidAmount.revenueCollected
    const chargeBackRevenueCollected = subscriptionChargebackAmount.revenueCollected + shopChargebackAmount.revenueCollected + tipChargebackAmount.revenueCollected
    const declinedRevenueCollected = subscriptionDeclinedAmount.revenueCollected + shopDeclinedAmount.revenueCollected + tipDeclinedAmount.revenueCollected

    const revenueCollected = totalRevenueCollected - (refundRevenueCollected + voidRevenueCollected + chargeBackRevenueCollected + declinedRevenueCollected)

    // platform commission
    const totalPlatformCommissionAmount = subscriptionAmount.platformCommissionAmount + shopAmount.platformCommissionAmount + tipAmount.platformCommissionAmount
    const refundPlatformCommissionAmount = subscriptionRefundAmount.platformCommissionAmount + shopRefundAmount.platformCommissionAmount + tipRefundAmount.platformCommissionAmount
    const voidPlatformCommissionAmount = subscriptionVoidAmount.platformCommissionAmount + shopVoidAmount.platformCommissionAmount + tipVoidAmount.platformCommissionAmount
    const chargeBackPlatformCommissionAmount = subscriptionChargebackAmount.platformCommissionAmount + shopChargebackAmount.platformCommissionAmount + tipChargebackAmount.platformCommissionAmount
    const declinedPlatformCommissionAmount = subscriptionDeclinedAmount.platformCommissionAmount + shopDeclinedAmount.platformCommissionAmount + tipDeclinedAmount.platformCommissionAmount

    const platformCommissionAmount = totalPlatformCommissionAmount - (refundPlatformCommissionAmount + voidPlatformCommissionAmount + chargeBackPlatformCommissionAmount + declinedPlatformCommissionAmount)

    // model earning
    const totalModelEarning = subscriptionAmount.modelEarning + shopAmount.modelEarning + tipAmount.modelEarning
    const refundModelEarning = subscriptionRefundAmount.modelEarning + shopRefundAmount.modelEarning + tipRefundAmount.modelEarning
    const voidModelEarning = subscriptionVoidAmount.modelEarning + shopVoidAmount.modelEarning + tipVoidAmount.modelEarning
    const chargebackModelEarning = subscriptionChargebackAmount.modelEarning + shopChargebackAmount.modelEarning + tipChargebackAmount.modelEarning
    const declinedModelEarning = subscriptionDeclinedAmount.modelEarning + shopDeclinedAmount.modelEarning + tipDeclinedAmount.modelEarning

    const modelEarning = totalModelEarning - (refundModelEarning + voidModelEarning + chargebackModelEarning + declinedModelEarning)

    // referral earning
    const totalReferralEarning = subscriptionAmount.referralEaring + shopAmount.referralEaring + tipAmount.referralEaring
    const refundReferralEarning = subscriptionRefundAmount.referralEaring + shopRefundAmount.referralEaring + tipRefundAmount.referralEaring
    const voidReferralEarning = subscriptionVoidAmount.referralEaring + shopVoidAmount.referralEaring + tipVoidAmount.referralEaring
    const chargebackReferralEarning = subscriptionChargebackAmount.referralEaring + shopChargebackAmount.referralEaring + tipChargebackAmount.referralEaring
    const declinedReferralEarning = subscriptionDeclinedAmount.referralEaring + shopDeclinedAmount.referralEaring + tipDeclinedAmount.referralEaring
    const referralEarning = totalReferralEarning - (refundReferralEarning + voidReferralEarning + chargebackReferralEarning + declinedReferralEarning)

    // referral earning 1
    const totalReferralEarning1 = subscriptionAmount.referralEaring1 + shopAmount.referralEaring1 + tipAmount.referralEaring1
    const refundReferralEarning1 = subscriptionRefundAmount.referralEaring1 + shopRefundAmount.referralEaring1 + tipRefundAmount.referralEaring1
    const voidReferralEarning1 = subscriptionVoidAmount.referralEaring1 + shopVoidAmount.referralEaring1 + tipVoidAmount.referralEaring1
    const chargebackReferralEarning1 = subscriptionChargebackAmount.referralEaring1 + shopChargebackAmount.referralEaring1 + tipChargebackAmount.referralEaring1
    const declinedReferralEarning1 = subscriptionDeclinedAmount.referralEaring1 + shopDeclinedAmount.referralEaring1 + tipDeclinedAmount.referralEaring1
    const referralEarning1 = totalReferralEarning1 - (refundReferralEarning1 + voidReferralEarning1 + chargebackReferralEarning1 + declinedReferralEarning1)

    // referral earning 2
    const totalReferralEarning2 = subscriptionAmount.referralEaring2 + shopAmount.referralEaring2 + tipAmount.referralEaring2
    const refundReferralEarning2 = subscriptionRefundAmount.referralEaring2 + shopRefundAmount.referralEaring2 + tipRefundAmount.referralEaring2
    const voidReferralEarning2 = subscriptionVoidAmount.referralEaring2 + shopVoidAmount.referralEaring2 + tipVoidAmount.referralEaring2
    const chargebackReferralEarning2 = subscriptionChargebackAmount.referralEaring2 + shopChargebackAmount.referralEaring2 + tipChargebackAmount.referralEaring2
    const declinedReferralEarning2 = subscriptionDeclinedAmount.referralEaring2 + shopDeclinedAmount.referralEaring2 + tipDeclinedAmount.referralEaring2
    const referralEarning2 = totalReferralEarning2 - (refundReferralEarning2 + voidReferralEarning2 + chargebackReferralEarning2 + declinedReferralEarning2)

    const subscriptionTransactionCount = subscriptionAmount.transaction_count + subscriptionRefundAmount.transaction_count + subscriptionChargebackAmount.transaction_count + subscriptionVoidAmount.count
    const shopTransaction = shopAmount.transaction_count + shopRefundAmount.transaction_count + shopChargebackAmount.transaction_count + shopVoidAmount.transaction_count
    const tipTransaction = tipAmount.transaction_count + tipRefundAmount.transaction_count + tipChargebackAmount.transaction_count + tipVoidAmount.transaction_count

    // payment gateway charge
    const newPaymentGatewayCharge = subscriptionAmount.totalPaymentGatewayCharge + shopAmount.totalPaymentGatewayCharge + tipAmount.totalPaymentGatewayCharge
    const voidPaymentGatewayCharge = subscriptionVoidAmount.totalPaymentGatewayCharge + shopVoidAmount.totalPaymentGatewayCharge + tipVoidAmount.totalPaymentGatewayCharge
    const refundPaymentGatewayCharge = subscriptionRefundAmount.totalPaymentGatewayCharge + shopRefundAmount.totalPaymentGatewayCharge + tipRefundAmount.totalPaymentGatewayCharge
    const declinedPaymentGatewayCharge = subscriptionDeclinedAmount.totalPaymentGatewayCharge + shopDeclinedAmount.totalPaymentGatewayCharge + tipDeclinedAmount.totalPaymentGatewayCharge
    const totalPaymentGatewayCharge = newPaymentGatewayCharge + voidPaymentGatewayCharge + refundPaymentGatewayCharge + declinedPaymentGatewayCharge

    const shopTransactionCount = shopTransaction + tipTransaction

    const declinedTransactionCount = subscriptionDeclinedAmount.declinedTransactionCount + shopDeclinedAmount.declinedTransactionCount + tipDeclinedAmount.declinedTransactionCount
    const declinedTransactionsCharges = subscriptionDeclinedAmount.declinedTransactionsCharges + shopDeclinedAmount.declinedTransactionsCharges + tipDeclinedAmount.declinedTransactionsCharges
    const totalChargebackPenalty = subscriptionChargebackAmount.chargebackPenalty + shopChargebackAmount.chargebackPenalty + tipChargebackAmount.chargebackPenalty

    const charge = {
        subscriptionAmount: subscriptionAmount.grossRevenue,
        shopAmount: shopAmount.grossRevenue,
        tipAmount: tipAmount.grossRevenue,
        subscriptionRefundAmount: subscriptionRefundAmount.grossRevenue,
        shopRefundAmount: shopRefundAmount.grossRevenue,
        tipRefundAmount: tipRefundAmount.grossRevenue,
        subscriptionChargebackAmount: subscriptionChargebackAmount.grossRevenue,
        shopChargebackAmount: shopChargebackAmount.grossRevenue,
        tipChargebackAmount: tipChargebackAmount.grossRevenue,
        grossRevenue: grossRevenue,
        netRevenue: netRevenue,
        totalPaymentGatewayCharge: totalPaymentGatewayCharge,
        grossDeduction: grossDeduction,
        platformCommissionAmount: platformCommissionAmount,
        revenueCollected: revenueCollected,
        model_earning: modelEarning,
        totalReferralEarning: Number(referralEarning.toFixed(2) + referralEarning1.toFixed(2) + referralEarning2.toFixed(2)),
        referralEarning: Number(referralEarning.toFixed(2)),
        referralEarning1: Number(referralEarning1.toFixed(2)),
        referralEarning2: Number(referralEarning2.toFixed(2)),
        totalTransactionCount: totalTransactionCount,
        totalSubscriptionTransactionCount: subscriptionTransactionCount,
        totalShopTransactionCount: shopTransactionCount,
        totalTipTransaction: tipTransaction,
        subscriptionTransactionCount: subscriptionAmount.transaction_count,
        shopTransactionCount: shopAmount.transaction_count,
        tipTransactionCount: tipAmount.transaction_count,
        subscriptionRefundCount: subscriptionRefundAmount.transaction_count,
        shopRefundCount: shopRefundAmount.transaction_count,
        tipRefundCount: tipRefundAmount.transaction_count,
        subscriptionVoidCount: subscriptionVoidAmount.transaction_count,
        shopVoidCount: shopVoidAmount.transaction_count,
        tipVoidCount: tipVoidAmount.transaction_count,
        subscriptionChargebackAmountCount: subscriptionChargebackAmount.transaction_count,
        shopChargebackAmountCount: shopChargebackAmount.transaction_count,
        tipChargebackAmountCount: tipChargebackAmount.transaction_count,
        grossChargebackCount: grossChargebackCount,
        declinedTransactionCount: declinedTransactionCount,
        declinedTransactionsCharges: declinedTransactionsCharges,
        chargebackPenalty: totalChargebackPenalty,
        referralData: subscriptionAmount.referralData
    }
    return charge
}

/**
 * @description update Sticky.io real Charge with fixed charge
 */
async function updateStickyIoRealChargeWithFixedCharge() {
    const websiteEarningReport = await WebsiteEarningReports.find({ payment_gateway: 'sticky.io' })
    for (const websiteEarning of websiteEarningReport) {
        const update = {
            $set: {
                sticky_io_charge: websiteEarning.fixed_sticky_io_charge,
                model_earning: websiteEarning.fixed_model_earning,
                platform_earning: websiteEarning.fixed_platform_earning,
                referral_amount: websiteEarning.referral_amount_for_fixed_charge,
                referral_amount1: websiteEarning.referral_amount1_for_fixed_charge,
                referral_amount2: websiteEarning.referral_amount2_for_fixed_charge
            }
        }
        await WebsiteEarningReports.updateOne({ _id: websiteEarning._id }, update)
    }
}

/**
 * @description Send all transaction of chargeback to website for update transaction
 */
async function fixStickyIoTransactionsChargeback() {
    try {
        const chargebackList = await StickyIoTransactionReport.find({ transaction_type: 'CHARGEBACK' }, 'pcp_user_id notes transaction_date pcp_transaction_id website_url')
        for (const transaction of chargebackList) {
            const data = {
                user_id: transaction.pcp_user_id,
                chargeback_reason: transaction.notes,
                chargeback_date: transaction.transaction_date,
                pcp_transaction_id: transaction.pcp_transaction_id
            }
            await sendUserDataToWebsiteForBlockChargebackUser(data, transaction.website_url)
        }
    } catch (error) {
        console.log(error.message)
    }
}

/**
 * @description Send Block User data for log to services
 * @param {object} data log data
 * @param {string} website_url website url
 * @returns {string} success response
 */
async function sendUserDataToWebsiteForBlockChargebackUser(data, website_url) {
    try {
        const apiDomain = getWebsiteDomain(website_url)
        const apiUrl = `${apiDomain}/api/sticky-io/block-chargeback-user`
        console.log(apiUrl, data)
        await axios.post(apiUrl, data)
        return true
    } catch (error) {
        console.log(error.message)
        return false
    }
}

module.exports = {
    stickyIoDailyTransactionAnalysis,
    generateStickyIoDailyEarningReportByDate,
    generateStickyIoDailyEarningReportByDomainAndDate,
    generateStickyIoDailyEarningReportOfDomainWithRange,
    updateStickyIoRealChargeWithFixedCharge,
    sendUserDataToWebsiteForBlockChargebackUser,
    fixStickyIoTransactionsChargeback,
    getStickyIoCommissionForDomainForDate,
    generateStickyIoDailyEarningReportByDomainAndDateForReferral
}
