const mongoose = require('mongoose')
const Schema = mongoose.Schema

const StickyIoTransactionsSchema = new Schema({
    order_status: {
        type: String
    },
    campaign_id: {
        type: String
    },
    product_id: {
        type: String
    },
    offer_id: {
        type: String
    },
    billing_model_id: {
        type: String
    },
    gateway_id: {
        type: String
    },
    payment: {
        type: String
    },
    order_total: {
        type: String
    },
    order_date_time: {
        type: Date
    },
    order_id: {
        type: String
    },
    bill_first_name: {
        type: String
    },
    bill_last_name: {
        type: String
    },
    bill_phone: {
        type: String
    },
    bill_email: {
        type: String
    },
    ip_address: {
        type: String
    },
    ip_address_lookup: {
        type: String
    },
    decline_reason: {
        type: String
    },
    transaction_number: {
        type: String
    },
    auth_number: {
        type: String
    },
    is_cancel: {
        type: String
    },
    is_fraud: {
        type: String
    },
    is_recurring: {
        type: String
    },
    recurring_date: {
        type: String
    },
    is_chargeback: {
        type: String
    },
    chargeback_date: {
        type: String
    },
    chargeback_by: {
        type: String
    },
    is_void: {
        type: String
    },
    void_amount: {
        type: String
    },
    void_date: {
        type: String
    },
    voided_by: {
        type: String
    },
    is_refund: {
        type: String
    },
    refund_amount: {
        type: String
    },
    refund_date: {
        type: String
    },
    refunded_by: {
        type: String
    },
    pcp_user_id: {
        type: String
    },
    pcp_transaction_id: {
        type: String
    },
    pcp_transaction_type: {
        type: String
    },
    ancestor_order_id: {
        type: String
    },
    parent_order_id: {
        type: String
    },
    payment_gateway: {
        type: String
    },
    is_cascaded: {
        type: String
    },
    original_gateway_id: {
        type: String
    },
    original_decline_reason: {
        type: String
    }
})

StickyIoTransactionsSchema.index({ order_status: 1, campaign_id: 1, order_id: 1 })
module.exports = mongoose.model('StickyIoTransactions', StickyIoTransactionsSchema)
