const mongoose = require('mongoose')
const Schema = mongoose.Schema

const websiteAnalyticsSchema = new Schema({
    domain: {
        type: String,
        index: true
    },
    date: {
        type: Date,
        index: true
    },
    registration: {
        type: Number
    },
    subscription: {
        type: Number
    },
    cancellation: {
        type: Number
    },
    subscription_revenue: {
        type: Number
    },
    blog_revenue: {
        type: Number
    },
    tip_revenue: {
        type: Number
    },
    mass_message_revenue: {
        type: Number
    },
    private_message_revenue: {
        type: Number
    }
})

module.exports = mongoose.model('websiteAnalytics', websiteAnalyticsSchema)
