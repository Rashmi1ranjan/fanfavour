const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ActivePayingSubscribersCount = Schema({
    domain: {
        type: String
    },
    active: {
        type: Number
    },
    target_date: {
        type: Date
    }
}, { timestamps: true })

module.exports = mongoose.model('active_paying_subscribers_count', ActivePayingSubscribersCount)
