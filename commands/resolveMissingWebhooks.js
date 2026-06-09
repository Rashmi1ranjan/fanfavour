const rp = require('request-promise')
const Website = require('../models/Website')
const TransactionReports = require('../models/CCBillTransactionReports')
const _ = require('lodash')

/**
 * resolve missing webhooks
 *
 */
async function resolveMissingWebhooks() {
    let totalTransactions = 0
    let condition = {
        is_webhook_missing: true
    }
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
                transactions = await TransactionReports.find(condition, 'subscription_id is_webhook_missing client_sub_account recurring_period').skip(offset).limit(limit)
            } catch (error) {
                console.log('error in find', error)
                return
            }
            for (let i = 0; i < transactions.length; i++) {
                await checkIfWebhookExists(transactions[i])
            }
        }
    }
}

/**
 *
 * @param {object} transaction transaction
 *
 * @returns {number} count of updated Transaction Reports
 */
async function checkIfWebhookExists(transaction) {
    console.log('Loop Started')

    const websiteData = await Website.findOne({ subscription_sub_account: transaction.client_sub_account }, 'website_url')
    if (websiteData === null) {
        console.log('Data not found: ' + transaction.client_sub_account)
        return false
    }

    const websiteUrl = 'https://api.' + websiteData.website_url + '/api/services/is_subscription_id_exist'

    let updatedTransactionReports = 0

    const subscriptionId = _.get(transaction, 'subscription_id', false)

    if (transaction.recurring_period === 0) {
        console.log('Resolve webhook missing')
        console.log('website url: ', websiteData.website_url)
        console.log('subscriptionId: ', subscriptionId)
        transaction.is_webhook_missing = false
        await transaction.save()
        updatedTransactionReports++

        return
    }

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
                if (isFound === true) {
                    console.log('Resolve webhook missing')
                    console.log('website url: ', websiteData.website_url)
                    console.log('subscriptionId: ', subscriptionId)
                    transaction.is_webhook_missing = false
                    await transaction.save()
                    updatedTransactionReports++
                }
            }
        } catch (error) {
            console.log('Error in transaction')
            console.log('transaction', transaction)
            console.log('error in checkIfWebhookExists', error)
            return
        }
    }
    return
}

module.exports = { resolveMissingWebhooks }
