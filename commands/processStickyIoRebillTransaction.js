const Website = require('./../models/Website')
const StickyIoTransactionsReport = require('./../models/StickyIoTransactionReport')
const axios = require('axios')
const moment = require('moment')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')

/**
 * @description Process Sticky.io rebill Transactions and send to website
 */
async function processStickyIoTransactions() {
    const stickyIoWebsite = await Website.find({ payment_gateway: { $in: ['sticky.io', 'hybrid'] } })
    for (const website of stickyIoWebsite) {
        const query = {
            transaction_type: 'REBILL',
            website_url: website.website_url
        }
        const recordLimit = 50
        const totalRebillTransaction = await StickyIoTransactionsReport.countDocuments(query)
        const totalPages = Math.ceil(totalRebillTransaction / recordLimit)
        for (let page = 1; page <= totalPages; page++) {
            const offset = (page - 1) * recordLimit
            const rebillTransactions = await StickyIoTransactionsReport.find(query).skip(offset).limit(recordLimit).sort({ transaction_date: -1 })
            await sendRebillTransactionToWebsite(rebillTransactions, website.website_url)

            const recordProcessed = offset + rebillTransactions.length
            console.log(`Transaction Process: ${recordProcessed}/${totalRebillTransaction} of website ${website.website_url}`)
        }
    }
}

/**
 * @description Process Sticky.io Rebill Transaction by Date and send to Website
 * @param {string} date Transaction Date
 */
async function processRebillTransactionByDate(date) {
    const stickyIoWebsites = await Website.find({ payment_gateway: { $in: ['sticky.io', 'hybrid'] } })
    const transactionStartDate = moment(date).format('YYYY-MM-DD 00:00:00')
    const transactionEndDate = moment(date).format('YYYY-MM-DD 23:59:59')
    for (const website of stickyIoWebsites) {
        const query = {
            transaction_type: 'REBILL',
            website_url: website.website_url,
            transaction_date: {
                $gte: new Date(transactionStartDate),
                $lte: new Date(transactionEndDate)
            }
        }
        const recordLimit = 20
        const totalRebillTransaction = await StickyIoTransactionsReport.countDocuments(query)
        const totalPages = Math.ceil(totalRebillTransaction / recordLimit)
        for (let page = 1; page <= totalPages; page++) {
            const offset = (page - 1) * recordLimit
            const rebillTransactions = await StickyIoTransactionsReport.find(query).skip(offset).limit(recordLimit).sort({ transaction_date: -1 })
            await sendRebillTransactionToWebsite(rebillTransactions, website.website_url)
        }
    }
}

/**
 * @description Rebill Transaction to Website
 * @param {Array} transactions transaction
 * @param {*} website website_url
 */
async function sendRebillTransactionToWebsite(transactions, website) {
    const apiDomain = getWebsiteDomain(website)
    try {
        const apiUrl = `${apiDomain}/api/sticky-io/save-rebill-transaction`
        const sendTransaction = await axios.post(apiUrl, { transactions })
        console.log(sendTransaction.data)
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    processStickyIoTransactions,
    processRebillTransactionByDate
}
