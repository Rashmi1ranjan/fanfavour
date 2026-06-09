const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ApiRateLimiterLogSchema = new Schema({
    ip_address: {
        type: String
    },
    domain: {
        type: String,
        index: true
    },
    api_end_point: {
        type: String,
        index: true
    },
    user_id: {
        type: String
    },
    payload: {
        type: Object
    },
    created_at: {
        type: String,
        index: true
    }
})

module.exports = mongoose.model('ApiLimiterLogs', ApiRateLimiterLogSchema)
