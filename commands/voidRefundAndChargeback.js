const Website = require('./../models/Website')
const CCbillTransactionReport = require('./../models/CCBillTransactionReports')
const CCBillMissingWebhooks = require('./../models/CCBillMissingWebhooks')
const axios = require('axios')
const moment = require('moment')
const _ = require('lodash')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')

/**
 * @description Get user id from website using ccbill subscription id
 */
async function getUserIdWithSubscriptionId() {
    const websiteData = await Website.find({ status: { $in: ['live', 'published'] } })
    for (const website of websiteData) {
        const { subscription_sub_account, shop_sub_account, tip_sub_account, website_url } = website

        const query = {
            type: {
                $in: ['VOID', 'REFUND', 'CHARGEBACK']
            },
            client_sub_account: {
                $in: [subscription_sub_account, shop_sub_account, tip_sub_account]
            }
        }
        const limit = 50
        const totalTransactionReport = await CCbillTransactionReport.countDocuments(query)
        let totalPages = Math.ceil(totalTransactionReport / limit)
        for (let index = 0; index < totalPages; index++) {
            const offset = index * limit

            const ccBillTransactionReportData = await CCbillTransactionReport.find(query, { subscription_id: 1, _id: 0 }).skip(offset).limit(limit)
            await getUserIdWithCCbillSubscriptionId(website_url, ccBillTransactionReportData)
        }
    }
    console.log('get the user id with subscription Id')
}

/**
 * @description get the user id using ccbillTransaction Report subscription_id
 * @param {Date} start_date start date
 * @param {Date} end_date end date
 */
async function getUserIdAndSubscriptionId(start_date, end_date) {
    try {
        const websiteData = await Website.find({ status: { $in: ['live', 'published'] } }).limit(1)
        for (const website of websiteData) {
            const { subscription_sub_account, shop_sub_account, tip_sub_account, website_url } = website

            const query = {}
            if ((typeof start_date != 'undefined' || start_date != null) && (typeof end_date != 'undefined' || end_date != null)) {
                const startDate = moment(start_date, 'YYYYMMDDHHmmss').format('YYYY-MM-DDT00:00:00')
                const endDate = moment(end_date, 'YYYYMMDDHHmmss').format('YYYY-MM-DDT23:59:59')
                query.pcp_transaction_date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
            query.client_sub_account = {
                $in: [subscription_sub_account, shop_sub_account, tip_sub_account]
            }

            const limit = 50
            const totalTransactionReport = await CCbillTransactionReport.countDocuments(query)
            let totalPages = Math.ceil(totalTransactionReport / limit)
            for (let index = 0; index < totalPages; index++) {
                const offset = index * limit

                const ccBillTransactionReportData = await CCbillTransactionReport.find(query, { subscription_id: 1, _id: 0 }).skip(offset).limit(limit)
                await getUserIdWithCCbillSubscriptionId(website_url, ccBillTransactionReportData)
            }
        }
        console.log('get the user id using ccbillTransactionReport subscription id')
    } catch (error) {
        console.log({ error })
    }
}

/**
 * @description get user id with subscription id
 * @param {string} domain domain name
 * @param {Array<string>} ccbill_subscriptionIds ccbill subscription id array
 * @returns {Array} user_ids and subscription_id
 */
async function getUserIdWithCCbillSubscriptionId(domain, ccbill_subscriptionIds = []) {
    try {
        const apiDomain = getWebsiteDomain(domain)
        const url = `${apiDomain}/api/getCCbillTransaction/ccbill-transaction`
        const data = { ccbill_subscriptionIds }
        const transactionData = await axios.post(url, data)
        await updateCCbillTransactionReport(transactionData.data.data, domain)
    } catch (err) {
        console.log('error in get user id with subscription id', err)
    }
}

/**
 * @param {Array<string>} transaction_data get transaction collection user_id and subscription id array
 * @param {string} domain domain name
 */
async function updateCCbillTransactionReport(transaction_data = [], domain) {
    try {
        for (let i = 0; i < transaction_data.length; i++) {
            if (transaction_data[i].subscription_id !== null) {
                const updateSet = {
                    user_id: transaction_data[i]._id
                }

                if (!_.isEmpty(transaction_data[i].tracking)) {
                    updateSet.tracking_link = transaction_data[i].tracking
                } else {
                    addMissingWebhookTrackingLink(
                        transaction_data[i].subscription_id,
                        transaction_data[i]._id,
                        domain
                    )
                }

                await CCbillTransactionReport.updateMany(
                    { subscription_id: transaction_data[i].subscription_id },
                    {
                        $set: updateSet
                    }
                )
            }
        }
    } catch (err) {
        console.log('error in update ccbillTransaction report', err)
    }
}

/**
 * Add missing webhook tracking link
 *
 * @param {string} subscriptionId subscription id
 * @param {string} userId user id
 * @param {string} domain domain name
 */
async function addMissingWebhookTrackingLink(subscriptionId, userId, domain) {
    const missingWebhookData = {
        subscription_id: subscriptionId,
        user_id: userId,
        sub_account: domain
    }
    await CCBillMissingWebhooks.create(missingWebhookData)
    console.log('added missing webhook tracking link')
}

module.exports = { getUserIdWithSubscriptionId, getUserIdAndSubscriptionId }
