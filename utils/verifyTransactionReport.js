const rp = require('request-promise')
const Website = require('../models/Website')
const TransactionReports = require('../models/CCBillTransactionReports')
const _ = require('lodash')
const moment = require('moment')
const { addCronStatusLog } = require('./addCronStatus')

/**
 *@returns {boolean} true | false
 */
async function loopAllWebsites() {
    let rows = await Website.find({ payment_gateway: 'ccbill' }, 'website_url subscription_sub_account')
    for (let element of rows) {
        try {
            console.log('website_url', element.website_url)
            let transaction = await checkIfWebhookExists(element.website_url, element.subscription_sub_account)
            console.log('transactions updated', transaction)
        } catch (error) {
            console.log(error.message)
            return false
        }
    }
    return true
}

/**
 *
 * @param {string} website_url website_url
 * @param {string} subscription_sub_account subscription_sub_account
 * @returns {number} count of updated Transaction Reports
 */
async function checkIfWebhookExists(website_url, subscription_sub_account) {
    console.log('Loop Started')
    const websiteUrl = 'https://api.' + website_url + '/api/services/is_subscription_id_exist'
    const subscriptionSubAccount = subscription_sub_account

    let lastRecord = await TransactionReports.findOne({}, 'pcp_transaction_date').sort({ _id: -1 })
    let lastRecordDate = _.get(lastRecord, 'pcp_transaction_date', moment())
    let startDate = moment(lastRecordDate).format('YYYY-MM-DDT00:00:00')
    let endDate = moment(lastRecordDate).format('YYYY-MM-DDT23:59:59')
    let target_date = moment().format('YYYY-MM-DDT00:00:00.000+00:00')
    target_date = new Date(target_date)

    let query = {
        'type': 'NEW',
        'client_sub_account': subscriptionSubAccount,
        'is_expired_or_void': { $ne: true },
        'recurring_period': 30,
        'pcp_transaction_date': {
            $gte: startDate,
            $lte: endDate
        }
    }
    let updatedTransactionReports = 0

    await loopSubscriptionTransactionReports(query, async (transaction) => {
        const subscriptionId = _.get(transaction, 'subscription_id', false)
        const isWebhookMissing = _.get(transaction, 'is_webhook_missing', false)
        if (subscriptionId !== false && subscriptionId !== '') {

            const token = ']qMcj$/*~X'
            const requestBody = {
                subscription_id: subscriptionId,
                token: token
            }

            try {
                let body = await rp.post({
                    url: websiteUrl,
                    json: requestBody
                })

                if (body.status === 200) {
                    const isFound = _.get(body, 'data.isFound', '')
                    if (isFound === false) {
                        if (isWebhookMissing !== true) {
                            console.log('Webhook missing')
                            console.log('website url: ', website_url)
                            console.log('subscriptionId: ', subscriptionId)
                            transaction.is_webhook_missing = true
                            await transaction.save()
                            updatedTransactionReports++
                        }
                    }
                }
            } catch (error) {
                console.log('Error in transaction')
                console.log('transaction', transaction)
                console.log('error in checkIfWebhookExists', error)
                const message = _.get(error, 'message', 'Error in checkIfWebhookExists')
                const cronStatusData = {
                    domain: website_url,
                    command_name: 'Get Missing Webhooks',
                    cron_status: 'error',
                    target_date: target_date,
                    message: message
                }
                await addCronStatusLog(cronStatusData)
                return new Promise((resolve, reject) => {
                    reject(error)
                })
            }
        }
    })
    const cronStatusData = {
        domain: website_url,
        command_name: 'Get Missing Webhooks',
        cron_status: 'success',
        target_date: target_date,
        message: ''
    }
    await addCronStatusLog(cronStatusData)
    return new Promise((resolve) => {
        console.log('Loop Completed')
        resolve(updatedTransactionReports)
    })
}

/**
 *
 * @param {object} condition condition
 * @param {*} callback callback
 */
async function loopSubscriptionTransactionReports(condition, callback) {
    let totalTransactions = 0
    try {
        totalTransactions = await TransactionReports.countDocuments(condition)
        console.log('totalTransactions', totalTransactions)
    } catch (error) {
        console.log('error in countDocuments', error)
        return
    }

    if (totalTransactions > 0) {
        const limit = 100
        let totalPages = Math.ceil(totalTransactions / limit)
        for (let index = 0; index < totalPages; index++) {
            let offset = index * limit
            console.log('offset', offset)
            let transactions = []
            try {
                transactions = await TransactionReports.find(condition, 'subscription_id is_webhook_missing').skip(offset).limit(limit)
            } catch (error) {
                console.log('error in find', error)
                return
            }
            for (let i = 0; i < transactions.length; i++) {
                await callback(transactions[i])
            }
        }
    }
}

module.exports = { loopAllWebsites, loopSubscriptionTransactionReports }
