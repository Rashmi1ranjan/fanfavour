const axios = require('axios')
const _ = require('lodash')
const moment = require('moment')
const ForumPayTransactionReport = require('./../models/ForumPayTransactionReport')
const WalletTransactions = require('./../models/WalletTransactions')
const ForumPayWalletTransactionReports = require('./../models/ForumPayWalletTransactionReports')
const WebsiteCommission = require('./../models/WebsiteCommission')
const WebsiteEarningReports = require('./../models/WebsiteDailyEarningReport')
const WebsiteReferralHistory = require('./../models/WebsiteReferralHistory')
const Website = require('./../models/Website')
const WebsiteReferralDailyEarningReports = require('./../models/WebsiteReferralDailyEarningReport')
const { NEW, REBILL, VOID, REFUND, SUBSCRIPTION, CONTENT_PURCHASE, SHOP_PURCHASE } = require('./../constants')
const { forumPayConfiguration } = require('./forumpay')

/**
 * @description Get Forum pay transaction report from api
 * @returns {boolean} status of command
 */
async function getForumPayTransactionReport() {
    try {
        const limit = 20
        const countRecords = await ForumPayTransactionReport.countDocuments({})

        const { api_url, header_option } = forumPayConfiguration()
        const apiUrl = `${api_url}GetTransactions/?offset=${countRecords}limit=${limit}`
        const response = await axios.get(apiUrl, header_option)

        const records = _.get(response, 'data.invoices', [])
        if (records.length === 0) {
            console.log('No Records found for insert')
            return true
        }
        const allTransaction = []
        for (const record of records) {
            const transaction_date = new Date(record.inserted)
            allTransaction.push({ ...record, transaction_type: 'add_fund', website_url: record.pos_id, transaction_date })
        }
        await ForumPayTransactionReport.insertMany(allTransaction)

        console.log(`Report inserted, Total Record Inserted: ${records.length}`)
        if (records.length === limit) {
            return await getForumPayTransactionReport()
        }
        return true
    } catch (error) {
        console.log('error while importing forum pay transaction Report', error.message)
        console.log(error)
        return false
    }
}

/**
 * @description Generate Daily Transaction Report for wallet
 * @returns {boolean} true
 */
async function generateDailyWalletTransactionReport() {
    const websites = await Website.find({ is_crypto_payment_enabled: true }, 'website_url')

    const date = moment().subtract(1, 'days').format('YYYY-MM-DD')
    for (let website of websites) {
        await generateWalletTransactionReportByDate(website.website_url, date)
    }
    console.log('Report Successfully Generated')
    return true
}

/**
 * @description Generate Forumpay Transaction report by date
 * @param {string} website_url website url
 * @param {string} date date
 * @returns {boolean} status
 */
async function generateWalletTransactionReportByDate(website_url, date) {
    try {
        await deleteTransactionsByDate(website_url, date)

        const startDateMoment = moment(date).format('YYYY-MM-DDT00:00:00Z')
        const endDateMoment = moment(date).format('YYYY-MM-DDT23:59:59Z')

        const query = {
            is_ignore: { $ne: true },
            transaction_type: 'debit',
            domain: website_url,
            mst_created_date: {
                $gte: new Date(startDateMoment),
                $lte: new Date(endDateMoment)
            }
        }

        const transactions = await WalletTransactions.find(query)
        if (transactions.length === 0) {
            const response = {
                'Website': website_url,
                'Message': 'No transaction found',
                'Date': date
            }
            console.table(response)
            return false
        }
        const reportTransactions = []
        for (const transaction of transactions) {
            const transaction_type = transaction.transaction_info.transaction_for === 'rebill' ? REBILL : NEW
            const reportTransaction = {
                transaction_type: transaction_type,
                transaction_id: transaction._id,
                amount: transaction.amount,
                email: transaction.email,
                transaction_date: transaction.createdAt,
                mst_transaction_date: moment(transaction.createdAt).tz('America/Phoenix').format('YYYY-MM-DDTHH:mm:ss'),
                pcp_transaction_type: pcpTransactionType(transaction.transaction_info.transaction_for),
                pcp_user_id: transaction.user_id,
                pcp_transaction_id: transaction.pcp_transaction_id,
                website_url: transaction.domain
            }
            if (_.isEmpty(transaction.tracking_link) === false) {
                reportTransaction.tracking_link = transaction.tracking_link
            }
            reportTransactions.push(reportTransaction)
        }

        await ForumPayWalletTransactionReports.insertMany(reportTransactions)
        const response = {
            'Website': website_url,
            'Message': 'Transaction Report Successfully Generated',
            'Date': date,
            'No Of Records': transactions.length
        }
        console.table(response)
        return true
    } catch (error) {
        const response = {
            'Message': 'Error in generate daily earning report',
            'Website': website_url,
            'Date': date
        }
        console.table(response)
        console.log(error)
        return false
    }
}

/**
 * @description Delete Transaction report by domain and date
 * @param {string} website_url website url
 * @param {string} date date
 * @returns {boolean} true
 */
async function deleteTransactionsByDate(website_url, date) {
    const startDateMoment = moment(date).format('YYYY-MM-DDT00:00:00Z')
    const endDateMoment = moment(date).format('YYYY-MM-DDT23:59:59Z')
    const query = {
        website_url: website_url,
        mst_transaction_date: {
            $gte: new Date(startDateMoment),
            $lte: new Date(endDateMoment)
        }
    }
    const removeTransactions = await ForumPayWalletTransactionReports.deleteMany(query)
    console.log(removeTransactions)
    return true
}

/**
 * @description Generate Daily Earning report for forum pay transactions
 * @param {string} date Date (Date format: YYYY-MM-DD)
 */
async function generateForumPayDailyEarningReportByDate(date) {
    console.time('generateForumPayDailyEarningReportByDate')
    try {
        const websites = await Website.find({ is_crypto_payment_enabled: true }, 'website_url')
        let totalReportGenerated = 0
        for (const website of websites) {
            const isReportGenerated = await generateDailyEarningReportByDomainAndDate(website.website_url, date)
            if (isReportGenerated === true) {
                console.log('report Generated for ', website.website_url)
                totalReportGenerated++
            }
        }
        console.log('total Report Generated:', totalReportGenerated)
    } catch (error) {
        console.log('Error in earning Report generate:', error)
    }
    console.timeEnd('generateForumPayDailyEarningReportByDate')
}

/**
 * @description Generate Daily Earning report for sticky.io transactions
 * @param {string} domain Domain name
 * @param {string} date Date (Date format: YYYY-MM-DD)
 */
async function generateForumPayDailyEarningReportByDomainAndDate(domain, date) {
    console.time('generateForumPayDailyEarningReportByDate')

    const website = await Website.findOne({ is_crypto_payment_enabled: true, website_url: domain }, 'website_url')
    if (website === null) {
        console.log(`Website not found for domain: ${domain}`)
    } else {
        const isReportGenerated = await generateDailyEarningReportByDomainAndDate(website.website_url, date)
        if (isReportGenerated === true) {
            console.log(`Earning Report generated for domain: ${domain}`)
        } else {
            console.log(`Error in Earning Report generate for domain: ${domain}`)
        }
    }
    console.timeEnd('generateForumPayDailyEarningReportByDate')
}

/**
 * @description Generate Daily Earning report for sticky.io transactions
 * @param {string} domain Domain name
 * @param {string} date Date (Date format: YYYY-MM-DD)
 */
async function generateForumPayDailyEarningReportByDomainAndDateForReferral(domain, date) {
    console.time('generateForumPayDailyEarningReportByDate')

    const website = await Website.findOne({ is_crypto_payment_enabled: true, website_url: domain }, 'website_url')
    if (website === null) {
        console.log(`Website not found for domain: ${domain}`)
    } else {
        const isReportGenerated = await generateDailyEarningReportByDomainAndDateForReferral(website.website_url, date)
        if (isReportGenerated === true) {
            console.log(`Earning Report generated for domain: ${domain}`)
        } else {
            console.log(`Error in Earning Report generate for domain: ${domain}`)
        }
    }
    console.timeEnd('generateForumPayDailyEarningReportByDate')
}

/**
 * @description Generate Daily earning report by domain and date
 * @param {string} domain website url
 * @param {string} date date
 * @returns {boolean} true
 */
async function generateDailyEarningReportByDomainAndDate(domain, date) {
    const commission = await getForumPayCommissionForDomainForDate(domain, date)

    if (commission === null) {
        console.log('commission not found for domain:', domain, 'for date:', date)
        return false
    }

    const platform_commission = parseFloat(commission.platform_commission) || 20
    const forumpay_transaction_charge = parseFloat(commission.forumpay_transaction_charge) || 3

    const deletedRecord = await deleteForumPayDailyEarningReportByDomainAndDateAndPaymentGateway(domain, date)
    console.log('Records Deleted:', deletedRecord)

    await generateDailyEarningByDomainAndPaymentGateway(domain, date, forumpay_transaction_charge, platform_commission)
    // await generateDailyEarningByDomainAndPaymentGatewayWithReferral(domain, date, forumpay_transaction_charge, platform_commission)
    return true
}

/**
 * @description Generate Daily earning report by domain and date
 * @param {string} domain website url
 * @param {string} date date
 * @returns {boolean} true
 */
async function generateDailyEarningReportByDomainAndDateForReferral(domain, date) {
    const commission = await getForumPayCommissionForDomainForDate(domain, date)

    if (commission === null) {
        console.log('commission not found for domain:', domain, 'for date:', date)
        return false
    }

    const platform_commission = parseFloat(commission.platform_commission) || 20
    const forumpay_transaction_charge = parseFloat(commission.forumpay_transaction_charge) || 3

    const deletedRecord = await deleteForumPayDailyEarningReportByDomainAndDateAndPaymentGateway(domain, date)
    console.log('Records Deleted:', deletedRecord)

    // await generateDailyEarningByDomainAndPaymentGateway(domain, date, forumpay_transaction_charge, platform_commission)
    await generateDailyEarningByDomainAndPaymentGatewayWithReferral(domain, date, forumpay_transaction_charge, platform_commission)
    return true
}

/**
 * @description Get website commission for date
 * @param {string} domain domain
 * @param {string} date date (Date format: YYYY-MM-DD)
 * @returns {object} commission
 */
async function getForumPayCommissionForDomainForDate(domain, date) {
    const targetDate = moment(date).format('YYYY-MM-DD 00:00:00')
    const fields = 'domain platform_commission forumpay_transaction_charge target_date'

    const where = {
        domain: domain,
        target_date: { $lte: targetDate }
    }
    const commission = await WebsiteCommission.findOne(where, fields).sort({ target_date: -1 })
    if (commission === null) {
        const commission = await getForumPayVeryRecentCommissionForDomain(domain)
        return commission
    }
    return commission
}

/**
 * @description Get recent website commission
 * @param {string} domain domain
 * @returns {object} commission
 */
async function getForumPayVeryRecentCommissionForDomain(domain) {
    const fields = 'domain platform_commission forumpay_transaction_charge target_date'
    const commission = await WebsiteCommission.findOne({ domain: domain }, fields).sort({ target_date: -1 })
    return commission
}

/**
 * @description Delete all sticky.io earning reports
 * @param {string} domain Domain name
 * @param {string} date date (Date format: YYYY-MM-DD)
 * @returns {number} Total deleted record count
 */
async function deleteForumPayDailyEarningReportByDomainAndDateAndPaymentGateway(domain, date) {
    const transactionStartDate = moment(date).format('YYYY-MM-DD 00:00:00Z')
    const transactionEndDate = moment(date).format('YYYY-MM-DD 23:59:59Z')
    const deleteTransaction = await WebsiteEarningReports.deleteMany({
        domain: domain,
        payment_gateway: 'forumpay',
        target_date: {
            $gte: new Date(transactionStartDate),
            $lte: new Date(transactionEndDate)
        }
    })

    return deleteTransaction.deletedCount
}

/**
 * @description Generate Daily Earning Report for Website by payment Gateway
 * @param {string} domain Domain name
 * @param {string} date Today Date
 * @param {object} paymentCommissions Payment Gateway Commissions
 * @param {number} platformCommissionPercentage Platform Commission Percentage
 * @returns {boolean} status
 */
async function generateDailyEarningByDomainAndPaymentGateway(domain, date, paymentCommissions, platformCommissionPercentage) {
    console.log('started earning report for: domain: ', domain, date, 'ForumPay')

    const subscriptionAmount = await getSumWithTypeAndDate(SUBSCRIPTION, [NEW, REBILL], date, date, domain)
    const subscriptionRefundAmount = await getSumWithTypeAndDate(SUBSCRIPTION, [REFUND], date, date, domain)
    const subscriptionVoidAmount = await getSumWithTypeAndDate(SUBSCRIPTION, [VOID], date, date, domain)

    // TODO: Need to change shop amount calculation in phase 2
    const shopAmount = await getSumWithTypeAndDate(SHOP_PURCHASE, [NEW], date, date, domain)
    const shopRefundAmount = await getSumWithTypeAndDate(SHOP_PURCHASE, [REFUND], date, date, domain)
    const shopVoidAmount = await getSumWithTypeAndDate(SHOP_PURCHASE, [VOID], date, date, domain)

    const tipAmount = await getSumWithTypeAndDate(CONTENT_PURCHASE, [NEW], date, date, domain)
    const tipRefundAmount = await getSumWithTypeAndDate(CONTENT_PURCHASE, [REFUND], date, date, domain)
    const tipVoidAmount = await getSumWithTypeAndDate(CONTENT_PURCHASE, [VOID], date, date, domain)

    const grossRevenue = subscriptionAmount.accounting_amount + shopAmount.accounting_amount + tipAmount.accounting_amount
    const grossRefundAmount = subscriptionRefundAmount.accounting_amount + shopRefundAmount.accounting_amount + tipRefundAmount.accounting_amount
    const grossVoidAmount = subscriptionVoidAmount.accounting_amount + shopVoidAmount.accounting_amount + tipVoidAmount.accounting_amount

    const newTransactionCount = subscriptionAmount.count + shopAmount.count + tipAmount.count
    const refundTransactionCount = subscriptionRefundAmount.count + shopRefundAmount.count + tipRefundAmount.count
    const voidTransactionCount = subscriptionVoidAmount.count + shopVoidAmount.count + tipVoidAmount.count

    // Payment Gateway Charges on Transactions
    const newTransactionCharge = calculateTotalTransactionCharge(grossRevenue, paymentCommissions)
    const voidTransactionCharge = calculateTotalTransactionCharge(grossVoidAmount, paymentCommissions)
    const refundTransactionCharge = calculateTotalTransactionCharge(grossRefundAmount, paymentCommissions)

    const declineTransactionCharge = 0.00
    const totalTransactionCount = newTransactionCount + voidTransactionCount + refundTransactionCount
    const totalPaymentGatewayCharge = newTransactionCharge + voidTransactionCharge + refundTransactionCharge + declineTransactionCharge

    const grossDeduction = grossRefundAmount + grossVoidAmount
    const netRevenue = grossRevenue - (grossDeduction)
    const revenueCollected = grossRevenue - (grossDeduction + totalPaymentGatewayCharge)

    const platformCommissionAmount = (platformCommissionPercentage / 100) * revenueCollected
    const modelEarning = (100 - platformCommissionPercentage) * revenueCollected / 100

    if (grossRevenue === 0 && totalPaymentGatewayCharge === 0) {
        console.log('No records found earning report for: domain: ', domain, date)
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
        payment_gateway: 'forumpay',
        platform_commission: platformCommissionPercentage,
        forumpay_transaction_commission: paymentCommissions,
        subscription_amount: subscriptionAmount.accounting_amount,
        subscription_refund_amount: subscriptionRefundAmount.accounting_amount,
        subscription_chargeback_amount: 0.00,
        subscription_chargeback_count: 0,
        subscription_void_amount: subscriptionVoidAmount.accounting_amount,
        shop_amount: shopAmount.accounting_amount,
        shop_refund_amount: shopRefundAmount.accounting_amount,
        shop_chargeback_amount: 0.00,
        shop_chargeback_count: 0,
        shop_void_amount: shopVoidAmount.accounting_amount,
        tip_amount: tipAmount.accounting_amount,
        tip_refund_amount: tipRefundAmount.accounting_amount,
        tip_chargeback_amount: 0.00,
        tip_chargeback_count: 0,
        tip_void_amount: tipVoidAmount.accounting_amount,
        gross_revenue: Number(grossRevenue.toFixed(2)),
        gross_refund: Number(grossDeduction.toFixed(2)),
        chargeback_amount: 0.00,
        chargeback_count: 0,
        chargeback_penalty: 0.00,
        declined_count: 0,
        declined_charges: 0.00,
        refund_amount: Number(grossRefundAmount.toFixed(2)),
        void_amount: Number(grossVoidAmount.toFixed(2)),
        net_revenue: Number(netRevenue.toFixed(2)),
        revenue_collected: Number(revenueCollected.toFixed(2)),
        platform_earning: Number(platformCommissionAmount.toFixed(2)),
        model_earning: Number(modelEarning.toFixed(2)),
        forumpay_transaction_charge: Number(totalPaymentGatewayCharge.toFixed(2)),
        created_at: new Date(),
        updated_at: new Date(),
        referral_history_id: (referralData !== null) ? referralData._id : null,
        referral_amount: referralAmount,
        referral_amount1: referralAmount1,
        referral_amount2: referralAmount2,
        gateway_charges: paymentCommissions,
        total_transaction_count: totalTransactionCount,
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
    console.log('report generated for domain:', domain, date, 'ForumPay')
    const data = new WebsiteEarningReports(charge)
    await data.save()
}

/**
 * @description Generate Daily Earning Report for Website by payment Gateway
 * @param {string} domain Domain name
 * @param {string} date Today Date
 * @param {object} paymentCommissions Payment Gateway Commissions
 * @param {number} platformCommissionPercentage Platform Commission Percentage
 * @returns {boolean} status
 */
async function generateDailyEarningByDomainAndPaymentGatewayWithReferral(domain, date, paymentCommissions, platformCommissionPercentage) {
    console.log('started earning report for: domain: ', domain, date, 'ForumPay')

    const referralEarningData = await generateDailyEarningByDomainAndPaymentGatewayForReferral(domain, date, paymentCommissions, platformCommissionPercentage)

    const subscriptionAmount = await getSumWithTypeAndDateWithoutReferral(SUBSCRIPTION, [NEW, REBILL], date, date, domain)
    const subscriptionRefundAmount = await getSumWithTypeAndDateWithoutReferral(SUBSCRIPTION, [REFUND], date, date, domain)
    const subscriptionVoidAmount = await getSumWithTypeAndDateWithoutReferral(SUBSCRIPTION, [VOID], date, date, domain)

    // TODO: Need to change shop amount calculation in phase 2
    const shopAmount = await getSumWithTypeAndDateWithoutReferral(SHOP_PURCHASE, [NEW], date, date, domain)
    const shopRefundAmount = await getSumWithTypeAndDateWithoutReferral(SHOP_PURCHASE, [REFUND], date, date, domain)
    const shopVoidAmount = await getSumWithTypeAndDateWithoutReferral(SHOP_PURCHASE, [VOID], date, date, domain)

    const tipAmount = await getSumWithTypeAndDateWithoutReferral(CONTENT_PURCHASE, [NEW], date, date, domain)
    const tipRefundAmount = await getSumWithTypeAndDateWithoutReferral(CONTENT_PURCHASE, [REFUND], date, date, domain)
    const tipVoidAmount = await getSumWithTypeAndDateWithoutReferral(CONTENT_PURCHASE, [VOID], date, date, domain)

    const grossRevenue = subscriptionAmount.accounting_amount + shopAmount.accounting_amount + tipAmount.accounting_amount
    const grossRefundAmount = subscriptionRefundAmount.accounting_amount + shopRefundAmount.accounting_amount + tipRefundAmount.accounting_amount
    const grossVoidAmount = subscriptionVoidAmount.accounting_amount + shopVoidAmount.accounting_amount + tipVoidAmount.accounting_amount

    const newTransactionCount = subscriptionAmount.count + shopAmount.count + tipAmount.count
    const refundTransactionCount = subscriptionRefundAmount.count + shopRefundAmount.count + tipRefundAmount.count
    const voidTransactionCount = subscriptionVoidAmount.count + shopVoidAmount.count + tipVoidAmount.count

    // Payment Gateway Charges on Transactions
    const newTransactionCharge = calculateTotalTransactionCharge(grossRevenue, paymentCommissions)
    const voidTransactionCharge = calculateTotalTransactionCharge(grossVoidAmount, paymentCommissions)
    const refundTransactionCharge = calculateTotalTransactionCharge(grossRefundAmount, paymentCommissions)

    const declineTransactionCharge = 0.00
    const totalTransactionCount = newTransactionCount + voidTransactionCount + refundTransactionCount
    const totalPaymentGatewayCharge = newTransactionCharge + voidTransactionCharge + refundTransactionCharge + declineTransactionCharge

    const grossDeduction = grossRefundAmount + grossVoidAmount
    const netRevenue = grossRevenue - (grossDeduction)
    const revenueCollected = grossRevenue - (grossDeduction + totalPaymentGatewayCharge)

    const platformCommissionAmount = (platformCommissionPercentage / 100) * revenueCollected
    const modelEarning = (100 - platformCommissionPercentage) * revenueCollected / 100

    if (grossRevenue === 0 && totalPaymentGatewayCharge === 0) {
        console.log('No records found earning report for: domain: ', domain, date)
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
        payment_gateway: 'forumpay',
        platform_commission: platformCommissionPercentage,
        forumpay_transaction_commission: paymentCommissions,
        subscription_amount: subscriptionAmount.accounting_amount + referralEarningData.subscriptionAmount,
        subscription_refund_amount: subscriptionRefundAmount.accounting_amount + referralEarningData.subscriptionRefundAmount,
        subscription_chargeback_amount: 0.00,
        subscription_chargeback_count: 0,
        subscription_void_amount: subscriptionVoidAmount.accounting_amount + referralEarningData.subscriptionVoidAmount,
        shop_amount: shopAmount.accounting_amount + referralEarningData.shopAmount,
        shop_refund_amount: shopRefundAmount.accounting_amount + referralEarningData.shopRefundAmount,
        shop_chargeback_amount: 0.00,
        shop_chargeback_count: 0,
        shop_void_amount: shopVoidAmount.accounting_amount + referralEarningData.shopVoidAmount,
        tip_amount: tipAmount.accounting_amount + referralEarningData.tipAmount,
        tip_refund_amount: tipRefundAmount.accounting_amount + referralEarningData.tipRefundAmount,
        tip_chargeback_amount: 0.00,
        tip_chargeback_count: 0,
        tip_void_amount: tipVoidAmount.accounting_amount + referralEarningData.tipVoidAmount,
        gross_revenue: Number(grossRevenue.toFixed(2)) + Number(referralEarningData.grossRevenue.toFixed(2)),
        gross_refund: Number(grossDeduction.toFixed(2)) + Number(referralEarningData.grossDeduction.toFixed(2)),
        chargeback_amount: 0.00,
        chargeback_count: 0,
        chargeback_penalty: 0.00,
        declined_count: 0,
        declined_charges: 0.00,
        refund_amount: Number(grossRefundAmount.toFixed(2)) + Number(referralEarningData.grossRefundAmount.toFixed(2)),
        void_amount: Number(grossVoidAmount.toFixed(2)) + Number(referralEarningData.grossVoidAmount.toFixed(2)),
        net_revenue: Number(netRevenue.toFixed(2)) + Number(referralEarningData.netRevenue.toFixed(2)),
        revenue_collected: Number(revenueCollected.toFixed(2)) + Number(referralEarningData.revenueCollected.toFixed(2)),
        platform_earning: Number(platformCommissionAmount.toFixed(2)) + Number(referralEarningData.platformCommission.toFixed(2)),
        model_earning: Number(modelEarning.toFixed(2)) + Number(referralEarningData.modelEarning.toFixed(2)),
        forumpay_transaction_charge: Number(totalPaymentGatewayCharge.toFixed(2)) + Number(referralEarningData.paymentGatewayCharge.toFixed(2)),
        created_at: new Date(),
        updated_at: new Date(),
        referral_history_id: (referralData !== null) ? referralData._id : null,
        referral_amount: referralAmount + referralEarningData.referralEarning,
        referral_amount1: referralAmount1 + referralEarningData.referralEarning1,
        referral_amount2: referralAmount2 + referralEarningData.referralEarning2,
        gateway_charges: paymentCommissions,
        total_transaction_count: totalTransactionCount + referralEarningData.totalTransactionCount,
        subscription_count: subscriptionAmount.count + referralEarningData.subscriptionCount,
        subscription_refund_count: subscriptionRefundAmount.count + referralEarningData.subscriptionRefundCount,
        subscription_void_count: subscriptionVoidAmount.count + referralEarningData.subscriptionVoidCount,
        shop_count: shopAmount.count + referralEarningData.shopCount,
        shop_refund_count: shopRefundAmount.count + referralEarningData.shopRefundCount,
        shop_void_count: shopVoidAmount.count + referralEarningData.shopVoidCount,
        tip_count: tipAmount.count + referralEarningData.tipCount,
        tip_refund_count: tipRefundAmount.count + referralEarningData.tipRefundCount,
        tip_void_count: tipVoidAmount.count + referralEarningData.tipVoidCount,
        link_tracking_referral_history_id: (referralEarningData.referralData !== null) ? referralEarningData.referralData._id : null,
    }
    console.log('report generated for domain:', domain, date, 'ForumPay')
    const data = new WebsiteReferralDailyEarningReports(charge)
    await data.save()
}

/**
 *
 * @param {string} domain domain
 * @param {string} date date
 * @param {object} paymentCommissions paymentCommissions
 * @param {string} platformCommissionPercentage platformCommissionPercentage
 * @returns {object} referral earning data
 */
async function generateDailyEarningByDomainAndPaymentGatewayForReferral(domain, date, paymentCommissions, platformCommissionPercentage) {
    const subscriptionAmount = await getSumWithTypeAndDateWithReferral(SUBSCRIPTION, [NEW, REBILL], date, date, domain, paymentCommissions, platformCommissionPercentage)
    const subscriptionRefundAmount = await getSumWithTypeAndDateWithReferral(SUBSCRIPTION, [REFUND], date, date, domain, paymentCommissions, platformCommissionPercentage)
    const subscriptionVoidAmount = await getSumWithTypeAndDateWithReferral(SUBSCRIPTION, [VOID], date, date, domain, paymentCommissions, platformCommissionPercentage)

    // TODO: Need to change shop amount calculation in phase 2
    const shopAmount = await getSumWithTypeAndDateWithReferral(SHOP_PURCHASE, [NEW], date, date, domain, paymentCommissions, platformCommissionPercentage)
    const shopRefundAmount = await getSumWithTypeAndDateWithReferral(SHOP_PURCHASE, [REFUND], date, date, domain, paymentCommissions, platformCommissionPercentage)
    const shopVoidAmount = await getSumWithTypeAndDateWithReferral(SHOP_PURCHASE, [VOID], date, date, domain, paymentCommissions, platformCommissionPercentage)

    const tipAmount = await getSumWithTypeAndDateWithReferral(CONTENT_PURCHASE, [NEW], date, date, domain, paymentCommissions, platformCommissionPercentage)
    const tipRefundAmount = await getSumWithTypeAndDateWithReferral(CONTENT_PURCHASE, [REFUND], date, date, domain, paymentCommissions, platformCommissionPercentage)
    const tipVoidAmount = await getSumWithTypeAndDateWithReferral(CONTENT_PURCHASE, [VOID], date, date, domain, paymentCommissions, platformCommissionPercentage)

    const grossRevenue = subscriptionAmount.grossRevenue + shopAmount.grossRevenue + tipAmount.grossRevenue
    const grossRefundAmount = subscriptionRefundAmount.grossRevenue + shopRefundAmount.grossRevenue + tipRefundAmount.grossRevenue
    const grossVoidAmount = subscriptionVoidAmount.grossRevenue + shopVoidAmount.grossRevenue + tipVoidAmount.grossRevenue

    const totalTransactionCount = subscriptionAmount.transactionCount + shopAmount.transactionCount + tipAmount.transactionCount

    const totalGrossDeduction = grossRefundAmount + grossVoidAmount
    const platformCommission = subscriptionAmount.platformCommission + shopAmount.platformCommission + tipAmount.platformCommission
    const modelEarning = subscriptionAmount.modelEarning + shopAmount.modelEarning + tipAmount.modelEarning

    const subscriptionPaymentGatewayCharge = subscriptionAmount.totalPaymentGatewayCharge + subscriptionRefundAmount.totalPaymentGatewayCharge + subscriptionVoidAmount.totalPaymentGatewayCharge
    const shopPaymentGatewayCharge = shopAmount.totalPaymentGatewayCharge + shopRefundAmount.totalPaymentGatewayCharge + shopVoidAmount.totalPaymentGatewayCharge
    const tipPaymentGatewayCharge = tipAmount.totalPaymentGatewayCharge + tipRefundAmount.totalPaymentGatewayCharge + tipVoidAmount.totalPaymentGatewayCharge

    const totalPaymentGatewayCharge = subscriptionPaymentGatewayCharge + shopPaymentGatewayCharge + tipPaymentGatewayCharge
    const referralEarning = subscriptionAmount.referralEarning + shopAmount.referralEarning + tipAmount.referralEarning
    const referralEarning1 = subscriptionAmount.referralEarning1 + shopAmount.referralEarning1 + tipAmount.referralEarning1
    const referralEarning2 = subscriptionAmount.referralEarning2 + shopAmount.referralEarning2 + tipAmount.referralEarning2

    return {
        grossRevenue: grossRevenue,
        grossRefundAmount: grossRefundAmount,
        grossVoidAmount: grossVoidAmount,
        totalTransactionCount: totalTransactionCount,
        subscriptionAmount: subscriptionAmount.grossRevenue,
        shopAmount: shopAmount.grossRevenue,
        tipAmount: tipAmount.grossRevenue,
        subscriptionRefundAmount: subscriptionRefundAmount.grossRevenue,
        shopRefundAmount: shopRefundAmount.grossRevenue,
        tipRefundAmount: tipRefundAmount.grossRevenue,
        subscriptionVoidAmount: subscriptionVoidAmount.grossRevenue,
        shopVoidAmount: shopVoidAmount.grossRevenue,
        tipVoidAmount: tipVoidAmount.grossRevenue,
        grossDeduction: totalGrossDeduction,
        subscriptionCount: subscriptionAmount.transactionCount,
        subscriptionRefundCount: subscriptionRefundAmount.transactionCount,
        subscriptionVoidCount: subscriptionVoidAmount.transactionCount,
        shopCount: shopAmount.transactionCount,
        shopRefundCount: shopRefundAmount.transactionCount,
        shopVoidCount: shopVoidAmount.transactionCount,
        tipCount: tipAmount.transactionCount,
        tipRefundCount: tipRefundAmount.transactionCount,
        tipVoidCount: tipVoidAmount.transactionCount,
        platformCommission: platformCommission,
        modelEarning: modelEarning,
        paymentGatewayCharge: totalPaymentGatewayCharge,
        referralEarning: referralEarning,
        referralEarning1: referralEarning1,
        referralEarning2: referralEarning2,
        referralData: subscriptionAmount.referralData
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
 * @param {string} domain Domain
 * @returns {Promise<TotalAmount>} TotalAmounts
 */
async function getSumWithTypeAndDate(pcpTransactionType, transactionTypes, startDate, endDate, domain) {
    const transactionStartDate = moment(startDate).format('YYYY-MM-DDT00:00:00Z')
    const transactionEndDate = moment(endDate).format('YYYY-MM-DDT23:59:59Z')

    const transactions = await ForumPayWalletTransactionReports.aggregate([
        {
            $match: {
                mst_transaction_date: { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
                transaction_type: { $in: transactionTypes },
                pcp_transaction_type: { $in: pcpTransactionType },
                website_url: domain
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
 * @param {string} domain Domain
 * @returns {Promise<TotalAmount>} TotalAmounts
 */
async function getSumWithTypeAndDateWithoutReferral(pcpTransactionType, transactionTypes, startDate, endDate, domain) {
    const transactionStartDate = moment(startDate).format('YYYY-MM-DDT00:00:00Z')
    const transactionEndDate = moment(endDate).format('YYYY-MM-DDT23:59:59Z')

    const transactions = await ForumPayWalletTransactionReports.aggregate([
        {
            $match: {
                mst_transaction_date: { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
                transaction_type: { $in: transactionTypes },
                pcp_transaction_type: { $in: pcpTransactionType },
                website_url: domain,
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
 * To get sum of accounting of product id with transaction type of specified date
 *
 * @param {Array<string>} pcpTransactionType PCP transaction type
 * @param {Array<string>} transactionTypes - NEW,REBILL,CHARGEBACK,VOID
 * @param {string} startDate start date
 * @param {string} endDate end date
 * @param {string} domain Domain
 * @param {object} paymentCommissions Payment Commissions
 * @param {string} platformCommissionPercentage platformCommissionPercentage
 * @returns {Promise<TotalAmount>} TotalAmounts
 */
async function getSumWithTypeAndDateWithReferral(pcpTransactionType, transactionTypes, startDate, endDate, domain, paymentCommissions, platformCommissionPercentage) {
    const transactionStartDate = moment(startDate).format('YYYY-MM-DDT00:00:00Z')
    const transactionEndDate = moment(endDate).format('YYYY-MM-DDT23:59:59Z')

    const query = {
        mst_transaction_date: { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
        transaction_type: { $in: transactionTypes },
        pcp_transaction_type: { $in: pcpTransactionType },
        website_url: domain,
        tracking_link: { $exists: true, $ne: '' }
    }

    const transactions = await ForumPayWalletTransactionReports.find(query)

    let referralEarning = 0
    let referralEarning1 = 0
    let referralEarning2 = 0
    let grossRevenue = 0
    let totalRevenueCollected = 0
    let totalNetRevenue = 0
    let totalPlatformCommission = 0
    let totalModelEarning = 0
    let totalGrossDeduction = 0
    let totalPaymentGatewayCharge = 0
    let referralData = null

    for (const transaction of transactions) {
        const amount = parseFloat(transaction.amount) || 0
        grossRevenue += amount

        let refundAmount = 0
        let voidAmount = 0

        if (transactionTypes === REFUND) {
            refundAmount += amount
        }

        if (transactionTypes === VOID) {
            voidAmount += amount
        }
        // Payment Gateway Charges on Transactions

        let newTransactionCharge = 0
        let voidTransactionCharge = 0
        let refundTransactionCharge = 0
        if ([NEW, REBILL].includes(transactionTypes)) {
            newTransactionCharge = calculateTotalTransactionCharge(amount, paymentCommissions)
        }

        if (transactionTypes === VOID) {
            voidTransactionCharge = calculateTotalTransactionCharge(amount, paymentCommissions)
        }

        if (transactionTypes === REFUND) {
            refundTransactionCharge = calculateTotalTransactionCharge(amount, paymentCommissions)
        }

        const declineTransactionCharge = 0.00
        const paymentGatewayCharge = newTransactionCharge + voidTransactionCharge + refundTransactionCharge + declineTransactionCharge
        totalPaymentGatewayCharge += paymentGatewayCharge

        const grossDeduction = refundAmount + voidAmount
        totalGrossDeduction += grossDeduction
        const netRevenue = amount - (grossDeduction || 0)
        totalNetRevenue += netRevenue
        const revenueCollected = amount - ((grossDeduction || 0) + paymentGatewayCharge)
        totalRevenueCollected += revenueCollected

        const platformCommissionAmount = (platformCommissionPercentage / 100) * revenueCollected
        totalPlatformCommission += platformCommissionAmount
        const modelEarning = (100 - platformCommissionPercentage) * revenueCollected / 100
        totalModelEarning += modelEarning

        referralData = await getWebsiteDomainReferralForDateForReferral(domain, startDate, transaction.referral)
        let referralAmount = 0
        let referralAmount1 = 0
        let referralAmount2 = 0

        if (referralData !== null && referralData !== false) {
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
        referralEarning += referralAmount
        referralEarning1 += referralAmount1
        referralEarning2 += referralAmount2
    }

    return {
        grossRevenue: grossRevenue,
        referralEarning: referralEarning,
        referralEarning1: referralEarning1,
        referralEarning2: referralEarning2,
        revenueCollected: totalRevenueCollected,
        netRevenue: totalNetRevenue,
        platformCommission: totalPlatformCommission,
        modelEarning: totalModelEarning,
        grossDeduction: totalGrossDeduction,
        totalPaymentGatewayCharge: totalPaymentGatewayCharge,
        referralData: referralData,
        transactionCount: transactions.length
    }
}

/**
 * @description Calculate total Transaction charge
 * @param {number} transaction_amounts Sum of Transaction amounts
 * @param {string} forum_pay_transaction_charge Forum pay transaction charge
 * @returns {number} total Charge of transaction
 */
function calculateTotalTransactionCharge(transaction_amounts, forum_pay_transaction_charge) {
    const percentage_payment_gateway_charge = ((transaction_amounts) * parseFloat(forum_pay_transaction_charge)) / 100
    const total_charge = percentage_payment_gateway_charge

    return total_charge
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
 * @param {string} referral_name referral name
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
        $or: [
            { referral_name: referral_name },
            { referral_name1: referral_name },
            { referral_name2: referral_name }
        ]
    }

    const websiteReferralHistory = await WebsiteReferralHistory.findOne(where, fields).sort({ target_date: -1 })
    return websiteReferralHistory
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
 * @description Generate Daily Transaction Report for wallet
 * @returns {boolean} true
 */
async function generateAllWalletTransactionReport() {
    const websites = await Website.find({ is_crypto_payment_enabled: true }, 'website_url')
    const firstWalletTransaction = await WalletTransactions.findOne({}, 'createdAt').sort({ _id: 1 })
    const startMoment = moment(firstWalletTransaction.createdAt)
    const endMoment = moment()

    while (startMoment.isBefore(endMoment, 'day')) {
        const date = startMoment.format('YYYY-MM-DD')
        for (let website of websites) {
            console.log(`Start Transaction Import for ${website.website_url}, Date: ${date}`)
            await generateWalletTransactionReportByDate(website.website_url, date)
            console.log(`Complete Transaction Import for ${website.website_url}, Date: ${date}`)
        }
        startMoment.add(1, 'days')
    }
    console.log('Report Successfully Generated')
    return true
}

/**
 * @description calculate forumpay earning by date range
 * @param {string} start_date start date in format YYYY-MM-DD
 * @param {string} end_date end date in format YYYY-MM-DD
 */
async function generateForumPayReportByDate(start_date, end_date) {
    const websites = await Website.find({ is_crypto_payment_enabled: true }, 'website_url')

    for (const website of websites) {
        const startMoment = moment(start_date)
        const endMoment = moment(end_date).add(1, 'days')

        while (startMoment.isBefore(endMoment, 'day')) {
            console.log('-------------')
            const date = startMoment.format('YYYY-MM-DD')
            console.log(`Start Report for ${website.website_url}, Date: ${date}`)
            await generateWalletTransactionReportByDate(website.website_url, date)

            startMoment.add(1, 'days')
            console.log(`Complete Report for ${website.website_url}, Date: ${date}`)
            console.log('-------------')
        }
    }
}

/**
 * @description calculate forumpay earning by date range
 * @param {string} start_date start date in format YYYY-MM-DD
 * @param {string} end_date end date in format YYYY-MM-DD
 */
async function calculateForumPayEarningByDateRange(start_date, end_date) {
    const websites = await Website.find({ is_crypto_payment_enabled: true }, 'website_url')

    for (const website of websites) {
        const startMoment = moment(start_date)
        const endMoment = moment(end_date).add(1, 'days')

        while (startMoment.isBefore(endMoment, 'day')) {
            console.log('-------------')

            const earningDate = startMoment.format('YYYY-MM-DDT00:00:00+00:00')
            await generateForumPayDailyEarningReportByDomainAndDate(website.website_url, earningDate)

            startMoment.add(1, 'days')
            console.log(`Complete Report for ${website.website_url}, Date: ${earningDate}`)
            console.log('-------------')
        }
    }
}

/**
 * @description PCP transaction type for earning report
 * @param {string} type Type
 * @returns {string} pcp transaction type
 */
function pcpTransactionType(type) {
    switch (type) {
        case 'blog':
            return 'feed_unlock'
        case 'chat':
            return 'chat_unlock'
        case 'tips':
            return 'tip'
        case 'subscription':
            return 'subscription'
        case 'rebill':
            return 'subscription'
        case 'chat_pay_per_message':
            return 'pay_per_message'
        default:
            return ''
    }
}

/**
 * @description Add MST Datetime with wallet transaction
 */
async function addMSTTimeInWalletTransactions() {
    try {
        const transactions = await WalletTransactions.find({})
        for (const transaction of transactions) {
            const mst_date = moment(transaction.createdAt).tz('America/Phoenix').format('YYYY-MM-DDTHH:mm:ss')
            await WalletTransactions.findByIdAndUpdate(transaction._id, { $set: { mst_created_date: mst_date } })
        }
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    generateDailyWalletTransactionReport,
    getForumPayTransactionReport,
    generateWalletTransactionReportByDate,
    generateForumPayDailyEarningReportByDate,
    generateForumPayDailyEarningReportByDomainAndDate,
    generateAllWalletTransactionReport,
    calculateForumPayEarningByDateRange,
    generateForumPayReportByDate,
    addMSTTimeInWalletTransactions,
    generateForumPayDailyEarningReportByDomainAndDateForReferral
}
