const _ = require('lodash')
const WalletTransactions = require('./../models/WalletTransactions')
const WalletBalance = require('./../models/WalletBalance')
const { getWalletTransactionStatus } = require('./../utils/forumpay')
const axios = require('axios')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')

/**
 * @description update Wallet transaction status
 */
async function updateWalletTransactionStatus() {
    const recordLimit = 50
    const totalTransactions = await WalletTransactions.countDocuments({})
    const totalPages = Math.ceil(totalTransactions / recordLimit)
    for (let page = 1; page <= totalPages; page++) {
        const offset = (page - 1) * recordLimit
        const transactions = await WalletTransactions.find({}).skip(offset).limit(recordLimit).sort({ _id: -1 })
        for (const transaction of transactions) {
            const errorMessage = _.get(transaction, 'forumpay_response.err', '')
            const is_region_error = isRegionError(errorMessage)
            const wallet_transaction_status = getWalletTransactionStatus(transaction.transaction_status, is_region_error, is_region_error)
            const update = {
                $set: {
                    wallet_transaction_status: wallet_transaction_status
                }
            }
            await WalletTransactions.updateOne({ _id: transaction._id }, update)
        }
    }
    console.log('Wallet Transaction status updated')
}

/**
 * @description Set Custom error message for payment
 * @param {string} errorMessage original error message
 * @returns {object} Object of error message
 */
function isRegionError(errorMessage) {
    if (errorMessage.includes('regulatory') || errorMessage.includes('restrictions') || errorMessage.includes('region')) {
        return true
    }
    return false
}


/**
 * @description Update user wallet balance
 * @returns {boolean} true
 */
async function updateUserWalletBalance() {
    const recordLimit = 50
    const totalTransactions = await WalletBalance.countDocuments({})
    console.log(`Total User: ${totalTransactions}`)
    const totalPages = Math.ceil(totalTransactions / recordLimit)
    let updatedUsers = 0
    for (let page = 1; page <= totalPages; page++) {
        const offset = (page - 1) * recordLimit
        const transactions = await WalletBalance.find({}).skip(offset).limit(recordLimit).sort({ _id: -1 })
        for (const transaction of transactions) {
            const { domain, email, amount } = transaction
            await sendWalletBalanceToWebsite(domain, { email, amount })
            updatedUsers++
        }
        console.log(`User Updated: ${updatedUsers}/${totalTransactions}`)
    }
    console.log('All User successfully updated')
    return true
}

/**
 * @description send user wallet balance to services
 * @param {string} domain website domain name
 * @param {object} data object of email and amount
 * @returns {boolean} true
 */
async function sendWalletBalanceToWebsite(domain, data) {
    try {
        const apiDomain = getWebsiteDomain(domain)
        const apiUrl = `${apiDomain}/api/crypto/update-user-wallet-balance`
        const sendWalletBalance = await axios.post(apiUrl, data)
        const responseData = _.get(sendWalletBalance, 'data', { status: 400 })
        if (responseData.status === 200) {
            return true
        }
        return false
    } catch (error) {
        console.log(error)
        return false
    }
}


module.exports = {
    updateWalletTransactionStatus,
    updateUserWalletBalance
}
