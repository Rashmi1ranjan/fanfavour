const mongoose = require('mongoose')
const Schema = mongoose.Schema

const websiteUserStatistics = new Schema({
    domain: {
        type: String
    },
    registered: {
        type: Number
    },
    subscribed_ever: {
        type: Number
    },
    active_cancelled_subscription: {
        type: Number
    },
    active_subscription: {
        type: Number
    },
    recently_visited_all: {
        type: Number
    },
    recently_visited_subscribers_7: {
        type: Number
    },
    recently_visited_subscribers_45: {
        type: Number
    },
    recently_visited_active_cancelled_7: {
        type: Number
    },
    recently_visited_active_cancelled_45: {
        type: Number
    },
    average_monthly_revenue: {
        type: Number
    },
    current_date: {
        type: Date,
        default: Date.now
    },
    updated_date: {
        type: Date,
        default: Date.now
    },
    block_users: {
        type: Number
    }
})

module.exports = mongoose.model('websiteUserStatistics', websiteUserStatistics, 'website_user_statistics')
