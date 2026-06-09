const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Create Schema
const WebhookFromSendGridSchema = new Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    domain: {
        type: String,
        required: true,
        index: true
    },
    webhook: {
        type: Object
    },
    emailFrom: {
        type: String,
        required: true,
        index: true
    },
    event: {
        type: String,
        required: true,
        index: true
    },
    sg_message_id: {
        type: String,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('WebhookFromSendGrid', WebhookFromSendGridSchema)
