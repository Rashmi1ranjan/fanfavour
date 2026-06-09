const mongoose = require('mongoose')
const Schema = mongoose.Schema

const LinkTrackingReferralSchema = new Schema({
    name: {
        type: String,
        index: true
    },
    created_at: {
        type: Date
    }
})

module.exports = mongoose.model('LinkTrackingReferrals', LinkTrackingReferralSchema)
