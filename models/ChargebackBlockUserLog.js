const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ChargebackBlockUserLog = new Schema({
    domain: {
        type: String
    },
    user_id: {
        type: String
    },
    email: {
        type: String
    },
    subscription_id: {
        type: String
    },
    chargeback_reason: {
        type: String
    },
    chargeback_date: {
        type: String
    }
}, { timestamps: true })

module.exports = mongoose.model('ChargebackBlockCardLog', ChargebackBlockUserLog)
