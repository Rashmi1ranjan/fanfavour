require('dotenv').config()
const mongoose = require('mongoose')
const _ = require('lodash')
const fs = require('fs')
const util = require('util')
const Sentry = require('@sentry/node')
const TransactionReports = require('./models/CCBillTransactionReports')
const AppSettings = require('./models/AppSettings')
const CountryList = require('./models/CountryList')
const StateList = require('./models/StateList')
const CityList = require('./models/CityList')
const CCBillErrorLog = require('./models/CCBillErrorLog')
const CBPTErrorLog = require('./models/CBPTErrorLog')
const countryData = require('./countries')
const stateData = require('./state')
const cityArray = require('./cities')
const moment = require('moment')
const csv2array = require('./utils/csv.to.array')
const Website = require('./models/Website')
const WebsiteCommission = require('./models/WebsiteCommission')
const WebsiteEarningReports = require('./models/WebsiteDailyEarningReport')
const path = require('path')
const parameters = process.argv.slice(2)
const param1 = parameters[0] || null
const param2 = parameters[1] || null
const param3 = parameters[2] || null
const param4 = parameters[3] || null
const param5 = parameters[4] || null
const { removeCCBillErrorLog } = require('./utils/removeCCBillErrorLog')
const { generateDailyEarningReportByDate, generateDailyEarningReportWithRange, generateDailyEarningReportOfDomainWithRange, addMonthlyEarningInWebsites } = require('./dailyEarningReport')
const { loopAllWebsites } = require('./utils/verifyTransactionReport')
const WebsiteReferralHistory = require('./models/WebsiteReferralHistory')
const CCBillTransactionReports = require('./models/CCBillTransactionReports')
const { setTargetDateOfWebsiteReferral } = require('./commands/websiteReferralHistory')
const { platformUserAnalytics, getPlatformUserAnalyticsByWebsite, getYesterdayPlatformUserAnalytics, createAnalyticsUser, createSupportUser, createReferralUser } = require('./commands/analyticsReport')
const { assignWebsiteId } = require('./commands/websiteId')
const { removeUnusedIndexFromDatabase } = require('./commands/dropDbIndex')
const { removeEmailWebhook } = require('./commands/removeEmailWebhook')
const { updateIsUniqueFlagForCCBillAddCardLog } = require('./commands/updateIsUniqueFlagForCCBillAddCardLog')
const { resolveMissingWebhooks } = require('./commands/resolveMissingWebhooks')
const { getPromotionReport } = require('./commands/getPromotionReport')
const { updateWebsitePaymentGateway } = require('./commands/updateWebsitePaymentGateway')
const {
    stickyIoDailyTransactionAnalysis,
    generateStickyIoDailyEarningReportByDate,
    generateStickyIoDailyEarningReportByDomainAndDate,
    generateStickyIoDailyEarningReportOfDomainWithRange,
    fixStickyIoTransactionsChargeback
} = require('./utils/stickyIoTransactions')
const getOptInStatusReport = require('./commands/getOptInCountFromWebsite')
const fixOptInReporting = require('./commands/fixOptInReporting')
const { setStickyIoTransactionPaymentGateway } = require('./commands/setStickyIoTransactionPaymentGateway')
const { updateWebsiteCommission } = require('./commands/updateWebsiteCommission')
const { removeHttpsFromCCBillErrorLog } = require('./commands/removeHttpsFromCCBillErrorLog')
const { processStickyIoTransactions } = require('./commands/processStickyIoRebillTransaction')
const { moveLiveStreamVideo } = require('./commands/moveLiveStreamVideo')
const { processHybridTransactionSummaryCount, fixHybridSecondaryPaymentCount } = require('./commands/processHybridTransactionCount')
const { setTotalTransactionCount } = require('./commands/setTotalTransactionCount')
const {
    addTransactionQueueCron,
    getTransactionQueueCron,
    generateDailyEarningReportByDateCron,
    findMissingWebhooksCron,
    removeCCBillErrorLogCron,
    getWebsiteCommissionForDate,
    generateDailyEarningReportByDateCronForReferral
} = require('./utils/cron')
const { websiteReferralMigrationInMaster, addReferralIdIntoWebsiteReferralHistory } = require('./commands/websiteReferralMigrationInMaster')
const { generateContentLogForDataScientist, createMySQLTables, alterTableToAddTransactionIdColumn, connectToMySql, deleteTransactionRecordByDateWithDomain, getPrivateMessagesLog, userRegistrationSubscriptionLog, createUserSubscriptionRegistrationCountLogTableInMySql } = require('./commands/migrateDataFromMongoDbToMySql')
const { updateStickyIoRealChargeWithFixedCharge, addCCBillFixedTransactionCharge } = require('./commands/updateStickyIoCharge')
const { generateTransactionDataForDataScientist, sendTransactionToMySQL } = require('./commands/transactionDataForDataScientist')
const { getContentCountFromWebsite } = require('./commands/transactionDataForDataScientist')
const { getForumPayTransactionReport,
    generateWalletTransactionReportByDate,
    generateDailyWalletTransactionReport,
    generateAllWalletTransactionReport,
    calculateForumPayEarningByDateRange,
    generateForumPayReportByDate,
    addMSTTimeInWalletTransactions
} = require('./utils/ForumPayTransaction')
const { createAccountManager } = require('./commands/accountManager')
const { getUserStatisticsFromWebsites } = require('./utils/websiteUserStatistics')
const { getUserIdWithSubscriptionId } = require('./commands/voidRefundAndChargeback')
const { processMissingForumPayWebhook, acceptCancelledTransactions, checkForumPayTransactionStatusAfterPaymentAccept } = require('./utils/forumpay')
const { updateWalletTransactionStatus, updateUserWalletBalance } = require('./commands/updateWalletTransactionStatus')
const { checkPaymentSetting } = require('./commands/websitePaymentSettings')
const { checkUserSubscriptionStatusAfterRebill, getUserTotalAmountSpentSinceLastSubscription } = require('./commands/checkUserSubscriptionStatus')
const { AddUserCCbillStatusInPWAInfo, addCorrectPWAInstallStatus } = require('./commands/AddUserCCbillStatusInPWAInfo')
const { getAllWebsiteUserCount } = require('./commands/activeUserCount')
const { getOneSignalAnalyticData } = require('./utils/oneSignalAnalytic')
const { cleanOldCronLogs } = require('./utils/addCronStatus')
const { getAllWebsitesUsersAndCards, getWebsiteUserAndCardDetails, updateUniversalUserSubscriptionAndAvatar } = require('./utils/universalLogin')
const StickyIoTransactionReport = require('./models/StickyIoTransactionReport')
const WebsiteDailyEarningReport = require('./models/WebsiteDailyEarningReport')
const { topTenModel, storeFanFavourModel } = require('./commands/storeFanFavourModelList')
const FanFavourModel = require('./models/FanFavourModel')
const { generateWebsiteSSOSecret } = require('./utils/manageSSOToken')
const { disconnectRedis } = require('./utils/redis.util')
// DB Config
const db = process.env.MONGO_URI
const package_version = require('./package.json').version
const packageVersion = package_version || '1.0.0'

if (process.env.NODE_ENV === 'production') {
    Sentry.init({
        dsn: 'https://39fff38e1a584a13bbcdb36153e2faca@o392495.ingest.sentry.io/6203457',
        // We recommend adjusting this value in production, or using tracesSampler
        // for finer control
        tracesSampleRate: 0.001,
        release: 'services-command@' + packageVersion
    })
}

let cleanupStarted = false
const exitWithCleanup = async (code = 0) => {
    if (!cleanupStarted) {
        cleanupStarted = true
        try {
            await disconnectRedis()
        } catch (err) {
            console.warn('[Redis] Cleanup error:', err.message)
        }
    }

    await mongoose.disconnect()
    process.exit(code)
}

function calculateCommissions(newLimit) {
    return new Promise(async (resolve, reject) => {
        let updatedTransctionReports = 0

        await allTransactionReportsLoop(newLimit, async (transaction) => {
            const subAccount = transaction.client_sub_account
            const amount = transaction.accounting_amount
            let appSettings = await AppSettings.findOne({ sub_account: subAccount })
            if (!_.isEmpty(appSettings)) {
                var platformCommission = appSettings.platform_commission
                var ccbillCharge = appSettings.ccbill_charge
                var orignalAmount = parseFloat(amount)

                var ccbillChargeAmount = (orignalAmount * ccbillCharge) / 100
                ccbillChargeAmount = parseFloat(ccbillChargeAmount.toFixed(2))

                var remainingAmount = orignalAmount - ccbillChargeAmount

                var platformCommissionAmount = (remainingAmount * platformCommission) / 100
                platformCommissionAmount = parseFloat(platformCommissionAmount.toFixed(2))

                var modelEarnings = orignalAmount - ccbillChargeAmount - platformCommissionAmount

                transaction.pcp_model_earnings = modelEarnings
                transaction.pcp_platform_commission = platformCommissionAmount
                transaction.pcp_ccbill_charge = ccbillChargeAmount

                await transaction.save()
                updatedTransctionReports++
            }
        })
        resolve(updatedTransctionReports)
    })
}

async function allTransactionReportsLoop(newLimit, callback) {
    let totalTransactions = 0
    let previousMonthStartDate = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD HH:mm:ss')
    previousMonthStartDate = new Date(previousMonthStartDate)

    try {
        totalTransactions = await TransactionReports.find({ 'pcp_transaction_date': { $gte: previousMonthStartDate } }).countDocuments()
    } catch (error) {
        console.log(error)
        return
    }

    if (totalTransactions > 0) {
        let limit = (newLimit === null) ? 50 : parseInt(newLimit, 10)
        let totalPages = Math.ceil(totalTransactions / limit)
        for (let index = 0; index < totalPages; index++) {
            let offset = index * limit
            console.log(`Records updated: ${offset}`)
            let transactions = []
            try {
                transactions = await TransactionReports.find({ 'pcp_transaction_date': { $gte: previousMonthStartDate } }).skip(offset).limit(limit)
            } catch (error) {
                console.log(error)
                return
            }
            for (let i = 0; i < transactions.length; i++) {
                await callback(transactions[i])
            }
        }
    }
}

function addCountryList() {
    return new Promise(async (resolve) => {
        let index = 0
        let j = 0
        let k = 0

        for (index; index < countryData.length; index++) {
            const element = countryData[index];

            let countryObject = {
                name: element.name,
                iso3: element.iso3,
                iso2: element.iso2,
                phone_code: element.phone_code,
                created_at: new Date()
            }

            let countryList = new CountryList(countryObject)

            await countryList.save()
            let countryCode = countryList._id.toString()
            let countryCodeObjectId = generateObjectId(countryCode)

            for (j = 0; j < stateData.length; j++) {
                const stateElement = stateData[j]

                if (stateElement.country_id == element.id) {
                    let stateObject = {
                        name: stateElement.name,
                        country_id: countryCodeObjectId,
                        state_code: stateElement.state_code
                    }

                    let stateList = new StateList(stateObject)

                    await stateList.save()
                    let stateCode = stateList._id.toString()
                    let stateCodeObjectId = generateObjectId(stateCode)

                    for (k = 0; k < cityArray.length; k++) {
                        const cityElement = cityArray[k]

                        if (cityElement.state_id == stateElement.id && cityElement.country_id == element.id) {
                            let cityObject = {
                                name: cityElement.name,
                                country_id: countryCodeObjectId,
                                state_id: stateCodeObjectId
                            }

                            let cityList = new CityList(cityObject)

                            await cityList.save()
                        }
                    }
                }
            }
        }

        if (index == countryData.length) {
            resolve(index)
        }
    })
}

function generateObjectId(string) {
    return new mongoose.Types.ObjectId(string)
}

/**
 * Update Earnings based on sub accounts from param
 */
async function updateEarnings(subscriptionIds) {
    let updatedTransactionReports = 0
    let subAccountArray = subscriptionIds.split(',')

    await allTransactionsLoop(subAccountArray, async (transactionReport) => {
        let appSettings = await AppSettings.findOne({ sub_account: transactionReport.client_sub_account })

        var platformCommission = appSettings.platform_commission
        var ccbillCharge = appSettings.ccbill_charge
        var orignalAmount = parseFloat(transactionReport.accounting_amount)

        var ccbillChargeAmount = (orignalAmount * ccbillCharge) / 100
        ccbillChargeAmount = parseFloat(ccbillChargeAmount.toFixed(2))

        var remainingAmount = orignalAmount - ccbillChargeAmount

        var platformCommissionAmount = (remainingAmount * platformCommission) / 100
        platformCommissionAmount = parseFloat(platformCommissionAmount.toFixed(2))

        var modelEarnings = orignalAmount - ccbillChargeAmount - platformCommissionAmount

        transactionReport.pcp_model_earnings = modelEarnings
        transactionReport.pcp_platform_commission = platformCommissionAmount
        transactionReport.pcp_ccbill_charge = ccbillChargeAmount

        await transactionReport.save()
        updatedTransactionReports++
    })

    return new Promise((resolve) => {
        resolve(updatedTransactionReports)
    })
}

async function allTransactionsLoop(subAccountArray, callback) {
    let totaltransactionsReport = 0
    try {
        totaltransactionsReport = await TransactionReports.countDocuments({ 'client_sub_account': { $in: subAccountArray } })
        console.log(`Total Transactions Reports ${totaltransactionsReport}`)
    } catch (error) {
        console.log(error)
        return
    }

    if (totaltransactionsReport > 0) {
        let limit = 500
        let totalPages = Math.ceil(totaltransactionsReport / limit)
        for (let index = 0; index < totalPages; index++) {
            let offset = index * limit
            let transactionReports = []
            console.log(`Transactions Reports updated ${offset}`)
            try {
                transactionReports = await TransactionReports.find({ 'client_sub_account': { $in: subAccountArray } }).skip(offset).limit(limit)
            } catch (error) {
                console.log(error)
                return
            }
            for (let i = 0; i < transactionReports.length; i++) {
                await callback(transactionReports[i])
            }
        }
    }
}

async function addVoidData() {
    var csvFile = __dirname + "/void.csv";
    let newDataAddedCount = 0
    const readFile = util.promisify(fs.readFile)
    let csvData = await readFile(csvFile, {
        encoding: 'utf-8'
    })
    let rows = csv2array(csvData)

    if (rows.length > 0) {
        for (let index = 0; index < rows.length; index++) {
            const row = rows[index]
            let [
                type,
                client_account_number,
                client_sub_account,
                subscription_id,
                transaction_date,
                void_date,
                void_amount
            ] = row

            let existingTransactionReportsCount = await TransactionReports.countDocuments({
                type: type,
                subscription_id: subscription_id,
                client_account_number: client_account_number,
                client_sub_account: client_sub_account,
                transaction_timestamp: moment(void_date, 'YYYYMMDDHHmmss')
            })

            if (existingTransactionReportsCount === 0) {
                let existingTransactionReportData = await TransactionReports.findOne({
                    type: 'NEW',
                    subscription_id: subscription_id,
                    client_account_number: client_account_number,
                    client_sub_account: client_sub_account
                })

                let voidData = {
                    type: type,
                    client_account_number: client_account_number,
                    client_sub_account: client_sub_account,
                    subscription_id: subscription_id,
                    transaction_timestamp: moment(void_date).format('YYYYMMDDHHmmss'),
                    accounting_amount: void_amount,
                    pcp_model_earnings: existingTransactionReportData.pcp_model_earnings,
                    pcp_platform_commission: existingTransactionReportData.pcp_platform_commission,
                    pcp_ccbill_charge: existingTransactionReportData.pcp_ccbill_charge,
                    pcp_transaction_date: moment(void_date, 'YYYYMMDDHHmmss')
                }

                var transactionReports = new TransactionReports(voidData)
                await transactionReports.save()
                newDataAddedCount++
            }
        }
    }

    return new Promise((resolve) => {
        resolve(newDataAddedCount)
    })
}

/**
 * Copy All -9 CBPT response to another collection
 *
 * @param {string} startDate Start date from where the error logs should be looped
 * @param {*} endDate End date till where the error logs should be looped
 * @returns {Promise} Returns the number of records added
 */
async function copyErrorResponseToAnotherCollection(startDate, endDate) {
    let dataAdded = 0
    const startDateTime = moment(startDate).format('YYYY-MM-DD 00:00:00')
    const endDateTime = moment(endDate).format('YYYY-MM-DD 23:59:59')
    await loopAllErrorLogs(startDateTime, endDateTime, async (errorLog) => {
        const _id = new mongoose.Types.ObjectId(errorLog._id)
        const errorObject = {
            _id: _id,
            url: errorLog.url,
            domain: errorLog.domain,
            is_processed: false,
            created_at: errorLog.created_at,
            updated_at: new Date()
        }

        let cbptErrorData = new CBPTErrorLog(errorObject)
        await cbptErrorData.save()
        dataAdded++
    })

    return new Promise((resolve) => {
        resolve(dataAdded)
    })
}

/**
 * Loop all decline text 40 error error logs from the days specified
 *
 * @param {string} startDate The start date from where error logs should be looped
 * @param {string} endDate The end date till where the error logs should be looped
 * @param {*} callback Send one record at a time if found
 */
async function loopAllErrorLogs(startDate, endDate, callback) {
    console.log(startDate)
    console.log(endDate)
    const query = {
        response_code: '-9',
        domain: 'https://ohwhatawoman.sunkissedgirls.com',
        created_at: {
            $gte: startDate,
            $lte: endDate
        }
    }
    let totalErrorDocumentsCount = await CCBillErrorLog.countDocuments(query)

    let limit = 500
    let totalPages = Math.ceil(totalErrorDocumentsCount / limit)
    for (let index = 0; index < totalPages; index++) {
        let offset = index * limit
        let errorLogs = []
        console.log(`CCBill error reports added ${offset}`)
        try {
            errorLogs = await CCBillErrorLog.find(query).skip(offset).limit(limit)
        } catch (error) {
            console.log(error)
            return
        }
        for (let i = 0; i < errorLogs.length; i++) {
            await callback(errorLogs[i])
        }
    }
}

function calculateChargebackCommissions(newLimit) {
    return new Promise(async (resolve, reject) => {
        let updatedTransctionReports = 0

        await transactionReportsLoop(newLimit, async (transaction) => {
            const subAccount = transaction.client_sub_account
            const pcpPlatformCommission = transaction.pcp_platform_commission
            const pcpAccountingAmount = transaction.accounting_amount
            let appSettings = await AppSettings.findOne({ sub_account: subAccount })
            if (!_.isEmpty(appSettings)) {

                const platformCommissionPercentage = (pcpPlatformCommission * 100) / pcpAccountingAmount
                const platformChargebackFees = 25 * (platformCommissionPercentage / 100)
                const modelChargebackFees = 25 * ((100 - platformCommissionPercentage) / 100)
                transaction.platform_chargeback_fees = platformChargebackFees
                transaction.model_chargeback_fees = modelChargebackFees

                await transaction.save()
                updatedTransctionReports++
            }
        })
        resolve(updatedTransctionReports)
    })
}

async function transactionReportsLoop(newLimit, callback) {
    let totalTransactions = 0

    try {
        totalTransactions = await TransactionReports.find({ type: 'CHARGEBACK' }).countDocuments()
    } catch (error) {
        console.log(error)
        return
    }

    if (totalTransactions > 0) {
        let limit = (newLimit === null) ? 50 : parseInt(newLimit, 10)
        let totalPages = Math.ceil(totalTransactions / limit)
        for (let index = 0; index < totalPages; index++) {
            let offset = index * limit
            console.log(`Records updated: ${offset}`)
            let transactions = []
            try {
                transactions = await TransactionReports.find({ type: 'CHARGEBACK' }).skip(offset).limit(limit)
            } catch (error) {
                console.log(error)
                return
            }
            for (let i = 0; i < transactions.length; i++) {
                await callback(transactions[i])
            }
        }
    }
}

async function saveAllDomainCommission() {

    let rows = await Website.find({}, 'website_url')

    for (let element of rows) {
        let row = await generateCommissionForDomain(element.website_url)
        console.log(row)

    }
    return 'Save data successfully'
}

async function generateCommissionForDomain(domain) {

    try {
        const websiteData = await Website.findOne({ website_url: domain }, 'subscription_sub_account shop_sub_account tip_sub_account')

        if (websiteData === undefined) {
            // console.log('Website', domain, 'data not found')
            return `Website ${domain}, data not found`
        }

        const clientSubScriptionSubAccount = _.get(websiteData, 'subscription_sub_account', false)
        const clientShopSubAccount = _.get(websiteData, 'shop_sub_account', false)
        const clientTipSubAccount = _.get(websiteData, 'tip_sub_account', false)
        let clientSubAccount = []

        if (clientSubScriptionSubAccount) {
            clientSubAccount.push(clientSubScriptionSubAccount)
        }

        if (clientShopSubAccount) {
            clientSubAccount.push(clientShopSubAccount)
        }

        if (clientTipSubAccount) {
            clientSubAccount.push(clientTipSubAccount)
        }

        let firstTransactionDate = await TransactionReports.findOne({ client_sub_account: { $in: clientSubAccount } }).sort({ pcp_transaction_date: 1 })

        let startDate = _.get(firstTransactionDate, 'pcp_transaction_date', false)
        let getCommissionArray = []
        if (startDate) {
            let currentDate = new Date()
            while (1) {
                if (currentDate >= startDate) {
                    let getCommission = await getCommissionForWebsite(domain, startDate)
                    getCommission['target_date'] = moment(startDate).format('YYYY-MM-DD 00:00:00')
                    getCommission['domain'] = domain
                    getCommissionArray.push(getCommission)
                    startDate = moment(startDate).add(1, 'day').format()
                    startDate = new Date(startDate)
                } else {
                    break;
                }
            }
        }
        let uniqueCommissionArray = generateUniqueComissionAarray(getCommissionArray)

        if (uniqueCommissionArray.length > 0) {
            let scheemaArray = generateScheema(uniqueCommissionArray)
            let saveDomainInfo = await saveDomainCommission(scheemaArray)

            return saveDomainInfo
        }
        return `No commission found for domain ${domain}`
    } catch (error) {
        console.log('err', error)
    }
}

async function saveDomainCommission(commissionArray) {
    const domain = commissionArray[0].domain
    const target_date = _.map(commissionArray, 'target_date')

    let findCommission = await WebsiteCommission.find({ domain: domain, target_date: { $in: target_date } })

    if (findCommission.length === 0) {
        await WebsiteCommission.insertMany(commissionArray)

        return `Data save successfully for domain ${domain}`
    }
    return `Data is already saved for domain ${domain}`
}

function generateScheema(scheemaCommissionArray) {
    let scheemaArray = []
    for (let element of scheemaCommissionArray) {
        let object = {
            domain: element.domain,
            sub_accounts: element.sub_accounts,
            platform_commission: element.platformCommissionPercentage,
            ccbill_fees: element.ccbillFeesPercentage,
            target_date: element.target_date,
            created_at: new Date()
        }
        scheemaArray.push(object)
    }
    return scheemaArray
}

function generateUniqueComissionAarray(commissionArray) {

    if (commissionArray.length === 0) {
        return []
    }

    let uniqueCommissionArray = []

    for (let i = 0; i < commissionArray.length - 1; i++) {
        const current = commissionArray[i]

        if (current !== false) {
            if (uniqueCommissionArray.length === 0) {
                uniqueCommissionArray.push(current)

            } else {

                const previous = uniqueCommissionArray[uniqueCommissionArray.length - 1]

                let currentPlatform = Number(current.platformCommissionPercentage)
                let previousplatform = Number(previous.platformCommissionPercentage)
                let currentccbill = Number(current.ccbillFeesPercentage)
                let previousccbill = Number(previous.ccbillFeesPercentage)
                if (currentPlatform !== previousplatform || currentccbill !== previousccbill) {
                    uniqueCommissionArray.push(current)
                }
            }
        }
    }
    return uniqueCommissionArray
}

/**
 * @typedef commission
 * @type {Array}
 * @property {number} platformCommissionPercentage - an platformCommissionPercentage.
 * @property {number} ccbillFeesPercentage - ccbillFeesPercentage.
 */
/**
 *
 * @param {string} domain
 * @param {string} targetDate
 * @returns {commissionArray}
 */
async function getCommissionForWebsite(domain, targetDate) {
    const transactionStartDate = moment(targetDate).format('YYYY-MM-DD 00:00:00')
    const transactionEndDate = moment(targetDate).format('YYYY-MM-DD 23:59:59')

    const websiteData = await Website.findOne({ website_url: domain }, 'subscription_sub_account shop_sub_account tip_sub_account')
    if (websiteData === undefined) {
        // console.log('Website', domain, 'data not found')
        return `Website ${domain}, data not found`
    }

    const clientSubScriptionSubAccount = _.get(websiteData, 'subscription_sub_account', false)
    const clientShopSubAccount = _.get(websiteData, 'shop_sub_account', false)
    const clientTipSubAccount = _.get(websiteData, 'tip_sub_account', false)
    let clientSubAccount = []

    if (clientSubScriptionSubAccount) {
        clientSubAccount.push(clientSubScriptionSubAccount)
    }

    if (clientShopSubAccount) {
        clientSubAccount.push(clientShopSubAccount)
    }

    if (clientTipSubAccount) {
        clientSubAccount.push(clientTipSubAccount)
    }

    // console.log('clientSubAccount', clientSubAccount)

    let rows = await TransactionReports.findOne({
        'pcp_transaction_date': { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
        'type': { $in: ['NEW', 'REBILL'] },
        'client_sub_account': { $in: clientSubAccount },
        accounting_amount: { $gt: 0, $mod: [10, 0] }
    }).sort({ accounting_amount: -1 })

    if (rows) {
        let accounting_amount = rows.accounting_amount
        let pcp_platform_commission = rows.pcp_platform_commission
        let pcp_ccbill_charge = rows.pcp_ccbill_charge
        let pcp_model_earnings = rows.pcp_model_earnings

        let calculateCommission = calculatePlatformCommissionAndCCbillFees(domain, accounting_amount, pcp_platform_commission, pcp_ccbill_charge, pcp_model_earnings)

        return calculateCommission
    }

    rows = await TransactionReports.findOne({
        'pcp_transaction_date': { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
        'type': { $in: ['NEW', 'REBILL'] },
        'client_sub_account': { $in: clientSubAccount },
        accounting_amount: { $gt: 0, $mod: [2, 0] }
    }).sort({ accounting_amount: -1 })

    if (rows) {
        let accounting_amount = rows.accounting_amount
        let pcp_platform_commission = rows.pcp_platform_commission
        let pcp_ccbill_charge = rows.pcp_ccbill_charge
        let pcp_model_earnings = rows.pcp_model_earnings

        let calculateCommission = calculatePlatformCommissionAndCCbillFees(domain, accounting_amount, pcp_platform_commission, pcp_ccbill_charge, pcp_model_earnings)

        return calculateCommission
    }

    rows = await TransactionReports.findOne({
        'pcp_transaction_date': { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
        'type': { $in: ['NEW', 'REBILL'] },
        'client_sub_account': { $in: clientSubAccount },
        'accounting_amount': { $gt: 0 }
    }).sort({ accounting_amount: -1 })
    if (rows) {
        let accounting_amount = rows.accounting_amount
        let pcp_platform_commission = rows.pcp_platform_commission
        let pcp_ccbill_charge = rows.pcp_ccbill_charge
        let pcp_model_earnings = rows.pcp_model_earnings

        let calculateCommission = calculatePlatformCommissionAndCCbillFees(domain, accounting_amount, pcp_platform_commission, pcp_ccbill_charge, pcp_model_earnings)

        return calculateCommission
    }
    return false
}

/**
 * @typedef commission
 * @type {object}
 * @property {number} platformCommissionPercentage - an platformCommissionPercentage.
 * @property {number} ccbillFeesPercentage - ccbillFeesPercentage.
 */

/**
 *
 * @param {number} accountingAmount
 * @param {number} pcpPlatformCommission
 * @param {number} pcpCcbillCharge
 * @param {number} pcpModelEarnings
 * @returns {commission} commission
 */
function calculatePlatformCommissionAndCCbillFees(domain, accountingAmount, pcpPlatformCommission, pcpCcbillCharge, pcpModelEarnings) {
    let calculatedAccountingAmount = pcpPlatformCommission + pcpCcbillCharge + pcpModelEarnings


    let ccbillFeesPercentage = (pcpCcbillCharge * 100) / accountingAmount

    let earnings = accountingAmount - pcpCcbillCharge

    let platformCommissionPercentage = (pcpPlatformCommission * 100) / earnings

    ccbillFeesPercentage = _.round(ccbillFeesPercentage, 2)
    platformCommissionPercentage = _.round(platformCommissionPercentage, 2)

    ccbillFeesPercentage = _.ceil(ccbillFeesPercentage, 2)
    platformCommissionPercentage = _.ceil(platformCommissionPercentage, 2)

    if (domain === 'inesclub.com') {
        platformCommissionPercentage = 17
        ccbillFeesPercentage = 7
        return { platformCommissionPercentage, ccbillFeesPercentage }
    }

    const platformSubstitutionLookup = [
        { find: 39.96, replace: 40 },
        { find: 39.98, replace: 40 },
        { find: 40.01, replace: 40 },
        { find: 40.02, replace: 40 },
        { find: 40.03, replace: 40 },
        { find: 40.04, replace: 40 },
        { find: 40.05, replace: 40 },
        { find: 30.23, replace: 30 },
        { find: 29.98, replace: 30 },
        { find: 29.86, replace: 30 },
        { find: 30.09, replace: 30 },
        { find: 30.06, replace: 30 },
        { find: 30.02, replace: 30 },
        { find: 29.97, replace: 30 },
        { find: 29.99, replace: 30 },
        { find: 29.94, replace: 30 },
        { find: 30.11, replace: 30 },
        { find: 30.01, replace: 30 },
        { find: 30.03, replace: 30 },
        { find: 29.96, replace: 30 },
        { find: 14.96, replace: 15 },
        { find: 14.97, replace: 15 },
        { find: 14.98, replace: 15 },
        { find: 14.94, replace: 15 },
        { find: 14.99, replace: 15 },
        { find: 15.01, replace: 15 },
        { find: 15.02, replace: 15 },
        { find: 15.03, replace: 15 },
        { find: 15.04, replace: 15 },
        { find: 15.05, replace: 15 },
        { find: 15.12, replace: 15 },
        { find: 14.91, replace: 15 },
        { find: 14.92, replace: 15 },
        { find: 14.95, replace: 15 },
        { find: 15.06, replace: 15 },
        { find: 15.08, replace: 15 },
        { find: 19.93, replace: 20 },
        { find: 19.97, replace: 20 },
        { find: 19.98, replace: 20 },
        { find: 19.99, replace: 20 },
        { find: 20.01, replace: 20 },
        { find: 20.02, replace: 20 },
        { find: 20.03, replace: 20 },
        { find: 20.04, replace: 20 },
        { find: 20.05, replace: 20 },
        { find: 20.06, replace: 20 },
        { find: 19.91, replace: 20 },
        { find: 19.94, replace: 20 },
        { find: 19.89, replace: 20 },
        { find: 19.85, replace: 20 },
        { find: 20.09, replace: 20 },
        { find: 16.97, replace: 17 },
        { find: 16.98, replace: 17 },
        { find: 16.99, replace: 17 },
        { find: 17.01, replace: 17 },
        { find: 17.02, replace: 17 },
        { find: 17.03, replace: 17 },
        { find: 17.04, replace: 17 },
        { find: 17.05, replace: 17 },
        { find: 17.44, replace: 17 },
        { find: 29.89, replace: 30 },
        { find: 29.91, replace: 30 },
        { find: 29.92, replace: 30 },
        { find: 29.93, replace: 30 },
        { find: 29.94, replace: 30 },
        { find: 29.95, replace: 30 },
        { find: 29.96, replace: 30 },
        { find: 29.97, replace: 30 },
        { find: 29.98, replace: 30 },
        { find: 29.99, replace: 30 },
        { find: 30.01, replace: 30 },
        { find: 30.02, replace: 30 },
        { find: 30.03, replace: 30 },
        { find: 30.04, replace: 30 },
        { find: 30.05, replace: 30 },
        { find: 30.06, replace: 30 },
        { find: 30.07, replace: 30 },
        { find: 30.08, replace: 30 },
        { find: 30.12, replace: 30 },
        { find: 19.77, replace: 20 },
        { find: 19.92, replace: 20 },
        { find: 20.07, replace: 20 },
        { find: 19.96, replace: 20 },
        { find: 20.23, replace: 20 },
        { find: 20.08, replace: 20 },
        { find: 20.14, replace: 20 },
        { find: 24.86, replace: 25 },
        { find: 24.92, replace: 25 },
        { find: 24.94, replace: 25 },
        { find: 24.95, replace: 25 },
        { find: 24.96, replace: 25 },
        { find: 24.97, replace: 25 },
        { find: 24.98, replace: 25 },
        { find: 24.99, replace: 25 },
        { find: 25.01, replace: 25 },
        { find: 25.02, replace: 25 },
        { find: 25.03, replace: 25 },
        { find: 25.04, replace: 25 },
        { find: 25.05, replace: 25 },
        { find: 25.06, replace: 25 },
        { find: 25.07, replace: 25 },
        { find: 25.08, replace: 25 },
        { find: 25.09, replace: 25 },
        { find: 25.56, replace: 25 },
        { find: 27.02, replace: 27 },
        { find: 27.03, replace: 27 },
        { find: 27.05, replace: 27 },
        { find: 27.43, replace: 27.5 },
        { find: 27.51, replace: 27.5 },
        { find: 27.53, replace: 27.5 },
        { find: 27.59, replace: 27.5 },
        { find: 49.91, replace: 50 },
        { find: 49.97, replace: 50 },
        { find: 50.01, replace: 50 },
        { find: 50.02, replace: 50 },
        { find: 50.06, replace: 50 },
        { find: 16.94, replace: 17 },
        { find: 34.95, replace: 35 },
        { find: 34.98, replace: 35 },
        { find: 34.99, replace: 35 },
        { find: 35.01, replace: 35 },
        { find: 35.02, replace: 35 },
        { find: 35.04, replace: 35 },
        { find: 35.03, replace: 35 },
        { find: 35.05, replace: 35 },
        { find: 39.97, replace: 40 },
        { find: 33.02, replace: 33 },
        { find: 33.03, replace: 33 },
        { find: 13.01, replace: 13 },
        { find: 12.98, replace: 13 },
        { find: 12.93, replace: 13 },
        { find: 13.05, replace: 13 },
        { find: 27.04, replace: 27 },
        { find: 27.01, replace: 27 },
        { find: 26.96, replace: 27 },
        { find: 26.99, replace: 27 },
        { find: 26.94, replace: 27 },
        { find: 19.95, replace: 20 },
        { find: 32.9, replace: 33 },
        { find: 32.99, replace: 33 },
        { find: 32.97, replace: 33 },
        { find: 32.98, replace: 33 },
        { find: 33.01, replace: 33 },
        { find: 49.99, replace: 50 },
        { find: 22.45, replace: 22.5 },
        { find: 22.47, replace: 22.5 },
        { find: 22.48, replace: 22.5 },
        { find: 22.51, replace: 22.5 },
        { find: 22.52, replace: 22.5 }
    ]

    const foundItem = _.find(platformSubstitutionLookup, function (element) {
        return (element.find === platformCommissionPercentage)
    })

    if (foundItem !== undefined) {
        platformCommissionPercentage = foundItem.replace
    }

    const ccbillSubstitutionLookup = [
        { find: 6.9, replace: 6.95 },
        { find: 6.91, replace: 6.95 },
        { find: 6.92, replace: 6.95 },
        { find: 6.93, replace: 6.95 },
        { find: 6.94, replace: 6.95 },
        { find: 6.96, replace: 6.95 },
        { find: 6.97, replace: 6.95 },
        { find: 6.98, replace: 6.95 },
        { find: 6.99, replace: 6.95 },
        { find: 6.89, replace: 6.95 },
        { find: 9.4, replace: 9.5 },
        { find: 9.44, replace: 9.5 },
        { find: 9.45, replace: 9.5 },
        { find: 9.36, replace: 9.5 },
        { find: 9.55, replace: 9.5 },
        { find: 9.56, replace: 9.5 },
        { find: 9.57, replace: 9.5 },
        { find: 9.51, replace: 9.5 },
        { find: 9.46, replace: 9.5 },
        { find: 9.47, replace: 9.5 },
        { find: 9.48, replace: 9.5 },
        { find: 9.49, replace: 9.5 },
        { find: 9.42, replace: 9.5 },
        { find: 9.52, replace: 9.5 },
        { find: 9.53, replace: 9.5 },
        { find: 9.54, replace: 9.5 },
        { find: 9.6, replace: 9.5 },
        { find: 9.33, replace: 9.5 },
        { find: 10, replace: 9.5 },
        { find: 13.51, replace: 13.5 },
        { find: 13.6, replace: 13.5 },
        { find: 13.47, replace: 13.5 },
        { find: 14, replace: 13.5 },
        { find: 13.52, replace: 13.5 },
        { find: 13.53, replace: 13.5 },
        { find: 13.42, replace: 13.5 },
        { find: 13.43, replace: 13.5 },
        { find: 13.48, replace: 13.5 },
        { find: 13.49, replace: 13.5 },
        { find: 13.57, replace: 13.5 },
        { find: 13.67, replace: 13.5 },
        { find: 13.38, replace: 13.5 },
        { find: 13.56, replace: 13.5 },
        { find: 13.45, replace: 13.5 },
        { find: 3.5, replace: 3.53 },
        { find: 3.54, replace: 3.53 },
        { find: 3.55, replace: 3.53 },
        { find: 3.52, replace: 3.53 },
        { find: 3.6, replace: 3.53 },
        { find: 3.72, replace: 3.75 },
        { find: 3.73, replace: 3.75 },
        { find: 3.74, replace: 3.75 },
        { find: 3.8, replace: 3.75 },
        { find: 3.76, replace: 3.75 },
        { find: 3.77, replace: 3.75 },
        { find: 3.71, replace: 3.75 },
        { find: 3.83, replace: 3.75 },
        { find: 3.78, replace: 3.75 },
        { find: 3.7, replace: 3.75 },
        { find: 3.81, replace: 3.75 },
        { find: 4.2, replace: 4.25 },
        { find: 4.27, replace: 4.25 },
        { find: 4.26, replace: 4.25 },
        { find: 4.24, replace: 4.25 },
        { find: 4.23, replace: 4.25 },
        { find: 4.29, replace: 4.25 },
        { find: 4.33, replace: 4.25 },
        { find: 7.01, replace: 6.95 },
        { find: 7, replace: 6.95 },
        { find: 7.02, replace: 6.95 },

    ]

    const foundItemCcbill = _.find(ccbillSubstitutionLookup, function (element) {
        return (element.find === ccbillFeesPercentage)
    })

    if (foundItemCcbill !== undefined) {
        ccbillFeesPercentage = foundItemCcbill.replace
    }

    return { platformCommissionPercentage, ccbillFeesPercentage }
}

async function saveAllDomainEarningReport() {
    let rows = await Website.find({}, 'website_url')

    for (let element of rows) {
        let row = await generateEarningReportForDomain(element.website_url)
        console.log(row)

    }
    return 'Save data successfully'
}

/**
 *
 * @param {string} domain
 */
async function generateEarningReportForDomain(domain) {
    try {
        const websiteData = await Website.findOne({ website_url: domain }, 'subscription_sub_account shop_sub_account tip_sub_account')

        if (websiteData === undefined) {
            return `Website ${domain}, data not found`
        }

        const clientSubScriptionSubAccount = _.get(websiteData, 'subscription_sub_account', false)
        const clientShopSubAccount = _.get(websiteData, 'shop_sub_account', false)
        const clientTipSubAccount = _.get(websiteData, 'tip_sub_account', false)
        let clientSubAccount = []

        if (clientSubScriptionSubAccount) {
            clientSubAccount.push(clientSubScriptionSubAccount)
        }

        if (clientShopSubAccount) {
            clientSubAccount.push(clientShopSubAccount)
        }

        if (clientTipSubAccount) {
            clientSubAccount.push(clientTipSubAccount)
        }

        let firstTransactionDate

        let websiteEarningReport = await WebsiteEarningReports.findOne({ domain: domain }, 'target_date').sort({ target_date: -1 })

        if (websiteEarningReport === null) {
            firstTransactionDate = await TransactionReports.findOne({ client_sub_account: { $in: clientSubAccount } }).sort({ pcp_transaction_date: 1 })
        } else {
            firstTransactionDate = websiteEarningReport.target_date
        }
        console.log(firstTransactionDate)
        let startDate = _.get(firstTransactionDate, 'pcp_transaction_date', false)
        if (startDate === false) {
            return false
        }
        let earningReportArray = []
        //for single date
        // let startDate = new Date('2020-12-29 00:00:00.000Z')

        if (startDate) {
            let currentDate = new Date()
            while (1) {

                if (currentDate >= startDate) {
                    let earningReport = await generateDateWiseEarningForDomain(domain, startDate)
                    console.log(earningReport)
                    if (earningReport !== false) {
                        earningReportArray.push(earningReport)
                    }
                    startDate = moment(startDate).add(1, 'day').format()
                    startDate = new Date(startDate)
                } else {
                    break;
                }
            }
        }

        if (earningReportArray.length > 0) {
            let saveDomainEarning = await saveDomainEarningReport(earningReportArray)

            return saveDomainEarning
        } else {
            return false
        }
    } catch (error) {
        console.log('err', error)
    }
}

/**
 * @typedef domainCommission
 * @type {object}
 * @property {string} domain - an domain
 * @property {number} platform_commission - an platform_commission.
 * @property {number} ccbill_fees - an ccbill_fees.
 * @property {string} target_date - an target_date
 */
/**
 * @param {string} domain
 * @param {string} date
 * @returns {Promise<domainCommission | false>} commission
 */
async function getCommissionForDomainForDate(domain, date) {
    return new Promise((resolve, reject) => {
        const targetDate = moment(date).format('YYYY-MM-DD 00:00:00')
        const fields = 'domain platform_commission ccbill_fees target_date sticky_io_fees payment_gateway'

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
                return resolve(false)
            })
            .catch((error) => {
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
 * @param {string} subAccount
 * @param {Array<string>} transactionTypes -NEW,REBILL,CHARGEBACK,VOID
 * @param {string} startDate
 * @param {string} endDate
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

async function getAllDomainEarningReport(startDate, endDate) {
    let rows = await Website.find({}, 'website_url subscription_sub_account shop_sub_account tip_sub_account model_name')

    let earningReport = []
    for (let element of rows) {
        let row = await getEarningReport(element.website_url, startDate, endDate)
        let commission = await getCommissionForDomainForDate(element.website_url, endDate)
        row['platform_commission'] = (commission === false) ? 0 : commission.platform_commission
        row['ccbill_fees'] = (commission === false) ? 0 : commission.ccbill_fees
        row['subscription_sub_account'] = element.subscription_sub_account
        row['subscription_sub_account'] = element.subscription_sub_account
        row['model_name'] = element.model_name
        row['shop_sub_account'] = element.shop_sub_account
        row['tip_sub_account'] = element.tip_sub_account
        row['sticky_io_fees'] = (commission === false) ? 0 : commission.sticky_io_fees
        earningReport.push(row)
    }
    await generateEarningReportCsv(earningReport)
    console.log(earningReport)
    return 'get data successfully'
}

async function generateEarningReportCsv(earningReport) {

    let fileName = 'earningReportDecember.csv'
    let tempPath = path.resolve(`${__dirname}/temp`, `./${fileName}`)
    fs.appendFileSync(tempPath, `${'domain'},${'Subscription Sub Account'},${'Shop Sub Account'},${'Tip Sub Account'},${'name'},${'Platform Commission'},${'Ccbill fees'},${'Subscription Amount'},${'Shop Amount'},${'Tip Amount'},${'Subscription Refund Amount'},${'Shop Refund Amount'},${'Tip Refund Amount'},${'Subscription Chargeback Amount'},${'Shop Chargeback Amount'},${'Tip Chargeback Amount'},${'Subscription Chargeback Count'},${'Shop Chargeback Count'},${'Tip Chargeback Count'},${'Subscription Void Amount'},${'shop Void Amount'},${'Tip Void Amount'},${'Gross Revenue'},${'Gross Refund'},${'chargeback penalty'},${'net revenue'},${'Ccbill Charge'},${'revenue collected'},${'Platform Commission'},${'Model Earning'},${'Payment Gateway'},${'StickyIo fees'},${'StickyIo Charge'}\n`)
    for (let i = 0; i < earningReport.length; i++) {
        let object = earningReport[i]
        fs.appendFileSync(tempPath, `${object.domain},${object.subscription_sub_account},${object.shop_sub_account},${object.tip_sub_account},${object.model_name},${object.platform_commission},${object.ccbill_fees},${object.subscription_amount},${object.shop_amount},${object.tip_amount},${object.subscription_refund_amount},${object.shop_refund_amount},${object.tip_refund_amount},${object.subscription_chargeback_amount},${object.shop_chargeback_amount},${object.tip_chargeback_amount},${object.subscription_chargeback_count},${object.shop_chargeback_count},${object.tip_chargeback_count},${object.subscription_void_amount},${object.shop_void_amount},${object.tip_void_amount},${object.gross_amount},${object.gross_refund},${object.chargeback_penalty},${object.net_revenue},${object.ccbill_charge},${object.revenue_collected},${object.platform_earning},${object.model_earning},${object.payment_gateway},${object.sticky_io_fees},${object.sticky_io_charge}\n`)
    }
}
async function getEarningReport(domain, startDate, endDate) {
    let transactionStartDate = moment(startDate).format('YYYY-MM-DD 00:00:00')
    let transactionEndDate = moment(endDate).format('YYYY-MM-DD 23:59:59')

    let getWebsiteId = await Website.findOne({ website_url: domain }, { website_id: 1, payment_gateway: 1 })

    let earningAmounts = await WebsiteEarningReports.aggregate([{
        $match: {
            'target_date': { $gte: new Date(transactionStartDate), $lte: new Date(transactionEndDate) },
            'domain': domain
        }
    }, {
        $group: {
            _id: null,
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
            'gross_amount': { '$sum': '$gross_amount' },
            'chargeback_amount': { '$sum': '$chargeback_amount' },
            'chargeback_count': { '$sum': '$chargeback_count' },
            'refund_amount': { '$sum': '$refund_amount' },
            'void_amount': { '$sum': '$void_amount' },
            'gross_refund': { '$sum': '$gross_refund' },
            'gross_revenue': { '$sum': '$gross_revenue' },
            'platform_commission': { '$sum': '$platform_commission' },
            'ccbill_commission': { '$sum': '$ccbill_commission' },
            'ccbill_charge': { '$sum': '$ccbill_charge' },
            'platform_earning': { '$sum': '$platform_earning' },
            'model_earning': { '$sum': '$model_earning' },
            'chargeback_penalty': { '$sum': '$chargeback_penalty' },
            'net_revenue': { '$sum': '$net_revenue' },
            'revenue_collected': { '$sum': '$revenue_collected' },
            'sticky_io_charge': { '$sum': '$sticky_io_charge' }
        }
    }
    ])

    return {
        website_id: getWebsiteId.website_id,
        domain: domain,
        subscription_amount: earningAmounts.length > 0 ? earningAmounts[0].subscription_amount : 0,
        subscription_refund_amount: earningAmounts.length > 0 ? earningAmounts[0].subscription_refund_amount : 0,
        subscription_chargeback_amount: earningAmounts.length > 0 ? earningAmounts[0].subscription_chargeback_amount : 0,
        subscription_chargeback_count: earningAmounts.length > 0 ? earningAmounts[0].subscription_chargeback_count : 0,
        subscription_void_amount: earningAmounts.length > 0 ? earningAmounts[0].subscription_void_amount : 0,
        shop_sub_account: earningAmounts.length > 0 ? earningAmounts[0].shop_sub_account : 0,
        shop_amount: earningAmounts.length > 0 ? earningAmounts[0].shop_amount : 0,
        shop_refund_amount: earningAmounts.length > 0 ? earningAmounts[0].shop_refund_amount : 0,
        shop_chargeback_amount: earningAmounts.length > 0 ? earningAmounts[0].shop_chargeback_amount : 0,
        shop_chargeback_count: earningAmounts.length > 0 ? earningAmounts[0].shop_chargeback_count : 0,
        shop_void_amount: earningAmounts.length > 0 ? earningAmounts[0].shop_void_amount : 0,
        tip_sub_account: earningAmounts.length > 0 ? earningAmounts[0].tip_sub_account : 0,
        tip_amount: earningAmounts.length > 0 ? earningAmounts[0].tip_amount : 0,
        tip_refund_amount: earningAmounts.length > 0 ? earningAmounts[0].tip_refund_amount : 0,
        tip_chargeback_amount: earningAmounts.length > 0 ? earningAmounts[0].tip_chargeback_amount : 0,
        tip_chargeback_count: earningAmounts.length > 0 ? earningAmounts[0].tip_chargeback_count : 0,
        tip_void_amount: earningAmounts.length > 0 ? earningAmounts[0].tip_void_amount : 0,
        gross_amount: earningAmounts.length > 0 ? earningAmounts[0].gross_amount : 0,
        chargeback_amount: earningAmounts.length > 0 ? earningAmounts[0].chargeback_amount : 0,
        chargeback_count: earningAmounts.length > 0 ? earningAmounts[0].chargeback_count : 0,
        refund_amount: earningAmounts.length > 0 ? earningAmounts[0].refund_amount : 0,
        void_amount: earningAmounts.length > 0 ? earningAmounts[0].void_amount : 0,
        gross_refund: earningAmounts.length > 0 ? earningAmounts[0].gross_refund : 0,
        gross_revenue: earningAmounts.length > 0 ? earningAmounts[0].gross_revenue : 0,
        ccbill_charge: earningAmounts.length > 0 ? earningAmounts[0].ccbill_charge : 0,
        platform_earning: earningAmounts.length > 0 ? earningAmounts[0].platform_earning : 0,
        model_earning: earningAmounts.length > 0 ? earningAmounts[0].model_earning : 0,
        chargeback_penalty: earningAmounts.length > 0 ? earningAmounts[0].chargeback_penalty : 0,
        net_revenue: earningAmounts.length > 0 ? earningAmounts[0].net_revenue : 0,
        revenue_collected: earningAmounts.length > 0 ? earningAmounts[0].revenue_collected : 0,
        payment_gateway: getWebsiteId.payment_gateway,
        sticky_io_charge: earningAmounts.length > 0 ? earningAmounts[0].sticky_io_charge : 0
    }
}

/**
 *@returns {boolean} true | false
 */
async function saveReferralDetail() {
    let rows = await Website.find({})

    for (let element of rows) {
        const newValues = {
            $set: {
                referral_type: 'normal',
                total_referral: 1
            }
        }
        const query = { _id: element._id, is_referral: true }
        try {
            await Website.updateOne(query, newValues)
        } catch (error) {
            return false
        }
    }
    return true
}

/**
 * get referral detail from website and save into website referral
 *
 * @returns {boolean} true | false
 */
async function saveWebsiteReferralDetail() {
    let fields = 'subscription_sub_account shop_sub_account tip_sub_account website_url total_referral created_at referral_name referral_name1 referral_name2 referral_commission referral_commission1 referral_commission2 referral_type referral_type1 referral_type2'
    let rows = await Website.find({ is_referral: true }, fields)

    let websiteReferralArray = []
    for (let element of rows) {
        let query = {
            $in: [element.subscription_sub_account, element.shop_sub_account, element.tip_sub_account]
        }
        let transactionDate = await CCBillTransactionReports.find({ client_sub_account: query }).limit(1)
        let targetDate = _.get(transactionDate, '[0].pcp_transaction_date', new Date())
        let object = {
            domain: element.website_url,
            referral_name: element.referral_name,
            referral_name1: (element.referral_name1 && element.referral_name1 !== 'false') ? element.referral_name1 : '',
            referral_name2: (element.referral_name2 && element.referral_name2 !== 'false') ? element.referral_name2 : '',
            referral_commission: element.referral_commission,
            referral_commission1: (Number(element.referral_commission1) > 0 ? element.referral_commission1 : '0'),
            referral_commission2: (Number(element.referral_commission2) > 0 ? element.referral_commission2 : '0'),
            referral_type: element.referral_type,
            referral_type1: (element.referral_type1 === 'domain') ? element.referral_type1 : 'normal',
            referral_type2: (element.referral_type2 === 'domain') ? element.referral_type2 : 'normal',
            target_date: targetDate,
            total_referral: element.total_referral
        }
        websiteReferralArray.push(object)
    }

    if (rows.length > 0) {
        try {
            await WebsiteReferralHistory.insertMany(websiteReferralArray)
            console.log('save website referral history complete')
            return true
        } catch (error) {
            console.log(error.message)
            return false
        }
    }
    return true
}

async function test() {
    // let chargebackCounts = 0
    // const chargebackCountCCBill = await CCBillTransactionReports.aggregate({ type: 'CHARGEBACK' })
    const chargebackCountStickyIo = await StickyIoTransactionReport.countDocuments({ transaction_type: 'VOID' })
    console.log({ chargebackCountStickyIo })
    // chargebackCounts = chargebackCountCCBill + chargebackCountStickyIo
    // console.log({ chargebackCounts })

    // let totalTransactions = 0
    // const totalCCBillTransactions = await CCBillTransactionReports.countDocuments({ type: { $in: ['NEW', 'REBILL'] } })
    // const totalStickyIOTransactions = await StickyIoTransactionReport.countDocuments({ transaction_type: { $in: ['NEW', 'REBILL'] } })
    // console.log({ totalCCBillTransactions, totalStickyIOTransactions })
    // totalTransactions = totalCCBillTransactions + totalStickyIOTransactions
    // console.log({ totalTransactions })

    // const chargebackCounts = await WebsiteDailyEarningReport.aggregate([
    //     {
    //         $group: {
    //             _id: null,
    //             chargeback_count: { $sum: '$chargeback_count' }
    //         }
    //     }
    // ])

    // console.log({chargebackCounts})

    const chargebackAmount = await WebsiteDailyEarningReport.aggregate([
        {
            $group: {
                _id: null,
                subscription_void_amount: { $sum: '$subscription_void_amount' },
                tip_void_amount: { $sum: '$tip_void_amount' }
            }
        }
    ])

    console.log({ chargebackAmount })
}

async function resetDisplayOrder() {
    const fanFavourModel = await FanFavourModel.find().sort({ display_order: 1 })

    for (let index = 0; index < fanFavourModel.length; index++) {
        const element = fanFavourModel[index]

        element.display_order = index + 1

        await element.save()
    }
}

mongoose
    .connect(
        db
    )
    .then(async () => {
        if (param1 !== null) {
            let updatedTransctionReports
            let addedCountryList
            let updateEarning
            let voidDateAdded
            let totalErrorDocuments
            let addCharges
            let data
            let commission
            let earningReport
            let domainEarningReport
            let saveEarningReport
            let saveReferralData
            switch (param1) {
                case 'UpdateTransactions':
                    updatedTransctionReports = await calculateCommissions(param2)
                    console.log(`Transaction reports updated ${updatedTransctionReports}`)
                    break
                case 'addCountryList':
                    addedCountryList = await addCountryList()
                    console.log(`Countries added ${addedCountryList}`)
                    break
                case 'updateEarnings':
                    updateEarning = await updateEarnings(param2)
                    console.log(`${updateEarning}`)
                    break
                case 'addVoidData':
                    voidDateAdded = await addVoidData()
                    console.log(`Records Added: ${voidDateAdded}`)
                    break
                case 'copyErrorResponseToAnotherCollection':
                    totalErrorDocuments = await copyErrorResponseToAnotherCollection(param2, param3)
                    console.log(`Total Error Documents Added: ${totalErrorDocuments}`)
                    break
                case 'addCharges':
                    addCharges = await calculateChargebackCommissions(param2)
                    console.log(`Transaction reports updated ${addCharges}`)
                    break
                case 'saveDomainCommision':
                    data = await saveAllDomainCommission()
                    console.log(data)
                    break
                case 'getComissionFordomainForDate':
                    commission = await getCommissionForDomainForDate('hollydazecoffey.com', '2021-01-02 00:00:00.000Z')
                    console.log(commission)
                    break
                case 'saveAllDomainEarningReport':
                    // let earningReport = await generateDateWiseEarningForDomain('hollydazecoffey.com', '2020-10-06 00:00:00.000Z')
                    // let earningReport = await generateEarningReportForDomain('hollydazecoffey.com')
                    earningReport = await saveAllDomainEarningReport()
                    console.log(earningReport)
                    break
                case 'getEarningReport':
                    // let domainEarningReport = await getEarningReport('vivianvip.com', '2020-11-01 00:00:00.000Z', '2020-11-30 00:00:00.000Z')
                    // Added Sticky.io
                    domainEarningReport = await getAllDomainEarningReport('2020-12-01 00:00:00.000Z', '2020-12-30 23:59:59.000Z')
                    console.log(domainEarningReport)
                    break
                case 'generateDailyEarningReportByDate':
                    // usage generateDailyEarningReportByDate 2020-12-27T00:00:00.000Z
                    // Added Hybrid
                    saveEarningReport = await generateDailyEarningReportByDate(param2)
                    console.log(saveEarningReport)
                    break
                case 'generateDailyEarningReportWithRange':
                    // usage generateDailyEarningReportWithRange 2022-08-01T00:00:00.000Z 2022-08-31T00:00:00.000Z
                    // Added Hybrid
                    saveEarningReport = await generateDailyEarningReportWithRange(param2, param3)
                    console.log(saveEarningReport)
                    break
                case 'saveReferralDetail':
                    saveReferralData = await saveReferralDetail()
                    console.log(saveReferralData)
                    break
                case 'generateDailyEarningReportOfDomainWithRange':
                    // Added Hybrid
                    saveEarningReport = await generateDailyEarningReportOfDomainWithRange(param2, param3, param4)
                    break
                case 'getMissingWebhooks':
                    // Added Hybrid
                    await loopAllWebsites()
                    break
                case 'removeCCBillErrorLog':
                    await removeCCBillErrorLog()
                    break
                case 'saveWebsiteReferralDetail':
                    await saveWebsiteReferralDetail()
                    break
                case 'setTargetDateOfWebsiteReferral':
                    await setTargetDateOfWebsiteReferral()
                    break
                case 'getPlatformUserAnalytics':
                    // if date not pass then will calculate today in MST time
                    // usage getPlatformUserAnalytics 2021-01-01 2021-04-07 registration,subscription,cancellation
                    await platformUserAnalytics(param2, param3, param4)
                    break
                case 'getPlatformUserAnalyticsByWebsite':
                    // usage getPlatformUserAnalyticsByWebsite 2021-01-01 2021-04-07 site1.com,site2.com registration,subscription,cancellation
                    await getPlatformUserAnalyticsByWebsite(param2, param3, param4, param5)
                    break
                case 'getYesterdayPlatformUserAnalytics':
                    // usage getYesterdayPlatformUserAnalytics registration,subscription,cancellation
                    await getYesterdayPlatformUserAnalytics(param2)
                    break
                case 'createAnalyticsUser':
                    // register user with role analytics
                    // usage createAnalyticsUser analytics@gmail.com any_password
                    await createAnalyticsUser(param2, param3)
                    break
                case 'assignWebsiteId':
                    // usage assignWebsiteId
                    await assignWebsiteId()
                    break
                case 'createSupportUser':
                    // register user with role support
                    // usage createSupportUser support@gmail.com any_password
                    await createSupportUser(param2, param3)
                    break
                case 'removeUnusedIndexFromDatabase':
                    // Remove Unused index from database
                    // usage removeUnusedIndexFromDatabase
                    await removeUnusedIndexFromDatabase()
                    break
                case 'updateIsUniqueFlagForCCBillAddCardLog':
                    // Remove Unused index from database
                    // usage updateIsUniqueFlagForCCBillAddCardLog
                    await updateIsUniqueFlagForCCBillAddCardLog()
                    break
                case 'removeEmailWebhook':
                    await removeEmailWebhook()
                    break
                case 'resolveMissingWebhooks':
                    await resolveMissingWebhooks()
                    break
                case 'getPromotionReport':
                    await getPromotionReport(param2, param3, param4)
                    await exitWithCleanup(0)
                    break
                case 'updateWebsitePaymentGateway':
                    // Run this command once before enable sticky.io in any website
                    await updateWebsitePaymentGateway()
                    break
                case 'stickyIoDailyTransactionAnalysis':
                    await stickyIoDailyTransactionAnalysis(param2)
                    break
                case 'generateStickyIoDailyEarningReportByDate':
                    await generateStickyIoDailyEarningReportByDate(param2)
                    break
                case 'generateStickyIoDailyEarningReportByDomainAndDate':
                    await generateStickyIoDailyEarningReportByDomainAndDate(param2, param3)
                    break
                case 'generateStickyIoDailyEarningReportOfDomainWithRange':
                    await generateStickyIoDailyEarningReportOfDomainWithRange(param2, param3, param4)
                    break
                case 'getOptInStatusReport':
                    await getOptInStatusReport()
                    await exitWithCleanup(0)
                    break
                case 'fixOptInReporting':
                    await fixOptInReporting()
                    break
                case 'setStickyIoTransactionPaymentGateway':
                    await setStickyIoTransactionPaymentGateway()
                    break
                case 'updateWebsiteCommission':
                    await updateWebsiteCommission()
                    break
                case 'removeHttpsFromCCBillErrorLog':
                    await removeHttpsFromCCBillErrorLog()
                    break
                case 'processStickyIoRebillTransaction':
                    await processStickyIoTransactions()
                    break
                case 'processHybridTransactionSummaryCount':
                    await processHybridTransactionSummaryCount()
                    break
                case 'setTotalTransactionCount':
                    await setTotalTransactionCount()
                    break
                case 'generateDailyEarningReportByDateCron':
                    await generateDailyEarningReportByDateCron()
                    break
                case 'generateDailyEarningReportByDateCronForReferral':
                    await generateDailyEarningReportByDateCronForReferral()
                    break
                case 'findMissingWebhooksCron':
                    await findMissingWebhooksCron()
                    break
                case 'removeCCBillErrorLogCron':
                    await removeCCBillErrorLogCron()
                    await exitWithCleanup(0)
                    break
                case 'fixHybridSecondaryPaymentCount':
                    await fixHybridSecondaryPaymentCount()
                    break
                case 'createReferralUser':
                    await createReferralUser(param2, param3)
                    break
                case 'websiteReferralMigrationInMaster':
                    await websiteReferralMigrationInMaster()
                    break
                case 'addReferralIdIntoWebsiteReferralHistory':
                    await addReferralIdIntoWebsiteReferralHistory()
                    break
                case 'createMySQLTables':
                    await createMySQLTables()
                    await exitWithCleanup(0)
                    break
                case 'generateContentLogForDataScientist':
                    // usage generateContentLogForDataScientist all/domain.com 2021-01-01 2021-01-31
                    await generateContentLogForDataScientist(param2, param3, param4)
                    console.log('Command Successfully Executed.')
                    await exitWithCleanup(0)
                    break
                case 'updateStickyIoCharge':
                    await updateStickyIoRealChargeWithFixedCharge()
                    break
                case 'addCCBillFixedTransactionCharge':
                    await addCCBillFixedTransactionCharge()
                    break
                case 'moveLiveStreamVideo':
                    await moveLiveStreamVideo(param2)
                    break
                case 'generateTransactionDataForDataScientist':
                    // usage generateTransactionDataForDataScientist all/domain.com 2021-01-01 2021-01-31
                    await generateTransactionDataForDataScientist(param2, param3, param4)
                    await exitWithCleanup(0)
                    break
                case 'sendTransactionToMySQL':
                    // usage sendTransactionToMySQL all/domain.com 2021-01-01 2021-01-31
                    await connectToMySql()
                    await sendTransactionToMySQL(param2, param3, param4)
                    await exitWithCleanup(0)
                    break
                case 'alterTableToAddTransactionIdColumn':
                    // usage alterTableToAddTransactionIdColumn
                    await alterTableToAddTransactionIdColumn()
                    await exitWithCleanup(0)
                    break
                case 'deleteTransactionRecordByDateWithDomain':
                    // usage deleteTransactionRecordByDateWithDomain 2021-01-01 2021-01-31 all/domain.com
                    await connectToMySql()
                    await deleteTransactionRecordByDateWithDomain(param2, param3, param4, false)
                    await exitWithCleanup(0)
                    break
                case 'getContentCountFromWebsite':
                    await getContentCountFromWebsite(param2, param3, param4, param5)
                    await exitWithCleanup(0)
                    break
                case 'getPrivateMessagesLog':
                    await connectToMySql()
                    await getPrivateMessagesLog(param2, param3, param4)
                    await exitWithCleanup(0)
                    break
                case 'createUserSubscriptionRegistrationCountLogTableInMySql':
                    await connectToMySql()
                    await createUserSubscriptionRegistrationCountLogTableInMySql(param2)
                    await exitWithCleanup(0)
                    break
                case 'userRegistrationSubscriptionLog':
                    await connectToMySql()
                    await userRegistrationSubscriptionLog(param2)
                    await exitWithCleanup(0)
                    break
                case 'getForumPayTransactionReport':
                    await getForumPayTransactionReport()
                    break
                case 'generateWalletTransactionReportByDate':
                    await generateWalletTransactionReportByDate(param2, param3)
                    break
                case 'generateDailyWalletTransactionReport':
                    await generateDailyWalletTransactionReport()
                    // await exitWithCleanup(0)
                    break
                case 'getUserStatisticsFromWebsites':
                    await getUserStatisticsFromWebsites()
                    await exitWithCleanup(0)
                    break
                case 'getUserIdWithSubscriptionId':
                    await getUserIdWithSubscriptionId()
                    break
                case 'createAccountManager':
                    // create user with role Account Manager
                    await createAccountManager(param2, param3)
                    break
                case 'processMissingForumPayWebhook':
                    await processMissingForumPayWebhook(param2)
                    await exitWithCleanup(0)
                    break
                case 'updateWalletTransactionStatus':
                    await updateWalletTransactionStatus()
                    await exitWithCleanup(0)
                    break
                case 'generateAllWalletTransactionReport':
                    await generateAllWalletTransactionReport()
                    await exitWithCleanup(0)
                    break
                case 'generateForumPayReportByDate':
                    // command: node cmd.js generateForumPayReportByDate YYYY-MM-DD YYYY-MM-DD
                    await generateForumPayReportByDate(param2, param3)
                    await exitWithCleanup(0)
                    break
                case 'calculateForumPayEarningByDateRange':
                    // command: node cmd.js calculateForumPayEarningByDateRange YYYY-MM-DD YYYY-MM-DD
                    await calculateForumPayEarningByDateRange(param2, param3)
                    await exitWithCleanup(0)
                    break
                case 'addMSTTimeInWalletTransactions':
                    // command: node cmd.js addMSTTimeInWalletTransactions
                    await addMSTTimeInWalletTransactions()
                    await exitWithCleanup(0)
                    break
                case 'checkPaymentSetting':
                    // command: node cmd.js checkPaymentSetting
                    await checkPaymentSetting()
                    await exitWithCleanup(0)
                    break
                case 'updateUserWalletBalance':
                    // command: node cmd.js updateUserWalletBalance
                    await updateUserWalletBalance()
                    await exitWithCleanup(0)
                    break
                case 'acceptCancelledTransactions':
                    // command: node cmd.js acceptCancelledTransactions
                    await acceptCancelledTransactions(param2)
                    await exitWithCleanup(0)
                    break
                case 'checkForumPayTransactionStatusAfterPaymentAccept':
                    // command: node cmd.js checkForumPayTransactionStatusAfterPaymentAccept
                    await checkForumPayTransactionStatusAfterPaymentAccept()
                    await exitWithCleanup(0)
                    break
                case 'checkUserSubscriptionStatusAfterRebill':
                    // command: node cmd.js checkUserSubscriptionStatusAfterRebill YYYY-MM-DD
                    await checkUserSubscriptionStatusAfterRebill(param2)
                    break
                case 'addTransactionQueueCron':
                    // command: node cmd.js addTransactionQueueCron
                    await addTransactionQueueCron()
                    await exitWithCleanup(0)
                    break
                case 'getTransactionQueueCron':
                    // command: node cmd.js getTransactionQueueCron
                    await getTransactionQueueCron()
                    await exitWithCleanup(0)
                    break
                case 'fixStickyIoTransactionsChargeback':
                    await fixStickyIoTransactionsChargeback()
                    await exitWithCleanup(0)
                    break
                case 'getUserTotalAmountSpentSinceLastSubscription':
                    await getUserTotalAmountSpentSinceLastSubscription()
                    await exitWithCleanup(0)
                    break
                case 'addUserCCbillStatusInPWAInfo':
                    await AddUserCCbillStatusInPWAInfo()
                    await exitWithCleanup(0)
                    break
                case 'addCorrectPWAInstallStatus':
                    await addCorrectPWAInstallStatus()
                    await exitWithCleanup(0)
                    break
                case 'getAllWebsiteUserCount':
                    // get active / cancelled / rebilled failed user count
                    await getAllWebsiteUserCount()
                    await exitWithCleanup(0)
                    break
                case 'getOneSignalAnalyticData':
                    await getOneSignalAnalyticData()
                    await exitWithCleanup(0)
                    break
                case 'cleanOldCronLogs':
                    await cleanOldCronLogs()
                    await exitWithCleanup(0)
                    break
                case 'addMonthlyEarningInWebsites':
                    await addMonthlyEarningInWebsites()
                    await exitWithCleanup(0)
                    break
                case 'getWebsiteCommissionForDate':
                    await getWebsiteCommissionForDate(param2)
                    await exitWithCleanup(0)
                    break
                case 'getAllWebsitesUsersAndCards':
                    await getAllWebsitesUsersAndCards(param2, param3)
                    await exitWithCleanup(0)
                    break
                case 'getWebsiteUserAndCardDetails':
                    await getWebsiteUserAndCardDetails(param2)
                    await exitWithCleanup(0)
                    break
                case 'updateUniversalUserSubscriptionAndAvatar':
                    await updateUniversalUserSubscriptionAndAvatar()
                    await exitWithCleanup(0)
                    break
                case 'test':
                    await test()
                    await exitWithCleanup(0)
                    break
                case 'topTenModel':
                    await topTenModel()
                    await exitWithCleanup()
                    break
                case 'storeFanFavourModel':
                    await storeFanFavourModel()
                    await exitWithCleanup()
                    break
                case 'resetDisplayOrder':
                    await resetDisplayOrder()
                    await exitWithCleanup()
                    break
                case 'generateWebsiteSSOSecret':
                    await generateWebsiteSSOSecret()
                    await exitWithCleanup()
                    break
                default:
                    console.log('Default Type')
                    break
            }
        }

        await exitWithCleanup()
    })
    .catch((err) => {
        console.log('Not Connected to Database ERROR! ', err)
    })
