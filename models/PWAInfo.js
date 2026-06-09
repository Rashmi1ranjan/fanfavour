const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PWAInfoSchema = new Schema({
    domain: {
        type: String
    },
    user_id: {
        type: Schema.Types.ObjectId
    },
    non_pwa_user_agent: {
        type: String
    },
    non_pwa_last_seen: {
        type: Date
    },
    pwa_user_agent: {
        type: String,
        index: true
    },
    pwa_last_seen: {
        type: Date
    },
    is_running_from_pwa: {
        type: Boolean
    },
    popup_display_count: {
        type: Number,
        index: true
    },
    popup_displayed_from: {
        type: String
    },
    ccbill_subscription_status: {
        type: String
    }
}, { timestamps: true })

PWAInfoSchema.index({ domain: 1, pwa_user_agent: 1, is_running_from_pwa: 1 })
PWAInfoSchema.index({ is_running_from_pwa: 1, pwa_last_seen: 1 })

module.exports = mongoose.model('pwa_info', PWAInfoSchema, 'pwa_info')
