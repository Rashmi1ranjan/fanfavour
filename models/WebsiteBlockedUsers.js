const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WebsiteBlockedUsers = new Schema({
    domain_id: {
        type: Number,
        required: true
    },
    blocked_user_details: {
        type: Object,
        required: true
    },
    block_user_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('website_blocked_users', WebsiteBlockedUsers)
