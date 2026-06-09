const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ActiveUserCountSchema = Schema({
    domain: {
        type: String
    },
    active: {
        type: Number
    },
    active_cancelled: {
        type: Number
    },
    rebill_failed: {
        type: Number
    },
    target_date: {
        type: Date
    }
}, { timestamps: true })

ActiveUserCountSchema.index({ target_date: 1, domain: 1 })
module.exports = mongoose.model('active_user_count', ActiveUserCountSchema)
