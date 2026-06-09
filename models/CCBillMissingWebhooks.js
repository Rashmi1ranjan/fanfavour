const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CCBillMissingWebhooksSchema = new Schema({
    subscription_id: {
        type: String,
        index: true
    },
    user_id: {
        type: String
    },
    domain: {
        type: String
    }
})

module.exports = CCBillMissingWebhooks = mongoose.model('ccbill_missing_webhooks', CCBillMissingWebhooksSchema)
