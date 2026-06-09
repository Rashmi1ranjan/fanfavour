const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ForumPayTransactionsReportSchema = new Schema({
    state: {
        type: String
    },
    status: {
        type: String
    },
    status_loc: {
        type: String
    },
    pos_id: {
        type: String
    },
    reference_no: {
        type: String
    },
    payer_ip_address: {
        type: String
    },
    invoice_currency: {
        type: String
    },
    invoice_amount: {
        type: String
    },
    currency: {
        type: String
    },
    amount: {
        type: String
    },
    amount_exchange: {
        type: String
    },
    network_processing_fee: {
        type: String
    },
    address: {
        type: String
    },
    type: {
        type: String
    },
    type_loc: {
        type: String
    },
    payment: {
        type: String
    },
    refund: {
        type: String
    },
    refund_amount_opened: {
        type: String
    },
    refund_status: {
        type: String
    },
    refund_status_loc: {
        type: String
    },
    invoice_date: {
        type: String
    },
    inserted: {
        type: String
    },
    confirmed: {
        type: String
    },
    cancelled: {
        type: String
    },
    double_spending_alert: {
        type: String
    },
    accept_zero_confirmations: {
        type: String
    },
    item_name: {
        type: String
    },
    access_token: {
        type: String
    },
    sid: {
        type: String
    },
    payment_id: {
        type: String
    },
    transaction_type: {
        type: String
    },
    website_url: {
        type: String
    },
    transaction_date: {
        type: Date
    }
}, { timestamps: true })

ForumPayTransactionsReportSchema.index({ transaction_date: 1, transaction_type: 1, transaction_status: 1 })

module.exports = mongoose.model('forum_pay_transaction_report', ForumPayTransactionsReportSchema)
