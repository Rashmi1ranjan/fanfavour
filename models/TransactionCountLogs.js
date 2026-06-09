const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TransactionCountLogs = new Schema({
    domain: {
        type: String
    },
    date: {
        type: Date
    },
    payment_gateway: {
        type: Array
    },
    is_recurring: {
        type: Boolean
    },
    country: {
        type: String
    },
    success: {
        type: Number
    },
    success_amount: {
        type: Number
    },
    unique_failed: {
        type: Number
    },
    unique_failed_amount: {
        type: Number
    },
    failed: {
        type: Number
    },
    cascade_success: {
        type: Number
    },
    cascade_success_amount: {
        type: Number
    },
    cascade_failed: {
        type: Number
    },
    cascade_failed_amount: {
        type: Number
    },
    processed_count_by_secondary_gateway: {
        type: Number
    },
    processed_amount_by_secondary_gateway: {
        type: Number
    },
    counters: {
        type: Object
    },
    is_cascade_enabled: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

TransactionCountLogs.index({ domain: 1, date: 1, payment_gateway: 1, country: 1, is_recurring: 1, is_cascade_enabled: 1 })
module.exports = mongoose.model('TransactionCountLogs', TransactionCountLogs)
