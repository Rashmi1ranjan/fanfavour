const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TransactionDataSchema = new Schema({
    domain: {
        type: String
    },
    user_id: {
        type: String
    },
    user_registration_date: {
        type: Date
    },
    amount: {
        type: String
    },
    transaction_date: {
        type: Date
    },
    content_id: {
        type: String
    },
    content_type: {
        type: String
    },
    content_from: {
        type: String
    },
    content_create_date: {
        type: Date
    },
    content_visibility: {
        type: String
    },
    transaction_type: {
        type: String
    },
    payment_gateway: {
        type: String
    },
    payment_gateway_type: {
        type: String
    },
    is_refunded: {
        type: Boolean,
        default: false
    },
    refund_date: {
        type: Date
    },
    is_voided: {
        type: Boolean,
        default: false
    },
    void_date: {
        type: Date
    },
    is_chargeback: {
        type: Boolean,
        default: false
    },
    chargeback_date: {
        type: Date
    },
    ip_address: {
        type: String
    },
    country: {
        type: String
    },
    pcp_transaction_id: {
        type: String
    },
    ccbill_subscription_id: {
        type: String
    },
    sticky_io_order_id: {
        type: String
    }
})

TransactionDataSchema.index({ domain: 1, transaction_date: 1, _id: 1 })
TransactionDataSchema.index({ ccbill_subscription_id: 1, domain: 1, payment_gateway: 1 })
TransactionDataSchema.index({ domain: 1, payment_gateway: 1, sticky_io_order_id: 1, user_id: 1 })
module.exports = mongoose.model('transaction_data_for_data_scientist', TransactionDataSchema)
