const StickyIoTransactions = require('./../models/StickyIoTransactions')
const StickyIoTransactionsReport = require('./../models/StickyIoTransactionReport')
const StickyIoPaymentProfiles = require('./../models/StickyIoPaymentProfiles')

/**
 * @description Set Transaction payment gateway in sticky.io transaction reports
 * @returns {boolean} true or false
 */
async function setStickyIoTransactionPaymentGateway() {
    let totalTransactions = 0
    try {
        totalTransactions = await StickyIoTransactions.countDocuments()
    } catch (error) {
        console.log('error in countDocuments', error)
        return false
    }

    if (totalTransactions === 0) {
        console.log('No transaction found for update')
        return false
    }

    const limit = 100
    let totalPages = Math.ceil(totalTransactions / limit)
    for (let index = 0; index < totalPages; index++) {
        let offset = index * limit
        let transactions = []
        try {
            transactions = await StickyIoTransactions.find({}, 'gateway_id payment_gateway order_id').skip(offset).limit(limit)
        } catch (error) {
            console.log('error in find transactions', error)
            return false
        }

        for (const transaction of transactions) {
            const query = { order_id: transaction.order_id }

            let paymentGatewayName = ''
            if (transaction.payment_gateway === undefined) {
                const paymentGatewayDetail = await StickyIoPaymentProfiles.findOne({ gateway_id: transaction.gateway_id })
                paymentGatewayName = paymentGatewayDetail.gateway_alias
            }
            paymentGatewayName = transaction.payment_gateway

            const update = {
                transaction_payment_gateway: paymentGatewayName,
                gateway_id: transaction.gateway_id
            }
            await StickyIoTransactionsReport.updateMany(query, update)
        }
    }
    console.log('Transaction successfully updated. ', totalTransactions)
    return true
}

module.exports = {
    setStickyIoTransactionPaymentGateway
}
