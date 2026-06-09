const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Create Schema
const WebsiteUsers = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    email: {
        type: String
    },
    domain: {
        type: String
    },
    amount_spent: {
        type: Number
    },
    name: {
        type: String
    },
    total_card_added: {
        type: Number
    },
    country: {
        type: String
    },
    registration_date: {
        type: Date
    },
    date_subscribed: {
        type: Date
    }
})

module.exports = mongoose.model('website_users', WebsiteUsers, 'dump_users')