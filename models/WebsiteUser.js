const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WebsiteUser = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        index: true
    },
    name: {
        type: String,
        index: true
    },
    email: {
        type: String,
        index: true
    },
    domain: {
        type: String,
        index: true
    },
    is_subscribed_ever: {
        type: Boolean,
        index: true
    },
    total_amount_spent: {
        type: Number,
        index: true
    }
}, { timestamps: true })

WebsiteUser.index({ user_id: 1, domain: 1 })

module.exports = mongoose.model('website_user', WebsiteUser, 'website_user')
