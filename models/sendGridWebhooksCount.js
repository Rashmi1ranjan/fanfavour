const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Create Schema
const SendGridWebhooksCountSchema = new Schema({
    webhookCountDetail: {
        type: Object
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    domain: {
        type: String,
        index: true
    }
})

module.exports = mongoose.model('SendGridWebhookCount', SendGridWebhooksCountSchema)
