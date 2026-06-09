const mongoose = require('mongoose')
const Schema = mongoose.Schema

const StickyIoTransactionsReportSchema = new Schema({
    transaction_type: {
        type: String
    },
    campaign_id: {
        type: String
    },
    product_id: {
        type: String
    },
    order_id: {
        type: String,
        index: true
    },
    amount: {
        type: String
    },
    first_name: {
        type: String
    },
    last_name: {
        type: String
    },
    email: {
        type: String
    },
    card_type: {
        type: String
    },
    is_recurring: {
        type: String
    },
    transaction_date: {
        type: Date
    },
    pcp_transaction_type: {
        type: String
    },
    pcp_user_id: {
        type: String
    },
    pcp_transaction_id: {
        type: String
    },
    website_url: {
        type: String
    },
    transaction_number: {
        type: String
    },
    auth_number: {
        type: String
    },
    transaction_payment_gateway: {
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
    },
    gateway_id: {
        type: String
    },
    notes: {
        type: String
    },
    has_chargeback: {
        type: Boolean,
        default: false
    },
    chargeback_added_date: {
        type: Date
    },
    tracking_link: {
        type: String
    }
}, { timestamps: true })

StickyIoTransactionsReportSchema.index({ transaction_date: 1, transaction_type: 1, pcp_transaction_type: 1, campaign_id: 1 })
StickyIoTransactionsReportSchema.index({ pcp_user_id: 1, createdAt: -1 })
module.exports = mongoose.model('StickyIoTransactionsReport', StickyIoTransactionsReportSchema)
