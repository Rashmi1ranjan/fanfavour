const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CCBillDuplicateSubscriptionAttemptLogSchema = new Schema({
    domain: {
        type: String
    },
    user_id: {
        type: String
    },
    email: {
        type: String
    },
    card_id: {
        type: String
    },
    card_last_four_digits: {
        type: String
    },
    exist_in_collection: {
        type: String
    },
    is_processed: {
        type: Boolean,
        default: false
    },
    payment_gateway: {
        type: String,
        enum : ['ccbill', 'sticky.io'],
        default: 'ccbill',
        index: true
    },
    request_from: {
        type: String
    },
    card_decline_reason: {
        type: String
    }
}, { timestamps: true })

module.exports = mongoose.model('ccbillDuplicateSubscriptionAttemptLog', CCBillDuplicateSubscriptionAttemptLogSchema)
