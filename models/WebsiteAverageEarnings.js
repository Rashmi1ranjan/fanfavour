const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WebsiteAverageEarnings = new Schema({
    domain: {
        type: String,
        unique: true,
        required: true
    },
    data: {
        type: Object,
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('website_average_earnings', WebsiteAverageEarnings)
