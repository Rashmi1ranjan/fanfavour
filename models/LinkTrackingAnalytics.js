const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Create Schema
const LinkTrackingAnalyticsSchema = new Schema({
    referral_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LinkTrackingReferrals'
    },
    domain: {
        type: String
    },
    visits: {
        type: Number,
        default: 0
    },
    registrations: {
        type: Number,
        default: 0
    },
    subscriptions: {
        type: Number,
        default: 0
    },
    date: {
        type: Date // Date format should be YYYY-MM-DDT00:00:00.000Z
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('link_tracking_analytics', LinkTrackingAnalyticsSchema)
