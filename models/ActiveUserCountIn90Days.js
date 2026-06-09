const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ActiveUserCountIn90Days = Schema({
    domain: {
        type: String
    },
    active_users: {
        type: Number
    },
    total_amount_spent: {
        type: Number
    },
    total_active_paying_subscribers: {
        type: Number
    },
    total_active_cancelled_paying_subscribers: {
        type: Number
    }
}, { timestamps: true })

module.exports = mongoose.model('active_user_count_in_90_days', ActiveUserCountIn90Days)
