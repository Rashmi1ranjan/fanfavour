const moment = require('moment')
const axios = require('axios')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const StickyIoTransactionReport = require('./../models/StickyIoTransactionReport')
const WrongUserSubscriptionStatus = require('./../models/WrongUserSubscriptionStatusLog')
const ResubscriptionOfferReport = require('./../models/ResubscriptionOfferReports')
const _ = require('lodash')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')


const checkUserSubscriptionStatusAfterRebill = async (date) => {
    try {
        const startDateMoment = moment(date, 'YYYY-MM-DD').format('YYYY-MM-DDT00:00:00')
        const endDateMoment = moment(date, 'YYYY-MM-DD').format('YYYY-MM-DDT23:59:59')

        const query = {
            transaction_type: { $in: ['REBILL', 'NEW'] },
            pcp_transaction_type: 'subscription',
            transaction_date: {
                $gte: new Date(startDateMoment),
                $lte: new Date(endDateMoment)
            }
        }

        const select = {
            pcp_user_id: 1,
            website_url: 1,
            transaction_type: 1,
            pcp_transaction_type: 1,
            _id: 0
        }

        const transactions = await StickyIoTransactionReport.find(query, select)
        const totalTransactions = transactions.length
        const users_with_wrong_subscription_status = []
        let processedTransactions = 0
        for (const transaction of transactions) {
            const user_status = await checkUserSubscriptionStatusFromWebsite(transaction)
            if (user_status.status === false) {
                const userData = {
                    website_url: transaction.website_url,
                    transaction_type: transaction.transaction_type,
                    pcp_transaction_type: transaction.pcp_transaction_type,
                    user_id: transaction.pcp_user_id
                }
                const addWrongUserSubscriptionStatus = new WrongUserSubscriptionStatus(userData)
                await addWrongUserSubscriptionStatus.save()
                users_with_wrong_subscription_status.push(transaction.toObject())
            }
            processedTransactions++
            console.log(`Transactions processed: ${processedTransactions}/${totalTransactions}`)
        }
        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

const checkUserSubscriptionStatusFromWebsite = async (transaction_info) => {
    try {
        const token = API_STATIC_AUTH_TOKEN
        const data = {
            user_id: transaction_info.pcp_user_id,
            token: token
        }
        const website_url = transaction_info.website_url
        const apiDomain = getWebsiteDomain(website_url)

        const apiUrl = `${apiDomain}/api/check-user-subscription-status`
        const checkUserStatus = await axios.post(apiUrl, data)
        return { status: checkUserStatus.data.data.status }
    } catch (error) {
        return { status: false }
    }
}

const getUserTotalAmountSpentSinceLastSubscription = async () => {
    try {
        const resubscribedUsers = await ResubscriptionOfferReport.find({}, 'user_id domain')
        console.log(`Total Reports found: ${resubscribedUsers.length}`)

        for (const user of resubscribedUsers) {
            const data = { user_id: user.user_id }
            const apiDomain = getWebsiteDomain(user.domain)
            const apiUrl = `${apiDomain}/user/user-total-amount-spent`
            const userAmountSpent = await axios.post(apiUrl, data)
            const responseData = userAmountSpent.data
            if (responseData.success === 1) {
                const amountSpent = _.get(responseData.data, 'total_amount_spent_since_last_subscription', 0.00)
                await ResubscriptionOfferReport.updateOne({ _id: user._id }, { $set: { total_amount_spent_since_last_subscription: amountSpent } })
            }
        }
        console.log('All Reports successfully updated')
        return true
    } catch (error) {
        console.log(error)
        console.log('Error in command execution')
        return false
    }
}

module.exports = { checkUserSubscriptionStatusAfterRebill, getUserTotalAmountSpentSinceLastSubscription }
