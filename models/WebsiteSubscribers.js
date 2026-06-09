const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WebsiteSubscribers = new Schema({
    domain: {
        type: String,
        required: true
    },
    free_subscribers: {
        type: Number
    },
    paid_subscribers: {
        type: Number
    }
}, { timestamps: true })

module.exports = mongoose.model('website_subscribed_users', WebsiteSubscribers)
