const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CCBillErrorLogSchema = new Schema({
    error_from: {
        type: String
    },
    url: {
        type: String,
        index: true
    },
    response: {
        type: String,
        index: true
    },
    response_code: {
        type: String,
        index: true
    },
    domain: {
        type: String,
        index: true
    },
    created_at: {
        type: Date,
        index: true
    },
    ccbill_error_code: {
        type: Number,
        index: true
    },
    decline_code: {
        type: String,
        index: true
    },
    is_ccbill_error: {
        type: Boolean,
        index: true
    },
    subscription_status: {
        type: Number
    },
    approved: {
        type: Number
    },
    is_recurring: {
        type: Boolean,
        default: false
    },
    user_id: {
        type: String
    },
    is_unique: {
        type: Boolean
    }
})

CCBillErrorLogSchema.index({ error_from: 1, response_code: 1, response: 1, created_at: 1 })
CCBillErrorLogSchema.index({ is_ccbill_error: 1, approved: 1, error_from: 1, created_at: 1, domain: 1 })

module.exports = mongoose.model('CCBillErrorLog', CCBillErrorLogSchema)
