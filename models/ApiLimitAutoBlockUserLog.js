const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ApiLimitAutoBlockUserLogSchema = new Schema({
    api_end_point: {
        type: String,
        index: true
    },
    user_id: {
        type: String
    },
    domain: {
        type: String,
        index: true
    },
    user_subscription_status: {
        type: String
    },
    subscription_id: {
        type: String
    },
    payment_gateway: {
        type: String
    },
    is_processed: {
        type: Boolean,
        default: false,
        index: true
    },
    ip_address: {
        type: String
    }
}, { timestamps: true })

module.exports = mongoose.model('ApiLimitAutoBlockUserLog', ApiLimitAutoBlockUserLogSchema)
