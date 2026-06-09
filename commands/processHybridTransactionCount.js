const TransactionCountLogs = require('./../models/TransactionCountLogs')
const HybridTransactionLogs = require('./../models/HybridTransactionLogs')
const StickyIoPaymentProfiles = require('./../models/StickyIoPaymentProfiles')
const moment = require('moment')
const _ = require('lodash')

/**
 * @description Process Sticky.io rebill Transactions and send to website
 */
async function processHybridTransactionSummaryCount() {
    await TransactionCountLogs.deleteMany({})
    const hybridTransactions = await HybridTransactionLogs.find().sort({ _id: 1 })
    for (const transaction of hybridTransactions) {
        const { is_unique, is_unique_cascade } = await checkIsUniqueTransaction(transaction)
        const {
            domain,
            payment_gateways,
            is_cascade_enabled
        } = transaction
        const query = {
            domain: domain,
            date: moment(transaction.transaction_date).format('YYYY-MM-DD 00:00:00'),
            payment_gateway: payment_gateways,
            country: transaction.country,
            is_recurring: transaction.recurring === 'true' ? true : false,
            is_cascade_enabled: is_cascade_enabled
        }

        const stickyIoIndex = payment_gateways.indexOf('sticky.io')
        let stickyIoPaymentGatewayName = 'stickyio'
        if (stickyIoIndex !== -1) {
            const stickyIoResponse = _.get(transaction, 'response', false)
            const stickyIoPaymentGatewayId = _.get(transaction, 'response.gateway_id', false)
            if (stickyIoResponse !== false && stickyIoPaymentGatewayId !== false) {
                const stickyIoPaymentGateway = await StickyIoPaymentProfiles.findOne({ gateway_id: stickyIoPaymentGatewayId })
                stickyIoPaymentGatewayName = stickyIoPaymentGateway.gateway_alias
                payment_gateways[stickyIoIndex] = stickyIoPaymentGatewayName
            } else {
                stickyIoPaymentGatewayName = 'stickyio'
                payment_gateways[stickyIoIndex] = stickyIoPaymentGatewayName
            }
        }

        const transactionCounter = {}
        const transactionAmount = transaction.amount

        if (transaction.is_success === true) {
            transactionCounter.success = 1
            transactionCounter.success_amount = transactionAmount
            if (transaction.is_cascade_transaction === true) {
                transactionCounter.cascade_success = 1
                transactionCounter.cascade_success_amount = transactionAmount
            }
        } else {
            transactionCounter.failed = 1
            if (is_unique === true) {
                transactionCounter.unique_failed = 1
                transactionCounter.unique_failed_amount = transactionAmount
            }
            if (transaction.is_cascade_transaction === true) {
                transactionCounter.cascade_failed = 1
                transactionCounter.cascade_failed_amount = transactionAmount
            }
        }

        const by_primary_gateway = _.get(transaction, 'by_primary_gateway', false)
        if (by_primary_gateway === false && transaction.is_success == true) {
            transactionCounter.processed_count_by_secondary_gateway = 1
            transactionCounter.processed_amount_by_secondary_gateway = transactionAmount
        }

        transaction.final_payment_gateway = transaction.final_payment_gateway === 'sticky.io' ? stickyIoPaymentGatewayName : transaction.final_payment_gateway
        for (const payment_gateway of payment_gateways) {
            const payment_gateway_name = payment_gateway.replace('.', '').replace(' ', '_')
            const transactionGateway = transaction.final_payment_gateway.replace(' ', '_')
            if (transaction.is_success === true && payment_gateway === transactionGateway) {
                transactionCounter[`counters.${payment_gateway_name}.success`] = 1
                transactionCounter[`counters.${payment_gateway_name}.success_amount`] = transactionAmount
            } else {
                transactionCounter[`counters.${payment_gateway_name}.failed`] = 1
                if (is_unique_cascade === true) {
                    transactionCounter[`counters.${payment_gateway_name}.unique_failed`] = 1
                    transactionCounter[`counters.${payment_gateway_name}.unique_failed_amount`] = transactionAmount
                }
            }
        }

        const update = { $inc: transactionCounter }
        await TransactionCountLogs.updateOne(query, update, { upsert: true })
    }
}

/**
 * @description Check for transaction is unique or not
 * @param {object} transaction transaction object
 * @returns {object} is_unique and is_unique_cascade
 */
async function checkIsUniqueTransaction(transaction) {
    let is_unique = true
    let is_unique_cascade = true
    const transaction_status = transaction.is_success
    const previousTransaction = await HybridTransactionLogs.findOne({ user_id: transaction.user_id, domain: transaction.domain, _id: { $lt: transaction._id } }).sort({ _id: 1 })

    if (previousTransaction !== null) {
        if (transaction_status === false) {
            is_unique = _.get(previousTransaction, 'is_success', true)
        }
        const is_both_transaction_is_cascade = (previousTransaction.is_cascade_transaction === true && transaction.is_cascade_transaction === true)

        if (is_both_transaction_is_cascade === true) {
            const is_current_transaction_status_same_as_previous = (previousTransaction.is_success === transaction_status)

            const previousTransactionPaymentGateways = previousTransaction.payment_gateways
            const transactionPaymentGateways = transaction.payment_gateways

            const previousTransactionFailedFrom = previousTransactionPaymentGateways[0]
            const transactionFailedFrom = transactionPaymentGateways[0]
            const is_same_failed_gateway_for_transaction = previousTransactionFailedFrom === transactionFailedFrom

            const previousTransactionCascadePaymentGateway = previousTransaction.final_payment_gateway
            const currentTransactionCascadePaymentGateway = transaction.final_payment_gateway
            const is_final_payment_gateway_same_as_previous = (previousTransactionCascadePaymentGateway === currentTransactionCascadePaymentGateway)

            if (
                is_same_failed_gateway_for_transaction === true &&
                is_current_transaction_status_same_as_previous === true &&
                is_final_payment_gateway_same_as_previous === true
            ) {
                is_unique_cascade = false
            }
        }
    }

    return { is_unique, is_unique_cascade }
}


/**
 * @description Fix secondary payment counter
 */
async function fixHybridSecondaryPaymentCount() {
    const getTransactions = await HybridTransactionLogs.aggregate([
        {
            '$match': {
                'by_primary_gateway': false,
                'is_success': true
            }
        }, {
            '$addFields': {
                'yearMonthDay': {
                    '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$transaction_date'
                    }
                },
                'sticky_io_gateway_id': '$response.gateway_id'
            }
        }, {
            '$group': {
                '_id': {
                    'domain': '$domain',
                    'transaction_date': '$yearMonthDay',
                    'payment_gateways': '$payment_gateways',
                    'country': '$country',
                    'recurring': '$recurring',
                    'is_cascade_enabled': '$is_cascade_enabled'
                },
                'count': { '$sum': 1 },
                'amount': { '$sum': '$amount' },
                'sticky_io_gateway_id': { '$first': '$sticky_io_gateway_id' }
            }
        }
    ])

    if (getTransactions.length > 0) {
        for (const transaction of getTransactions) {
            const { domain, transaction_date, payment_gateways, country, recurring, is_cascade_enabled } = transaction._id
            const data = {
                $set: {
                    processed_count_by_secondary_gateway: transaction.count,
                    processed_amount_by_secondary_gateway: transaction.amount
                }
            }

            const stickyIoIndex = payment_gateways.indexOf('sticky.io')
            let stickyIoPaymentGatewayName = 'stickyio'
            if (stickyIoIndex !== -1) {
                payment_gateways[stickyIoIndex] = stickyIoPaymentGatewayName
                const stickyIoPaymentGatewayId = _.get(transaction, 'sticky_io_gateway_id', false)
                if (stickyIoPaymentGatewayId !== false && stickyIoPaymentGatewayId !== null) {
                    const stickyIoPaymentGateway = await StickyIoPaymentProfiles.findOne({ gateway_id: stickyIoPaymentGatewayId })
                    stickyIoPaymentGatewayName = stickyIoPaymentGateway.gateway_alias
                    payment_gateways[stickyIoIndex] = stickyIoPaymentGatewayName
                }
            }

            const query = {
                domain: domain,
                date: new Date(moment.utc(moment(transaction_date).format('YYYY-MM-DD 00:00:00'))),
                payment_gateway: payment_gateways,
                country: country,
                is_recurring: recurring === 'true' ? true : false,
                is_cascade_enabled: is_cascade_enabled
            }

            await TransactionCountLogs.findOneAndUpdate(query, data)
        }
    }
}

module.exports = { processHybridTransactionSummaryCount, fixHybridSecondaryPaymentCount }
