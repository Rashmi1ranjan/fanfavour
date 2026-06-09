const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CCBillTransactionReportSchema = new Schema({
    type: {
        type: String,
        index: true
    },
    user_id:{
        type: Schema.Types.ObjectId,
        index:true
    },
    client_account_number: {
        type: String
    },
    client_sub_account: {
        type: String,
        index: true
    },
    subscription_id: {
        type: String,
        index: true
    },
    transaction_timestamp: {
        type: String
    },
    first_name: {
        type: String
    },
    last_name: {
        type: String
    },
    email_address: {
        type: String
    },
    partner_id: {
        type: String
    },
    subscription_status: {
        type: String
    },
    accounting_amount: {
        type: Number
    },
    initial_period: {
        type: Number
    },
    recurring_accounting_amount: {
        type: Number
    },
    recurring_period: {
        type: Number
    },
    recurring_status: {
        type: Number
    },
    card_type: {
        type: String
    },
    cancel_date: {
        type: String
    },
    rebill_transaction_id: {
        type: String
    },
    pcp_model_earnings: {
        type: Number
    },
    pcp_platform_commission: {
        type: Number
    },
    pcp_ccbill_charge: {
        type: Number
    },
    pcp_transaction_date: {
        type: Date,
        index: true
    },
    is_expired_or_void: {
        type: Boolean
    },
    platform_chargeback_fees: {
        type: Number
    },
    model_chargeback_fees: {
        type: Number
    },
    is_webhook_missing: {
        type: Boolean
    },
    tracking_link: {
        type: String,
        index: true
    }
})

CCBillTransactionReportSchema.index({ transaction_timestamp: 1, client_sub_account: 1 })
CCBillTransactionReportSchema.index({ is_webhook_missing: 1, pcp_transaction_date: -1 })

module.exports = mongoose.model('CCBillTransactionReport', CCBillTransactionReportSchema)
