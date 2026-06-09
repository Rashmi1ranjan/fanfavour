const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ForumPayWebhooks = new Schema({
    body: {
        type: Object
    },
    query: {
        type: Object
    },
    created_at: {
        type: Date
    },
    is_processed: {
        type: Boolean,
        default: false
    },
    is_duplicate_webhook: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('forumpay_webhooks', ForumPayWebhooks)
