const mongoose = require('mongoose')
const Schema = mongoose.Schema

const wrongUserSubscriptionStatus = new Schema({
    website_url: {
        type: String
    },
    transaction_type: {
        type: String
    },
    pcp_transaction_type: {
        type: String
    },
    user_id: {
        type: String
    },
    is_fixed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

module.exports = mongoose.model('wrong_user_subscription_status', wrongUserSubscriptionStatus)
