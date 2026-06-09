const mongoose = require('mongoose')
const Schema = mongoose.Schema

const InfluencerActivity = new Schema({
    domain: {
        type: String
    },
    modal_last_seen: {
        type: Date
    },
    content_manager_last_seen: {
        type: Date
    },
    date_of_last_blog_added: {
        type: Date
    },
    date_of_last_mass_message: {
        type: Date
    },
    blog_count: {
        type: Number
    },
    mass_message_count: {
        type: Number
    }
}, { timestamps: true })

module.exports = mongoose.model('influencer_activity', InfluencerActivity)
