const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserHelpReadCountSchema = new Schema({
    domain: {
        type: String,
        index: true
    },
    help_id: {
        type: String
    },
    user_id: {
        type: String,
        index: true
    },
    publish_date: {
        type: Date
    },
    display_as_popup: {
        type: Boolean,
        default: false
    },
    display_as_notification: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date
    },
    updated_at: {
        type: Date
    },
    notification_expiration_date: {
        type: Date,
        default: Date.now
    }
})

UserHelpReadCountSchema.index({ domain: 1, help_id: 1, user_id: -1 })
UserHelpReadCountSchema.index({ domain: 1, help_id: 1, user_id: -1, display_as_notification: -1 })

module.exports = mongoose.model('UserHelpReadCount', UserHelpReadCountSchema)
