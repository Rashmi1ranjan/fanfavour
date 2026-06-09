const StickyIoTransactionsReport = require('./../models/StickyIoTransactionReport')
const CCBillTransactionReports = require('./../models/CCBillTransactionReports')
const TransactionDataSchema = require('./../models/TransactionDataForDataScientist')
const Website = require('./../models/Website')
const moment = require('moment')
const axios = require('axios')
const { addTransactionLogs, connectToMySql, deleteTransactionRecordByDateWithDomain } = require('./migrateDataFromMongoDbToMySql')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')
let processed_records = 0
let processed_website = 0

/**
 * @description generate Transaction Data for data scientist
 * @param {string} domain Domain Name
 * @param {string} start_date Start Date
 * @param {string} end_date End Date
 */
async function generateTransactionDataForDataScientist(domain = 'all', start_date = null, end_date = null) {
    await connectToMySql()
    try {
        const websiteQuery = {
            status: { $in: ['published', 'live'] }
        }
        if (domain !== 'all') {
            websiteQuery.website_url = domain
        }

        const websites = await Website.find(websiteQuery).sort({ website_id: -1 })
        for (const website of websites) {
            const { subscription_sub_account, shop_sub_account, tip_sub_account, sticky_io_campaign_id, payment_gateway, website_url, website_id } = website

            console.log('---------------------')
            console.log(`Processing Start for website: ${website_url}(${website_id})`)
            console.log('---------------------')

            processed_website = processed_website + 1
            console.log(`Processed websites: ${processed_website}/${websites.length}`)

            console.time('getWebsiteTransactions')
            await deleteTransactions(start_date, end_date, website_url)

            if (payment_gateway === 'hybrid' || payment_gateway === 'ccbill') {
                processed_records = 0
                const sub_accounts = [subscription_sub_account, shop_sub_account, tip_sub_account]
                console.time('getCCBillTransactions')
                await getCCBillTransactions(start_date, end_date, sub_accounts, website_url)
                console.timeEnd('getCCBillTransactions')
            }

            if (payment_gateway === 'hybrid' || payment_gateway === 'sticky.io') {
                processed_records = 0
                console.time('getStickyIoTransactionData')
                await getStickyIoTransactionData(start_date, end_date, sticky_io_campaign_id, website_url)
                console.timeEnd('getStickyIoTransactionData')
            }

            console.log(`=== Getting Transactions data for website ${website_url}(${website_id}) ====`)
            processed_records = 0
            console.time('analysisTransactionData')
            await analysisTransactionData(start_date, end_date, website_url)
            console.timeEnd('analysisTransactionData')

            console.log(`=== Sending Transactions data to MySql for website ${website_url}(${website_id}) ====`)
            processed_records = 0
            console.time('sendTransactionToMySQL')
            await sendTransactionToMySQL(website_url, start_date, end_date)
            console.timeEnd('sendTransactionToMySQL')

            console.timeEnd('getWebsiteTransactions')
        }
    } catch (error) {
        console.log('Error while generate transaction data', error)
    }
}

/**
 * @description Delete transactions before insert
 * @param {string} start_date Start Date
 * @param {string} end_date End Date
 * @param {string} website_url Website Url
 */
async function deleteTransactions(start_date, end_date, website_url) {
    const query = { domain: website_url }

    if (start_date !== null && end_date !== null) {
        const startDate = moment(start_date).format('YYYY-MM-DDT00:00:00')
        const endDate = moment(end_date).format('YYYY-MM-DDT23:59:59')

        query.transaction_date = {
            $gte: startDate,
            $lte: endDate
        }
    }
    await TransactionDataSchema.deleteMany(query)
}

/**
 * @description Get CCBill transactions data
 * @param {string} start_date start Date
 * @param {string} end_date End date
 * @param {Array} sub_accounts array of ccbill sub account
 * @param {string} website_url website url
 */
async function getCCBillTransactions(start_date, end_date, sub_accounts, website_url) {
    try {
        const query = { client_sub_account: { $in: sub_accounts } }

        if (start_date !== null && end_date !== null) {
            const startDate = moment(start_date).format('YYYY-MM-DDT00:00:00')
            const endDate = moment(end_date).format('YYYY-MM-DDT23:59:59')

            query.pcp_transaction_date = {
                $gte: startDate,
                $lte: endDate
            }
        }

        const totalTransactions = await CCBillTransactionReports.countDocuments(query)
        const limit = 1000
        const totalPages = Math.ceil(totalTransactions / limit)
        console.log(`==== Start Get transaction for Website: ${website_url} CCBill ====`)
        for (let page = 1; page <= totalPages; page++) {
            const offset = (page - 1) * limit
            const ccbillTransactions = await CCBillTransactionReports.find(query).skip(offset).limit(limit).sort({ pcp_transaction_date: 1, _id: 1 })

            for (const transaction of ccbillTransactions) {
                if (transaction.type === 'NEW' || transaction.type === 'REBILL') {
                    const dataToInsert = {
                        amount: transaction.accounting_amount,
                        payment_gateway: 'ccbill',
                        ccbill_subscription_id: transaction.subscription_id,
                        domain: website_url,
                        transaction_date: transaction.pcp_transaction_date
                    }
                    const transactionData = new TransactionDataSchema(dataToInsert)
                    await transactionData.save()
                } else {
                    const query = {
                        domain: website_url,
                        payment_gateway: 'ccbill',
                        ccbill_subscription_id: transaction.subscription_id
                    }
                    const findTransaction = await TransactionDataSchema.findOne(query)
                    if (findTransaction !== null) {
                        if (transaction.type === 'REFUND') {
                            findTransaction.is_refunded = true
                            findTransaction.refund_date = transaction.pcp_transaction_date
                        }

                        if (transaction.type === 'VOID') {
                            findTransaction.is_voided = true
                            findTransaction.void_date = transaction.pcp_transaction_date
                        }

                        if (transaction.type === 'CHARGEBACK') {
                            findTransaction.is_chargeback = true
                            findTransaction.chargeback_date = transaction.pcp_transaction_date
                        }
                        await findTransaction.save()
                    }
                }
            }
            processed_records = processed_records + ccbillTransactions.length
            // console.log(`Record Processed: ${processed_records}/${totalTransactions}`)
        }
        console.log(`==== End Get transaction for Website: ${website_url} CCBill ====`)
    } catch (error) {
        console.log('error while generate CCBill transaction data', error)
    }
}

/**
 * @description Generate Sticky.io transactions data
 * @param {string} start_date start Date
 * @param {string} end_date End date
 * @param {string} sticky_io_campaign_id Sticky io campaign id
 * @param {string} website_url website url
 */
async function getStickyIoTransactionData(start_date, end_date, sticky_io_campaign_id, website_url) {
    try {
        const query = {
            campaign_id: sticky_io_campaign_id,
            transaction_type: { $ne: 'DECLINED' }
        }

        if (start_date !== null && end_date !== null) {
            const startDate = moment(start_date).format('YYYY-MM-DDT00:00:00')
            const endDate = moment(end_date).format('YYYY-MM-DDT23:59:59')

            query.transaction_date = {
                $gte: startDate,
                $lte: endDate
            }
        }

        const totalTransactions = await StickyIoTransactionsReport.countDocuments(query)
        const limit = 1000
        const totalPages = Math.ceil(totalTransactions / limit)
        console.log(`==== Start Get transaction for Website: ${website_url} sticky.io ====`)
        for (let page = 1; page <= totalPages; page++) {
            const offset = (page - 1) * limit
            const stickyIoTransactions = await StickyIoTransactionsReport.find(query).skip(offset).limit(limit).sort({ transaction_date: 1, _id: 1 })

            for (const transaction of stickyIoTransactions) {
                if (transaction.transaction_type === 'NEW' || transaction.transaction_type === 'REBILL') {
                    const dataToInsert = {
                        domain: website_url,
                        amount: transaction.amount,
                        payment_gateway: 'sticky.io',
                        payment_gateway_type: transaction.transaction_payment_gateway,
                        sticky_io_order_id: transaction.order_id,
                        transaction_date: transaction.transaction_date,
                        transaction_type: transaction.pcp_transaction_type,
                        user_id: transaction.pcp_user_id,
                        pcp_transaction_id: transaction.pcp_transaction_id
                    }
                    const transactionData = new TransactionDataSchema(dataToInsert)
                    await transactionData.save()
                } else {
                    const query = {
                        domain: website_url,
                        payment_gateway: 'sticky.io',
                        sticky_io_order_id: transaction.order_id
                    }
                    const findTransaction = await TransactionDataSchema.findOne(query)
                    if (findTransaction !== null) {
                        if (transaction.transaction_type === 'REFUND') {
                            findTransaction.is_refunded = true
                            findTransaction.refund_date = transaction.transaction_date
                        }

                        if (transaction.transaction_type === 'VOID') {
                            findTransaction.is_voided = true
                            findTransaction.void_date = transaction.transaction_date
                        }

                        if (transaction.transaction_type === 'CHARGEBACK') {
                            findTransaction.is_chargeback = true
                            findTransaction.chargeback_date = transaction.transaction_date
                        }

                        await findTransaction.save()
                    }
                }
            }

            processed_records = processed_records + stickyIoTransactions.length
            // console.log(`Record Processed: ${processed_records}/${totalTransactions}`)
        }
        console.log(`==== End Get transaction for Website: ${website_url} sticky.io ====`)
    } catch (error) {
        console.log('error while generate Sticky.io transaction data', error)
    }
}

/**
 * @description Generate Sticky.io transactions data
 * @param {string} start_date start Date
 * @param {string} end_date End date
 * @param {string} domain website url
 */
async function analysisTransactionData(start_date, end_date, domain) {
    try {
        const query = {
            domain: domain
        }

        if (start_date !== null && end_date !== null) {
            const startDate = moment(start_date).format('YYYY-MM-DDT00:00:00')
            const endDate = moment(end_date).format('YYYY-MM-DDT23:59:59')

            query.transaction_date = {
                $gte: startDate,
                $lte: endDate
            }
        }
        const totalTransactions = await TransactionDataSchema.countDocuments(query)
        const limit = 1000
        const totalPages = Math.ceil(totalTransactions / limit)
        for (let page = 1; page <= totalPages; page++) {
            const offset = (page - 1) * limit
            const transactions = await TransactionDataSchema.find(query).skip(offset).limit(limit).sort({ _id: 1 })
            const ccbillTransactions = []
            const stickyIoTransactions = []
            for (const transaction of transactions) {
                const { payment_gateway, ccbill_subscription_id, transaction_date, pcp_transaction_id } = transaction
                if (payment_gateway === 'ccbill') {
                    ccbillTransactions.push({
                        subscription_id: ccbill_subscription_id,
                        transaction_date: transaction_date
                    })
                }

                if (payment_gateway === 'sticky.io') {
                    stickyIoTransactions.push({
                        transaction_id: pcp_transaction_id,
                        transaction_date: transaction_date
                    })
                }
            }

            console.time('getCCBillTransactionDataFromWeb')
            await getCCBillTransactionDataFromWeb(ccbillTransactions, domain)
            console.timeEnd('getCCBillTransactionDataFromWeb')

            console.time('getStickyIoTransactionFromWeb')
            await getStickyIoTransactionFromWeb(stickyIoTransactions, domain)
            console.timeEnd('getStickyIoTransactionFromWeb')

            processed_records = processed_records + stickyIoTransactions.length + ccbillTransactions.length
            // console.log(`Record Processed: ${processed_records}/${totalTransactions}`)
        }

    } catch (error) {
        console.log('error while Analysis transactions', error)
    }
}

/**
 * @description Get CCBill Transaction Data from website
 * @param {Array} transactions data
 * @param {string} domain website url
 */
async function getCCBillTransactionDataFromWeb(transactions, domain) {
    const requestBody = {
        token: 'ym4XjBNHBcSvxtEiMUiUr6j1QWA8NhQl',
        transactions: transactions
    }

    const host = getWebsiteDomain(domain)
    const url = `${host}/api/get-transaction-data-from-subscription-id`

    try {
        const getTransaction = await axios.post(url, requestBody)
        if (getTransaction.status === 200) {
            if (getTransaction.data.data.length > 0) {
                await updateTransactionData(getTransaction.data.data, domain)
            }
        }
    } catch (error) {
        console.log('Error in get CCBill transaction', error)
    }
}

/**
 * @description Get Sticky.io Transaction Data from website
 * @param {Array} transactions data
 * @param {string} domain website url
 */
async function getStickyIoTransactionFromWeb(transactions, domain) {
    const requestBody = {
        token: 'ym4XjBNHBcSvxtEiMUiUr6j1QWA8NhQl',
        transactions: transactions
    }

    const host = getWebsiteDomain(domain)
    const url = `${host}/api/get-transaction-data-from-transaction-id`

    try {
        const getTransaction = await axios.post(url, requestBody)
        if (getTransaction.status === 200) {
            if (getTransaction.data.data.length > 0) {
                await updateTransactionData(getTransaction.data.data, domain)
            }
        }
    } catch (error) {
        console.log('Error in get CCBill transaction', error)
    }
}

/**
 * @description Update Transactions
 * @param {object} transactions transaction
 * @param {string} domain domain name
 */
async function updateTransactionData(transactions, domain) {
    for (const transaction of transactions) {
        if (transaction.payment_gateway === 'sticky.io') {
            const query = {
                domain: domain,
                payment_gateway: 'sticky.io',
                sticky_io_order_id: transaction.sticky_io_order_id,
                user_id: transaction.user_id
            }
            const dataToUpdate = {
                user_registration_date: transaction.user_registration_date,
                content_id: transaction.content_id,
                content_type: transaction.content_type,
                content_from: transaction.content_from,
                content_create_date: transaction.content_create_date,
                content_visibility: transaction.content_visibility,
                is_refunded: transaction.is_transaction_refunded,
                refund_date: transaction.transaction_refund_date,
                is_voided: transaction.is_transaction_voided,
                void_date: transaction.transaction_void_date,
                is_chargeback: transaction.is_transaction_chargeback,
                chargeback_date: transaction.transaction_chargeback_date,
                ip_address: transaction.ip_address,
                country: transaction.country
            }
            await TransactionDataSchema.updateOne(query, dataToUpdate)
        }

        if (transaction.payment_gateway === 'ccbill') {
            const query = {
                domain: domain,
                payment_gateway: 'ccbill',
                ccbill_subscription_id: transaction.ccbill_subscription_id
            }

            const dataToUpdate = {
                user_id: transaction.user_id,
                user_registration_date: transaction.user_registration_date,
                transaction_type: transaction.transaction_type,
                content_id: transaction.content_id,
                content_type: transaction.content_type,
                content_from: transaction.content_from,
                content_create_date: transaction.content_create_date,
                content_visibility: transaction.content_visibility,
                is_refunded: transaction.is_transaction_refunded,
                refund_date: transaction.transaction_refund_date,
                is_voided: transaction.is_transaction_voided,
                void_date: transaction.transaction_void_date,
                is_chargeback: transaction.is_transaction_chargeback,
                chargeback_date: transaction.transaction_chargeback_date,
                ip_address: transaction.ip_address,
                country: transaction.country
            }

            await TransactionDataSchema.updateOne(query, dataToUpdate)
        }
    }
}

/**
 * @description Send Transaction Data to MySQL db
 * @param {string} domain Domain Name
 * @param {string} start_date Start Date
 * @param {string} end_date End Date
 */
async function sendTransactionToMySQL(domain = 'all', start_date = null, end_date = null) {
    try {
        await deleteTransactionRecordByDateWithDomain(start_date, end_date, domain, false)
        const query = {}
        if (domain !== 'all') {
            query.domain = domain
        }

        if (start_date !== null && end_date !== null) {
            const startDate = moment(start_date).format('YYYY-MM-DDT00:00:00')
            const endDate = moment(end_date).format('YYYY-MM-DDT23:59:59')

            query.transaction_date = {
                $gte: startDate,
                $lte: endDate
            }
        }
        const totalTransactions = await TransactionDataSchema.countDocuments(query)
        console.log(`Total Transactions to send: ${totalTransactions}`)
        const limit = 1000
        const totalPages = Math.ceil(totalTransactions / limit)
        for (let page = 1; page <= totalPages; page++) {
            const offset = (page - 1) * limit
            const transactionArray = []
            const transactions = await TransactionDataSchema.find(query).sort({ transaction_date: 1, _id: 1 }).skip(offset).limit(limit)

            for (const transaction of transactions) {
                transactionArray.push([
                    transaction.payment_gateway,
                    transaction.payment_gateway_type,
                    transaction.user_id,
                    transaction.transaction_type,
                    transaction.amount,
                    transaction.ip_address,
                    transaction.transaction_date !== null ? moment(transaction.transaction_date).format('YYYY-MM-DD HH:mm:ss') : null,
                    transaction.is_refunded,
                    transaction.is_voided,
                    transaction.is_chargeback,
                    transaction.refund_date,
                    transaction.void_date,
                    transaction.chargeback_date,
                    transaction.domain,
                    transaction.country,
                    transaction.content_type,
                    transaction.content_from,
                    transaction.content_create_date,
                    transaction.content_id,
                    transaction.user_registration_date,
                    'paid',
                    true,
                    transaction.payment_gateway === 'ccbill' ? transaction.ccbill_subscription_id : transaction.sticky_io_order_id
                ])
            }
            await addTransactionLogs(transactionArray)

            processed_records = processed_records + transactionArray.length
            // console.log(`Record Processed: ${processed_records}/${totalTransactions}`)
        }
    } catch (error) {
        console.log('Error in send transaction to MySQL', error)
    }
}

/**
 * @description Get Content Count from website
 * @param {string} domain domain name
 * @param {string} content_type content type (i.e. mass_message, private_message, blog)
 * @param {string} date start date
 * @param {boolean} is_free get count for only free content
 */
async function getContentCountFromWebsite(domain, content_type, date, is_free = false) {
    const requestBody = {
        token: 'ym4XjBNHBcSvxtEiMUiUr6j1QWA8NhQl',
        content_type: content_type,
        is_free: is_free
    }

    if (date !== null) {
        const dateArray = date.split('|')
        const startDate = moment(dateArray[0]).format('YYYY-MM-DDT00:00:00')
        const endDate = moment(dateArray[1]).format('YYYY-MM-DDT23:59:59')

        requestBody.startDate = startDate
        requestBody.endDate = endDate
    }

    const host = getWebsiteDomain(domain)
    const url = `${host}/api/verify-content-count`

    try {
        const getCount = await axios.post(url, requestBody)
        if (getCount.status === 200) {
            console.log(getCount.data.data)
        }
    } catch (error) {
        console.log('Error in get content count', error)
    }
}

module.exports = { generateTransactionDataForDataScientist, sendTransactionToMySQL, getContentCountFromWebsite }
