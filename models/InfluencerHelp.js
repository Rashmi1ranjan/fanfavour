const mongoose = require('mongoose')
const Schema = mongoose.Schema

const InfluencerHelpSchema = new Schema({
    title: {
        type: String,
        index: true
    },
    popup_intro: {
        type: String
    },
    html: {
        type: String
    },
    video_title: {
        type: String
    },
    video_url: {
        type: String
    },
    pdf_title: {
        type: String
    },
    pdf_url: {
        type: String
    },
    tags: [{
        type: String
    }],
    display_as_popup: {
        type: Boolean
    },
    display_as_notification: {
        type: Boolean
    },
    exclude_from_help: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date
    },
    updatedAt: {
        type: Date
    },
    publish_date: {
        type: Date
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_visible_to_all_websites: {
        type: Boolean
    },
    visible_to_tags: [{
        type: String
    }],
    notification_expiration_date: {
        type: Date
    },
    popup_expiration_date:{
        type: Date
    },
    for_admin: {
        type: Boolean,
        default: true
    }
})

InfluencerHelpSchema.index({ exclude_from_help: 1, for_admin: 1, visible_to_tags: 1, tags: 1, display_as_notification: 1, display_as_popup: 1 })
module.exports = mongoose.model('InfluencerHelp', InfluencerHelpSchema)
