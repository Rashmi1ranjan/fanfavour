const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WebsiteIsSubscribedEverUsers = new Schema({
    domain: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        index: true
    }
}, { timestamps: true })

WebsiteIsSubscribedEverUsers.index({ domain: 1, email: 1 })

module.exports = mongoose.model('website_is_subscribed_ever_users', WebsiteIsSubscribedEverUsers)
