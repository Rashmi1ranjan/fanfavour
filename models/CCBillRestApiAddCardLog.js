const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CCBillRestApiAddCardLogSchema = new Schema({
    domain: {
        type: String
    },
    user_id: {
        type: String
    },
    email: {
        type: String
    },
    card_last_four_digits: {
        type: Number
    },
    card_id: {
        type: String
    },
    name_on_card: {
        type: String
    },
    expire_month: {
        type: Number
    },
    expire_year: {
        type: Number
    },
    address: {
        type: String
    },
    ip: {
        type: String
    },
    ccbill_error_message: {
        type: String
    },
    ccbill_error_code: {
        type: String
    },
    is_processed: {
        type: Boolean,
        default: false
    },
    is_error: {
        type: Boolean
    },
    ccbill_response: {
        type: Object
    },
    country: {
        type: String
    },
    state: {
        type: String
    },
    city: {
        type: String
    },
    zipcode: {
        type: String
    },
    card_type: {
        type: String
    },
    from_subscription: {
        type: Boolean
    },
    is_subscription_success: {
        type: Boolean
    },
    is_unique: {
        type: Boolean,
        default: true,
        index: true
    },
    payment_gateway: {
        type: String,
        enum : ['ccbill', 'sticky.io'],
        default: 'ccbill'
    },
    sticky_io_response: {
        type: Object
    },
    sticky_io_error_message: {
        type: String
    },
    sticky_io_error_code: {
        type: String
    },
    recaptcha_score: {
        type: Number
    }
}, { timestamps: true })

CCBillRestApiAddCardLogSchema.index({ createdAt: -1, email: 1, user_id: 1, is_error: 1, country: 1 })
CCBillRestApiAddCardLogSchema.index({ email: 1, domain: 1, from_subscription: 1, _id: 1 })

module.exports = mongoose.model('ccbillRestApiAddCardLog', CCBillRestApiAddCardLogSchema)
