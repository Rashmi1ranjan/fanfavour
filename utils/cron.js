const logger = require('./../config/winston')
const moment = require('moment')
const { getTransactionQueue, addTransactionQueue } = require('./addTransactionDetails')
const { loopAllWebsites } = require('./verifyTransactionReport')
const { generateDailyEarningReportByDate, getWebsiteCommission, generateDailyEarningReportByDateForReferral } = require('./../dailyEarningReport')
const { removeCCBillErrorLog } = require('./removeCCBillErrorLog')

const addTransactionQueueCron = async () => {
    console.time('Cron-Add-Transaction-Queue-For-CCBIll')
    logger.info('Add Transaction Queue Cron Started')
    await addTransactionQueue()
    logger.info('Add Transaction Queue Cron Completed')
    console.timeEnd('Cron-Add-Transaction-Queue-For-CCBIll')
}

const getTransactionQueueCron = async () => {
    console.time('Cron-Get-Transaction-Queue-For-CCBIll')
    logger.info('Get Transaction Details Cron Started')
    await getTransactionQueue()
    logger.info('Get Transaction Details Cron Completed')
    console.timeEnd('Cron-Get-Transaction-Queue-For-CCBIll')
}

const generateDailyEarningReportByDateCron = async () => {
    console.time('Cron-Generate-Daily-Earning-Report-By-Date')
    logger.info('Generate Daily Report Cron Started')
    const currentDate = moment().startOf('day').subtract(1, 'days').format('YYYY-MM-DD 00:00:00')
    logger.info(`Generate Daily Earning report for ${currentDate}`)
    await generateDailyEarningReportByDate(currentDate)
    logger.info('Generate Daily Report Cron Completed')
    console.timeEnd('Cron-Generate-Daily-Earning-Report-By-Date')
}

const generateDailyEarningReportByDateCronForReferral = async () => {
    console.time('Cron-Generate-Daily-Earning-Report-By-Date-For-Referral')
    logger.info('Generate Daily Report Cron Started')
    const currentDate = moment().startOf('day').subtract(1, 'days').format('YYYY-MM-DD 00:00:00')
    logger.info(`Generate Daily Earning report for ${currentDate}`)
    await generateDailyEarningReportByDateForReferral(currentDate)
    logger.info('Generate Daily Report Cron Completed')
    console.timeEnd('Cron-Generate-Daily-Earning-Report-By-Date-For-Referral')
}

const findMissingWebhooksCron = async () => {
    console.time('Cron-Find-Missing-Webhooks')
    logger.info('Generate Webhook Missing Cron Started')
    await loopAllWebsites()
    logger.info('Generate Webhook Missing Cron Completed')
    console.timeEnd('Cron-Find-Missing-Webhooks')
}

const removeCCBillErrorLogCron = async () => {
    console.time('Cron-Remove-CCBill-Error-Logs')
    logger.info('Remove CCBill Error Log Cron Started')
    await removeCCBillErrorLog()
    logger.info('Remove CCBill Error Log Cron Completed')
    console.timeEnd('Cron-Remove-CCBill-Error-Logs')
}

const getWebsiteCommissionForDate = async (dryRun) => {
    console.time('Get-Commission-For-Website')
    const currentDate = moment().startOf('day').subtract(1, 'days').format('YYYY-MM-DD 00:00:00')
    logger.info('Get commission for website')
    await getWebsiteCommission(currentDate, dryRun)
    logger.info('Get commission for website completed')
    console.timeEnd('Cron-Remove-CCBill-Error-Logs')
}

module.exports = {
    addTransactionQueueCron,
    getTransactionQueueCron,
    generateDailyEarningReportByDateCron,
    findMissingWebhooksCron,
    removeCCBillErrorLogCron,
    getWebsiteCommissionForDate,
    generateDailyEarningReportByDateCronForReferral
}
