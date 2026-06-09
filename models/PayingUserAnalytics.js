const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PayingUserAnalyticsSchema = new Schema({
    domain: {
        type: String,
        index: true
    },
    total_paying_users: {
        type: Number
    },
    month_year: {
        type: String
    },
    new_paying_users: {
        type: Number
    },
    new_registrations: {
        type: Number
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('PayingUserAnalytics', PayingUserAnalyticsSchema, 'paying_user_analytics')
