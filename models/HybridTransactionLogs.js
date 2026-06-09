const mongoose = require('mongoose')
const Schema = mongoose.Schema

const HybridTransactionLogsSchema = new Schema({
    domain: {
        type: String
    },
    user_id: {
        type: String,
        index: true
    },
    is_success: {
        type: Boolean
    },
    recurring: {
        type: String,
        index: true
    },
    amount: {
        type: Number
    },
    transaction_date: {
        type: Date
    },
    pcp_transaction_id: {
        type: String
    },
    response: {
        type: Object
    },
    final_payment_gateway: {
        type: String
    },
    ip_address: {
        type: String
    },
    is_cascade_transaction: {
        type: Boolean,
        default: false
    },
    cascade: {
        type: Object
    },
    country: {
        type: String
    },
    is_unique: {
        type: Boolean
    },
    payment_gateways: {
        type: Array
    },
    transaction_type: {
        type: String
    },
    is_cascade_enabled: {
        type: Boolean,
        default: false
    },
    by_primary_gateway: {
        type: Boolean,
        default: true
    },
    // Flag for cascade transaction type from where transaction is cascade (1 = Subscription, 2 = Purchase - Added same primary card, 3 = Purchase - Added different card)
    cascade_type: {
        type: Number,
        default: 0
    },
    transaction_execution_time: {
        type: Number,
        default: 0
    },
    is_user_universal: {
        type: Boolean,
        default: false
    }
})

HybridTransactionLogsSchema.index({ user_id: 1, domain: 1, _id: -1 })
HybridTransactionLogsSchema.index({ transaction_date: 1, domain: 1 })
module.exports = mongoose.model('HybridTransactionLogs', HybridTransactionLogsSchema)
