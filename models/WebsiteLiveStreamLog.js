const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WebsiteLiveStream = new Schema({
    domain_id: {
        type: String
    },
    domain: {
        type: String,
        index: true
    },
    stream_start_time: {
        type: Date
    },
    stream_end_time: {
        type: Date
    },
    duration: {
        type: String
    },
    stream_id: {
        type: String
    },
    username: {
        type: String
    },
    user_id: {
        type: String
    },
    tips: {
        type: Number
    },
    pre_tip: {
        type: Number
    },
    max_users: {
        type: Number
    },
    stream_type: {
        type: String
    }
},  { timestamps: true })
module.exports = mongoose.model('WebsiteLiveStreamLog', WebsiteLiveStream)
